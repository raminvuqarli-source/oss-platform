import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";

const NOTIFICATION_SOUND_FREQUENCY = 800;
const NOTIFICATION_SOUND_DURATION = 150;

let swRegistration: ServiceWorkerRegistration | null = null;
let swReady = false;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    swRegistration = reg;
    swReady = true;
    return reg;
  } catch (e) {
    console.warn("SW registration failed:", e);
    return null;
  }
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(NOTIFICATION_SOUND_FREQUENCY, audioContext.currentTime);
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + NOTIFICATION_SOUND_DURATION / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + NOTIFICATION_SOUND_DURATION / 1000);

    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(1000, audioContext.currentTime);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + NOTIFICATION_SOUND_DURATION / 1000);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + NOTIFICATION_SOUND_DURATION / 1000);
    }, 180);
  } catch (e) {
  }
}

export async function showPushNotification(title: string, body: string, url?: string) {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
  }

  if (swReady && swRegistration) {
    try {
      await swRegistration.showNotification(title, {
        body,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: "oss-msg-" + Date.now(),
        vibrate: [200, 100, 200],
        data: { url: url || "/" },
      } as NotificationOptions);
      return;
    } catch (e) {
      console.warn("SW showNotification failed, falling back:", e);
    }
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: "oss-msg-" + Date.now(),
        vibrate: [200, 100, 200],
        data: { url: url || "/" },
      } as NotificationOptions);
      return;
    }
  } catch (e) {
    console.warn("SW ready showNotification failed:", e);
  }

  new Notification(title, {
    body,
    icon: "/favicon.png",
  });
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

export function useNotificationAlert(notifications: NotificationItem[] | undefined) {
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    registerServiceWorker();
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
      showPushNotification(
        latest.title,
        latest.message,
        latest.actionUrl || undefined
      );
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

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "new_notification") {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            playNotificationSound();
            if (msg.title) {
              showPushNotification(msg.title, msg.message || "", msg.actionUrl);
            }
          }
        } catch {}
      };

      ws.onclose = () => {
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
