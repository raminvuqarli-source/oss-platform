import { useState } from "react";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Lock, LockOpen, Thermometer, MessageSquare, Send, Loader2,
} from "lucide-react";
import type { Booking, RoomSettings, ChatMessage } from "@shared/schema";

function LockView({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: settings } = useQuery<RoomSettings>({
    queryKey: ["/api/room-settings", booking.id],
  });

  const lockMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await apiRequest("POST", `/api/door-control/${booking.id}`, { action });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/room-settings", booking.id] });
    },
    onError: (error: any) => {
      toast({ title: t("errors.somethingWentWrong"), description: error?.message, variant: "destructive" });
    },
  });

  const isLocked = settings?.doorLocked !== false;

  return (
    <div className="space-y-4" data-testid="apt-guest-lock">
      <div className="text-center space-y-2">
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-colors ${
          isLocked ? "bg-orange-500/10" : "bg-green-500/10"
        }`}>
          {isLocked ? (
            <Lock className="h-12 w-12 text-orange-500" />
          ) : (
            <LockOpen className="h-12 w-12 text-green-500" />
          )}
        </div>
        <Badge variant="secondary" className="text-sm">
          {isLocked ? t("smartRoom.locked", "Locked") : t("smartRoom.unlocked", "Unlocked")}
        </Badge>
        <p className="text-sm text-muted-foreground">Room {booking.roomNumber}</p>
      </div>
      <div className="flex gap-3 max-w-xs mx-auto">
        <Button
          className="flex-1 gap-2"
          variant="outline"
          onClick={() => lockMutation.mutate("open")}
          disabled={lockMutation.isPending || !isLocked}
          data-testid="button-guest-unlock"
        >
          <LockOpen className="h-4 w-4" />
          {t("smartRoom.unlock", "Unlock")}
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => lockMutation.mutate("close")}
          disabled={lockMutation.isPending || isLocked}
          data-testid="button-guest-lock"
        >
          <Lock className="h-4 w-4" />
          {t("smartRoom.lock", "Lock")}
        </Button>
      </div>
    </div>
  );
}

function TempView({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: settings } = useQuery<RoomSettings>({
    queryKey: ["/api/room-settings", booking.id],
  });

  const [localTemp, setLocalTemp] = useState<number | null>(null);
  const currentTemp = localTemp ?? settings?.temperature ?? 22;

  const updateTemp = useMutation({
    mutationFn: async (temperature: number) => {
      const res = await apiRequest("PATCH", `/api/room-settings/${booking.id}`, { temperature });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("smartRoom.temperatureUpdated", "Temperature updated") });
      queryClient.invalidateQueries({ queryKey: ["/api/room-settings", booking.id] });
    },
    onError: (error: any) => {
      toast({ title: t("errors.somethingWentWrong"), description: error?.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6" data-testid="apt-guest-temp">
      <div className="text-center space-y-2">
        <div className="w-24 h-24 rounded-full mx-auto bg-primary/10 flex items-center justify-center">
          <Thermometer className="h-12 w-12 text-primary" />
        </div>
        <p className="text-3xl font-bold">{currentTemp}&deg;C</p>
        <p className="text-sm text-muted-foreground">Room {booking.roomNumber}</p>
      </div>
      <div className="max-w-xs mx-auto space-y-4">
        <Slider
          value={[currentTemp]}
          min={16}
          max={30}
          step={1}
          onValueChange={([val]) => setLocalTemp(val)}
          data-testid="slider-guest-temp"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>16&deg;C</span>
          <span>30&deg;C</span>
        </div>
        <Button
          className="w-full"
          onClick={() => updateTemp.mutate(currentTemp)}
          disabled={updateTemp.isPending}
          data-testid="button-guest-set-temp"
        >
          {updateTemp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("smartRoom.setTemperature", "Set Temperature")}
        </Button>
      </div>
    </div>
  );
}

function GuestChatView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest("POST", "/api/chat/messages", {
        message: msg,
      });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
    onError: (error: any) => {
      toast({ title: t("errors.somethingWentWrong"), description: error?.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  return (
    <div className="space-y-4" data-testid="apt-guest-chat">
      <Card className="flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
        <CardContent className="flex flex-col flex-1 p-4 gap-3 min-h-0">
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid={`guest-chat-msg-${msg.id}`}>
                      <div className={`max-w-[75%] p-3 rounded-md text-sm ${
                        isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {!isOwn && <p className="text-xs font-medium mb-1 opacity-70">{msg.senderRole}</p>}
                        <p>{msg.message}</p>
                        <p className="text-[10px] opacity-50 mt-1">{new Date(msg.createdAt!).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {t("chat.noMessages", "No messages yet.")}
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("chat.typeMessage", "Type a message...")}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              data-testid="input-guest-chat"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              data-testid="button-guest-send"
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApartmentLiteGuest() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const currentView = params.get("view");

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ["/api/bookings/current"],
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto p-6 text-center" data-testid="apt-guest-no-booking">
        <Card>
          <CardContent className="p-8 text-muted-foreground">
            No active booking found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "temperature":
        return <TempView booking={booking} />;
      case "messages":
        return <GuestChatView />;
      default:
        return <LockView booking={booking} />;
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6" data-testid="apartment-lite-guest">
      {renderView()}
    </div>
  );
}
