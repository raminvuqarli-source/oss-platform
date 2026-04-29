import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";

export interface ChannexBookingEvent {
  id: string;
  guestName: string;
  checkinDate: string;
  checkoutDate: string;
  roomName: string;
  price: number | null;
  source: string;
  externalId: string;
  status: string;
  createdAt: string;
}

interface UseChannexRealtimeOptions {
  onNewBooking?: (booking: ChannexBookingEvent) => void;
  enabled?: boolean;
}

export function useChannexRealtime({
  onNewBooking,
  enabled = true,
}: UseChannexRealtimeOptions = {}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const handleNewBooking = useCallback(
    (booking: ChannexBookingEvent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

      toast({
        title: t("channex.newBookingReceived", "New Booking Received"),
        description: `${booking.guestName} — ${booking.checkinDate} → ${booking.checkoutDate} (${booking.roomName || t("channex.unknownRoom", "Unknown Room")})`,
        duration: 6000,
      });

      onNewBooking?.(booking);
    },
    [toast, t, onNewBooking]
  );

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/devices?type=dashboard`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {};

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "channex_new_booking" && msg.booking) {
            handleNewBooking(msg.booking as ChannexBookingEvent);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {}
  }, [enabled, handleNewBooking]);

  useEffect(() => {
    if (!user || !enabled) return;
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, enabled, connect]);
}
