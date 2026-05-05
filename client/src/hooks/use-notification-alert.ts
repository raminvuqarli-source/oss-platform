import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";

let lastSoundAt = 0;
let beepAudio: HTMLAudioElement | null = null;
let beepUnlocked = false;

function buildBeepWav(freq = 800, durationMs = 200, sampleRate = 8000): Blob {
  const numSamples = Math.floor(sampleRate * durationMs / 1000);
  const buf = new ArrayBuffer(44 + numSamples * 2);
  const v = new DataView(buf);
  const s = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  s(0, "RIFF"); v.setUint32(4, 36 + numSamples * 2, true);
  s(8, "WAVE"); s(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  s(36, "data"); v.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const env = i < numSamples * 0.05 ? i / (numSamples * 0.05)
      : i > numSamples * 0.6 ? (numSamples - i) / (numSamples * 0.4) : 1;
    v.setInt16(44 + i * 2, Math.round(18000 * env * Math.sin(2 * Math.PI * freq * i / sampleRate)), true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

function initBeepAudio() {
  if (typeof window === "undefined" || beepAudio) return;
  try {
    const url = URL.createObjectURL(buildBeepWav());
    beepAudio = new Audio(url);
    beepAudio.volume = 0.6;
  } catch {}
}

function unlockBeepAudio() {
  if (beepUnlocked || !beepAudio) return;
  beepAudio.play().then(() => {
    beepAudio!.pause();
    beepAudio!.currentTime = 0;
    beepUnlocked = true;
  }).catch(() => {});
}

if (typeof window !== "undefined") {
  initBeepAudio();
  const unlockOnce = () => {
    unlockBeepAudio();
    window.removeEventListener("click", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
    window.removeEventListener("touchstart", unlockOnce);
  };
  window.addEventListener("click", unlockOnce);
  window.addEventListener("keydown", unlockOnce);
  window.addEventListener("touchstart", unlockOnce);
}

async function playNotificationSound() {
  const now = Date.now();
  if (now - lastSoundAt < 1500) return;
  lastSoundAt = now;

  if (beepAudio) {
    try {
      beepAudio.currentTime = 0;
      await beepAudio.play();
      return;
    } catch {}
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
  const suppressNextCheckRef = useRef(false);
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

    // WebSocket already showed this notification — just update IDs, skip sound/toast
    if (suppressNextCheckRef.current) {
      suppressNextCheckRef.current = false;
      prevUnreadIdsRef.current = currentUnreadIds;
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

    fetch("/api/ws-token", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(data => {
        if (!mountedRef.current) return;
        try {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const tokenParam = data?.token ? `&wsToken=${encodeURIComponent(data.token)}` : "";
          const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard${tokenParam}`);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log("[WS] Dashboard WebSocket connected");
          };

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data as string);
              if (msg.type === "new_notification") {
                // Show notification immediately via WebSocket
                playNotificationSound();
                if (msg.title) {
                  onNewMessageRef.current?.(msg.title, msg.message || "");
                  showPushNotification(msg.title, msg.message || "", msg.actionUrl);
                }
                // Suppress the next polling check so it won't duplicate
                suppressNextCheckRef.current = true;
                queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
      });
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
