import { useState } from "react";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, UserCheck, Lock, LockOpen, Thermometer, MessageSquare,
  Activity, Plus, Send, Loader2, Home, Calendar, Clock,
} from "lucide-react";
import type { Booking, ChatMessage } from "@shared/schema";

interface Property {
  id: string;
  name: string;
  type: string;
  city: string | null;
  country: string | null;
  totalUnits: number;
  isActive: boolean;
}

interface Unit {
  id: string;
  name: string;
  type: string;
  status: string;
  floor: number | null;
  category: string;
}

interface DoorLog {
  id: string;
  roomNumber: string;
  action: string;
  performedBy: string;
  createdAt: string;
}

function OverviewView({ properties }: { properties: Property[] | undefined }) {
  const { t } = useTranslation();

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const activeBookings = bookings?.filter(b => ["confirmed", "checked_in", "active"].includes(b.status)) || [];
  const totalUnits = properties?.reduce((sum, p) => sum + (p.totalUnits || 0), 0) || 0;

  return (
    <div className="space-y-6" data-testid="apt-lite-overview">
      <h2 className="text-2xl font-bold">{t("common.dashboard")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card data-testid="card-stat-units">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUnits}</p>
                <p className="text-xs text-muted-foreground">{t("nav.units", "Units")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-guests">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBookings.length}</p>
                <p className="text-xs text-muted-foreground">{t("nav.activeGuests", "Active Guests")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-properties">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{properties?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t("nav.properties", "Properties")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeBookings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("nav.activeGuests", "Active Guests")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/30" data-testid={`guest-row-${b.id}`}>
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Room {b.roomNumber}</p>
                    <p className="text-xs text-muted-foreground">{b.roomType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{b.status}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(b.checkOutDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LockControlView() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const activeBookings = bookings?.filter(b => ["confirmed", "checked_in", "active"].includes(b.status)) || [];

  const lockMutation = useMutation({
    mutationFn: async ({ bookingId, action }: { bookingId: string; action: string }) => {
      const res = await apiRequest("POST", `/api/door-control/${bookingId}`, { action });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({ title: t("errors.somethingWentWrong"), description: error?.message, variant: "destructive" });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6" data-testid="apt-lite-lock-control">
      <h2 className="text-2xl font-bold">{t("nav.lockControl", "Lock Control")}</h2>
      {activeBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {t("apartment.noActiveGuests", "No active guests to control locks for.")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeBookings.map(booking => (
            <Card key={booking.id} data-testid={`lock-card-${booking.id}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">Room {booking.roomNumber}</p>
                    <p className="text-xs text-muted-foreground">{booking.roomType}</p>
                  </div>
                  <Badge variant="secondary">{booking.status}</Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => lockMutation.mutate({ bookingId: booking.id, action: "open" })}
                    disabled={lockMutation.isPending}
                    data-testid={`button-unlock-${booking.id}`}
                  >
                    <LockOpen className="h-4 w-4" />
                    {t("smartRoom.unlock", "Unlock")}
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => lockMutation.mutate({ bookingId: booking.id, action: "close" })}
                    disabled={lockMutation.isPending}
                    data-testid={`button-lock-${booking.id}`}
                  >
                    <Lock className="h-4 w-4" />
                    {t("smartRoom.lock", "Lock")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemperatureView() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const activeBookings = bookings?.filter(b => ["confirmed", "checked_in", "active"].includes(b.status)) || [];

  const updateTemp = useMutation({
    mutationFn: async ({ bookingId, temperature }: { bookingId: string; temperature: number }) => {
      const res = await apiRequest("PATCH", `/api/room-settings/${bookingId}`, { temperature });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("smartRoom.temperatureUpdated", "Temperature updated") });
    },
    onError: (error: any) => {
      toast({ title: t("errors.somethingWentWrong"), description: error?.message, variant: "destructive" });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6" data-testid="apt-lite-temperature">
      <h2 className="text-2xl font-bold">{t("nav.temperature", "Temperature")}</h2>
      {activeBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {t("apartment.noActiveGuests", "No active guests to control temperature for.")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeBookings.map(booking => (
            <TemperatureCard
              key={booking.id}
              booking={booking}
              onUpdate={(temp) => updateTemp.mutate({ bookingId: booking.id, temperature: temp })}
              isPending={updateTemp.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemperatureCard({ booking, onUpdate, isPending }: { booking: Booking; onUpdate: (temp: number) => void; isPending: boolean }) {
  const { t } = useTranslation();
  const { data: settings } = useQuery<any>({
    queryKey: ["/api/room-settings", booking.id],
  });

  const [localTemp, setLocalTemp] = useState<number | null>(null);
  const currentTemp = localTemp ?? settings?.temperature ?? 22;

  return (
    <Card data-testid={`temp-card-${booking.id}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold">Room {booking.roomNumber}</p>
            <p className="text-xs text-muted-foreground">{booking.roomType}</p>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{currentTemp}&deg;C</span>
          </div>
        </div>
        <Slider
          value={[currentTemp]}
          min={16}
          max={30}
          step={1}
          onValueChange={([val]) => setLocalTemp(val)}
          data-testid={`slider-temp-${booking.id}`}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>16&deg;C</span>
          <span>30&deg;C</span>
        </div>
        <Button
          className="w-full"
          onClick={() => onUpdate(currentTemp)}
          disabled={isPending}
          data-testid={`button-set-temp-${booking.id}`}
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("smartRoom.setTemperature", "Set Temperature")}
        </Button>
      </CardContent>
    </Card>
  );
}

function ChatView() {
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
        threadType: "internal",
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
    <div className="space-y-4" data-testid="apt-lite-chat">
      <h2 className="text-2xl font-bold">{t("nav.chat", "Chat")}</h2>
      <Card className="flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
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
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid={`chat-msg-${msg.id}`}>
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
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              data-testid="button-send-chat"
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityLogsView() {
  const { t } = useTranslation();

  const { data: logs, isLoading } = useQuery<DoorLog[]>({
    queryKey: ["/api/door-logs"],
  });

  return (
    <div className="space-y-4" data-testid="apt-lite-activity-logs">
      <h2 className="text-2xl font-bold">{t("nav.activityLogs", "Activity Logs")}</h2>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y divide-border/50">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-4 p-4 flex-wrap" data-testid={`log-row-${log.id}`}>
                  <div className="flex items-center gap-3">
                    {log.action === "open" ? (
                      <LockOpen className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-orange-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Room {log.roomNumber} — {log.action === "open" ? t("smartRoom.unlocked", "Unlocked") : t("smartRoom.locked", "Locked")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("common.by", "By")}: {log.performedBy}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t("apartment.noActivityLogs", "No activity logs yet.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GuestsView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestRoom, setGuestRoom] = useState("");
  const [guestRoomType, setGuestRoomType] = useState("apartment");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const createGuestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings", {
        guestName: guestName,
        roomNumber: guestRoom,
        roomType: guestRoomType,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        status: "confirmed",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("apartment.guestAdded", "Guest added successfully") });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setAddOpen(false);
      setGuestName("");
      setGuestRoom("");
      setCheckIn("");
      setCheckOut("");
    },
    onError: (error: any) => {
      toast({ title: t("errors.somethingWentWrong"), description: error?.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4" data-testid="apt-lite-guests">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">{t("nav.guests", "Guests")}</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-guest">
              <Plus className="h-4 w-4" />
              {t("apartment.addGuest", "Add Guest")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("apartment.addGuest", "Add Guest")}</DialogTitle>
              <DialogDescription>{t("apartment.addGuestDesc", "Manually add a guest with check-in and check-out dates.")}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("common.name", "Name")}</Label>
                  <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={t("apartment.guestNamePlaceholder", "Guest full name")} data-testid="input-guest-name" />
                </div>
                <div className="space-y-2">
                  <Label>{t("apartment.unitRoom", "Unit / Room Number")}</Label>
                  <Input value={guestRoom} onChange={(e) => setGuestRoom(e.target.value)} placeholder="e.g. 101" data-testid="input-guest-room" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("booking.checkIn", "Check-in")}</Label>
                    <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} data-testid="input-check-in" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("booking.checkOut", "Check-out")}</Label>
                    <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} data-testid="input-check-out" />
                  </div>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button
                onClick={() => createGuestMutation.mutate()}
                disabled={!guestName || !guestRoom || !checkIn || !checkOut || createGuestMutation.isPending}
                data-testid="button-confirm-add-guest"
              >
                {createGuestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("apartment.addGuest", "Add Guest")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="divide-y divide-border/50">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 p-4 flex-wrap" data-testid={`guest-booking-${b.id}`}>
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Room {b.roomNumber}</p>
                      <p className="text-xs text-muted-foreground">{b.roomType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{b.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t("apartment.noGuests", "No guests yet. Add a guest to get started.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApartmentLiteDashboard() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const currentView = params.get("view");

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const renderView = () => {
    switch (currentView) {
      case "properties":
        return <GuestsView />;
      case "guests-overview":
        return <GuestsView />;
      case "lock-control":
        return <LockControlView />;
      case "temperature":
        return <TemperatureView />;
      case "staff-chat":
        return <ChatView />;
      case "activity-logs":
        return <ActivityLogsView />;
      default:
        return <OverviewView properties={properties} />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="apartment-lite-dashboard">
      {renderView()}
    </div>
  );
}
