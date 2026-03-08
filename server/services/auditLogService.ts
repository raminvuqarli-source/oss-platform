import { storage } from "../storage";
import type { InsertAuditLog } from "@shared/schema";
import { logger } from "../utils/logger";

const auditLogger = logger.child({ module: "audit-log" });

interface AuditLogParams {
  tenantId?: string | null;
  userId: string;
  userRole?: string;
  ownerId?: string | null;
  propertyId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAction(params: AuditLogParams): Promise<void> {
  try {
    const logEntry: InsertAuditLog = {
      tenantId: params.tenantId || null,
      userId: params.userId,
      userRole: params.userRole || null,
      ownerId: params.ownerId || null,
      propertyId: params.propertyId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      description: params.description || null,
      previousValues: params.previousValues || null,
      newValues: params.newValues || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    };

    await storage.createAuditLog(logEntry);
    auditLogger.debug({ action: params.action, entityType: params.entityType, entityId: params.entityId }, "Audit log created");
  } catch (err: any) {
    auditLogger.error({ err: err.message, action: params.action }, "Failed to create audit log");
  }
}

export function logActionAsync(params: AuditLogParams): void {
  logAction(params).catch(() => {});
}
