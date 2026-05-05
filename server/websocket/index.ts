import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import { notifyDeviceAlert } from "../notifications";
import type { Express, Request, Response, NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware";
import { sessionStore } from "../routes/auth.routes";
import cookie from "cookie";
import signature from "cookie-signature";

const deviceConnections = new Map<string, { ws: WebSocket; deviceId: string; tenantId: string }>();
const ownerConnections = new Map<string, Set<WebSocket>>();
const userConnections = new Map<string, Set<WebSocket>>();

function broadcastToOwner(ownerId: string, message: any) {
  const clients = ownerConnections.get(ownerId);
  if (clients) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

export function broadcastToUser(userId: string, message: any) {
  const clients = userConnections.get(userId);
  if (clients) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

// Exported so other modules can push real-time events to all staff of a tenant
export function broadcastToTenant(tenantId: string, message: any) {
  broadcastToOwner(tenantId, message);
}

// Alias using propertyId — resolved at the call site by the caller
export function broadcastToProperty(propertyId: string, message: any) {
  // We broadcast to all tenants that have this propertyId in their connection set.
  // Since connections are keyed by tenantId (ownerId), we iterate all and let clients filter.
  ownerConnections.forEach((clients, _tenantId) => {
    const data = JSON.stringify({ ...message, propertyId });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
}

function parseSessionId(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = cookie.parse(cookieHeader);
  const raw = cookies["connect.sid"];
  if (!raw) return null;

  const secret = process.env.SESSION_SECRET || "oss-hotel-dev-secret-key";
  if (raw.startsWith("s:")) {
    const unsigned = signature.unsign(raw.slice(2), secret);
    return unsigned === false ? null : unsigned;
  }
  return raw;
}

function getSessionData(sessionId: string): Promise<{ userId?: string; demoSessionTenantId?: string } | null> {
  return new Promise((resolve) => {
    sessionStore.get(sessionId, (err, session) => {
      if (err || !session) return resolve(null);
      resolve(session as any);
    });
  });
}

export function initWebSocket(httpServer: Server, app: Express): void {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/devices" });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const deviceId = url.searchParams.get("deviceId");
    const clientType = url.searchParams.get("type") || "dashboard";

    const sessionId = parseSessionId(req.headers.cookie);
    if (!sessionId) {
      ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
      ws.close(4001, "Unauthorized");
      return;
    }

    const sessionData = await getSessionData(sessionId);
    if (!sessionData?.userId) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid or expired session" }));
      ws.close(4001, "Unauthorized");
      return;
    }

    const user = await storage.getUser(sessionData.userId);
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      ws.close(4001, "Unauthorized");
      return;
    }

    let authenticatedTenantId: string | null = null;
    if (user.username?.startsWith("demo_") && sessionData.demoSessionTenantId) {
      authenticatedTenantId = sessionData.demoSessionTenantId;
    } else {
      authenticatedTenantId = user.tenantId || user.ownerId || null;
      if (!authenticatedTenantId && user.hotelId) {
        const hotel = await storage.getHotel(user.hotelId);
        if (hotel?.ownerId) {
          authenticatedTenantId = hotel.ownerId;
        } else if (hotel?.propertyId) {
          const property = await storage.getProperty(hotel.propertyId);
          authenticatedTenantId = property?.ownerId || null;
        }
      }
      if (!authenticatedTenantId && user.propertyId) {
        const property = await storage.getProperty(user.propertyId);
        authenticatedTenantId = property?.ownerId || null;
      }
    }

    if (clientType === "device" && deviceId && authenticatedTenantId) {
      storage.getDevice(deviceId).then(device => {
        if (!device || (device.ownerId !== authenticatedTenantId && device.tenantId !== authenticatedTenantId)) {
          ws.send(JSON.stringify({ type: "error", message: "Device not found or ownership mismatch" }));
          ws.close(4001, "Unauthorized");
          return;
        }
        deviceConnections.set(deviceId, { ws, deviceId, tenantId: authenticatedTenantId! });
        storage.updateDevice(deviceId, { status: "online", lastOnline: new Date(), lastPing: new Date() }).catch(() => {});
        broadcastToOwner(authenticatedTenantId!, { type: "device_status", deviceId, status: "online", timestamp: new Date().toISOString() });
      }).catch(() => {
        ws.close(4002, "Internal error");
      });
    } else if (clientType === "dashboard" && authenticatedTenantId) {
      if (!ownerConnections.has(authenticatedTenantId)) {
        ownerConnections.set(authenticatedTenantId, new Set());
      }
      ownerConnections.get(authenticatedTenantId)!.add(ws);

      const uid = String(user.id);
      if (!userConnections.has(uid)) {
        userConnections.set(uid, new Set());
      }
      userConnections.get(uid)!.add(ws);
    } else {
      ws.send(JSON.stringify({ type: "error", message: "Invalid connection parameters or missing tenant context" }));
      ws.close(4001, "Unauthorized");
      return;
    }

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "device_telemetry":
            if (deviceId && authenticatedTenantId) {
              await storage.createDeviceTelemetry({
                deviceId,
                metricName: message.metricName,
                metricValue: message.metricValue,
                stringValue: message.stringValue,
              });
              await storage.updateDevice(deviceId, { lastPing: new Date() });
              broadcastToOwner(authenticatedTenantId, { type: "telemetry_update", deviceId, ...message });
            }
            break;
          
          case "device_command":
            if (!authenticatedTenantId) break;
            const targetDeviceConn = deviceConnections.get(message.targetDeviceId);
            if (targetDeviceConn && targetDeviceConn.tenantId === authenticatedTenantId) {
              targetDeviceConn.ws.send(JSON.stringify({ type: "command", command: message.command, params: message.params }));
            } else if (targetDeviceConn) {
              ws.send(JSON.stringify({ type: "error", message: "Access denied: device belongs to a different tenant" }));
            }
            break;
          
          case "device_status_update":
            if (deviceId && authenticatedTenantId) {
              await storage.updateDevice(deviceId, { status: message.status });
              broadcastToOwner(authenticatedTenantId, { type: "device_status", deviceId, status: message.status, timestamp: new Date().toISOString() });
            }
            break;
          
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
            if (deviceId) {
              await storage.updateDevice(deviceId, { lastPing: new Date() });
            }
            break;
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      if (clientType === "device" && deviceId) {
        deviceConnections.delete(deviceId);
        storage.updateDevice(deviceId, { status: "offline" }).catch(() => {});
        if (authenticatedTenantId) {
          broadcastToOwner(authenticatedTenantId, { type: "device_status", deviceId, status: "offline", timestamp: new Date().toISOString() });
          storage.getDevice(deviceId).then(dev => {
            if (dev) {
              notifyDeviceAlert({
                deviceName: dev.name,
                deviceType: dev.deviceType,
                status: "offline",
                propertyId: dev.propertyId,
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      } else if (clientType === "dashboard" && authenticatedTenantId) {
        ownerConnections.get(authenticatedTenantId)?.delete(ws);
        const uid = String(user.id);
        userConnections.get(uid)?.delete(ws);
        if (userConnections.get(uid)?.size === 0) userConnections.delete(uid);
      }
    });

    ws.send(JSON.stringify({ type: "connected", clientType, timestamp: new Date().toISOString() }));
  });

  app.get("/api/ws/info", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ connected: 0 });
      
      const connectedDevices = Array.from(deviceConnections.values())
        .filter(c => c.tenantId === user.ownerId)
        .map(c => c.deviceId);
      
      res.json({ 
        connectedDevices, 
        connectedCount: connectedDevices.length,
        dashboardClients: ownerConnections.get(user.ownerId)?.size || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get WS info" });
    }
  });
}
