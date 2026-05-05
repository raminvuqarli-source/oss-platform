import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";

const NOTIFICATION_SOUND_FREQUENCY = 800;
const NOTIFICATION_SOUND_DURATION = 150;

let sharedAudioContext: AudioContext | null = null;
let lastSoundAt = 0;
let audioContextWarmedUp = false;

function warmUpAudioContext() {
  if (audioContextWarmedUp) return;
  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume().catch(() => {});
    }
    audioContextWarmedUp = true;
  } catch {}
}

if (typeof window !== "undefined") {
  const warmOnce = () => {
    warmUpAudioContext();
    window.removeEventListener("click", warmOnce);
    window.removeEventListener("keydown", warmOnce);
    window.removeEventListener("touchstart", warmOnce);
  };
  window.addEventListener("click", warmOnce);
  window.addEventListener("keydown", warmOnce);
  window.addEventListener("touchstart", warmOnce);
}

async function playNotificationSound() {
  const now = Date.now();
  if (now - lastSoundAt < 1500) return;
  lastSoundAt = now;

  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = sharedAudioContext;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const playTone = (freq: number, delayMs: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delayMs / 1000);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delayMs / 1000 + NOTIFICATION_SOUND_DURATION / 1000);
      osc.start(ctx.currentTime + delayMs / 1000);
      osc.stop(ctx.currentTime + delayMs / 1000 + NOTIFICATION_SOUND_DURATION / 1000);
    };

    playTone(NOTIFICATION_SOUND_FREQUENCY, 0);
    playTone(1000, 180);
  } catch (e) {
    console.warn("[Notification] Sound error:", e);
  }
}

export async function showPushNotification(title: string, body: string, url?: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "oss-msg-" + Date.now(),
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: { url: url || "/" },
      } as NotificationOptions);
      return;
    }
  } catch (e) {
    console.warn("[Notification] SW showNotification failed:", e);
  }

  try {
    new Notification(title, { body, icon: "/icon-192.png" });
  } catch (e) {
    console.warn("[Notification] Fallback notification failed:", e);
  }
}

interface NotificationItem {
  id: string;
  read: boolean;
  title: string;
  message: string;
  type: string;
  actionUrl?: string | null;
  createdAt: string | null;
}

export function useNotificationAlert(
  notifications: NotificationItem[] | undefined,
  onNewMessage?: (title: string, message: string) => void
) {
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const checkNewNotifications = useCallback(() => {
    if (!notifications) return;

    const currentUnread = notifications.filter((n) => !n.read);
    const currentUnreadIds = new Set(currentUnread.map((n) => n.id));

    if (isInitialLoadRef.current) {
      prevUnreadIdsRef.current = currentUnreadIds;
      isInitialLoadRef.current = false;
      return;
    }

    const newNotifications = currentUnread.filter(
      (n) => !prevUnreadIdsRef.current.has(n.id)
    );

    if (newNotifications.length > 0) {
      playNotificationSound();
      const latest = newNotifications[0];
      showPushNotification(latest.title, latest.message, latest.actionUrl || undefined);
    }

    prevUnreadIdsRef.current = currentUnreadIds;
  }, [notifications]);

  useEffect(() => {
    checkNewNotifications();
  }, [checkNewNotifications]);

  const connectWs = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Dashboard WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "new_notification") {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            playNotificationSound();
            if (msg.title) {
              onNewMessageRef.current?.(msg.title, msg.message || "");
              showPushNotification(msg.title, msg.message || "", msg.actionUrl);
            }
          }
        } catch {}
      };

      ws.onclose = (ev) => {
        console.log("[WS] Dashboard WebSocket closed, code:", ev.code);
        if (!mountedRef.current) return;
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connectWs();
        }, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connectWs();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWs]);
}
