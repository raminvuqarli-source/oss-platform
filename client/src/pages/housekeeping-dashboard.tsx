import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { showErrorToast } from "@/lib/error-handler";
import { HousekeepingView } from "@/components/housekeeping-view";
import { StaffMyPerformance } from "@/components/staff-my-performance";
import { formatTimeAgo } from "@/lib/formatters";
import type { Booking, ChatMessage, User } from "@shared/schema";
import {
  BedDouble,
  ClipboardList,
  Star,
  CalendarDays,
  MessageSquare,
  DoorOpen,
  Activity,
  Send,
  Loader2,
  Calendar,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface RoomUnit {
  id: string;
  unitNumber: string;
  unitType: string;
  status: string;
  floor?: number;
  hasActiveBooking?: boolean;
  activeBookingStatus?: string;
}

interface StaffDmConversation {
  peerId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

const ROOM_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ready:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  occupied:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  dirty:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  cleaning:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  out_of_order: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function RoomsView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: units, isLoading } = useQuery<RoomUnit[]>({
    queryKey: ["/api/units/status"],
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/units/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/units/status"] });
      toast({ title: t("hkDash.statusUpdated", "Room status updated") });
    },
    onError: () => toast({ title: t("hkDash.error", "An error occurred"), variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="hk-rooms-loading">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <Card data-testid="hk-rooms-empty">
        <CardContent className="p-8 text-center text-muted-foreground">
          <BedDouble className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>{t('roomStatus.noRooms', 'No rooms found.')}</p>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = {
    occupied: units.filter(u => u.status === "occupied").length,
    ready:    units.filter(u => u.status === "ready" || u.status === "available").length,
    dirty:    units.filter(u => u.status === "dirty").length,
    cleaning: units.filter(u => u.status === "cleaning").length,
    out_of_order: units.filter(u => u.status === "out_of_order" || u.status === "maintenance").length,
  };

  return (
    <div className="space-y-5" data-testid="hk-rooms-panel">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-center" data-testid="hk-count-occupied">
          <div className="text-3xl font-bold text-red-700 dark:text-red-300">{statusCounts.occupied}</div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{t('roomStatus.occupied', 'Dolu')}</div>
        </div>
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-center" data-testid="hk-count-ready">
          <div className="text-3xl font-bold text-green-700 dark:text-green-300">{statusCounts.ready}</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{t('roomStatus.ready', 'Boş / Hazır')}</div>
        </div>
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-center" data-testid="hk-count-dirty">
          <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{statusCounts.dirty}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">{t('roomStatus.dirty', 'Çirkli')}</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center" data-testid="hk-count-cleaning">
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{statusCounts.cleaning}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{t('roomStatus.cleaning', 'Təmizlənir')}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/20 text-center" data-testid="hk-count-oo">
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{statusCounts.out_of_order}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('roomStatus.outOfOrder', 'Sıradan çıxıb')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {units.map(unit => (
          <Card key={unit.id} className={`overflow-visible ${unit.status === "dirty" ? "border-2 border-yellow-300 dark:border-yellow-700" : unit.status === "cleaning" ? "border-2 border-blue-300 dark:border-blue-700" : ""}`} data-testid={`hk-room-${unit.unitNumber}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-base" data-testid={`hk-room-num-${unit.unitNumber}`}>
                    {unit.unitNumber}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{unit.unitType?.replace(/_/g, ' ')}</span>
                </div>
                <Badge className={ROOM_STATUS_COLORS[unit.status] || ROOM_STATUS_COLORS.available}>
                  {t(`roomStatus.${unit.status}`, unit.status)}
                </Badge>
              </div>
              {unit.hasActiveBooking && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    {t('roomStatus.activeBooking', 'Aktiv bron')} ({unit.activeBookingStatus})
                  </Badge>
                </div>
              )}
              {unit.floor !== undefined && unit.floor !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {unit.floor === 0 ? t('roomStatus.groundFloor', 'Zemin mərtəbə') :
                   unit.floor < 0 ? `B${Math.abs(unit.floor)}` :
                   `${unit.floor}. ${t('roomStatus.floor', 'mərtəbə')}`}
                </p>
              )}
              {/* Action buttons for cleanable rooms */}
              {(unit.status === "dirty" || unit.status === "cleaning") && (
                <div className="flex gap-2 mt-3">
                  {unit.status === "dirty" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => updateStatus.mutate({ id: unit.id, status: "cleaning" })}
                      disabled={updateStatus.isPending}
                      data-testid={`hk-btn-start-${unit.id}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      {t("hkDash.startCleaning", "Cleaning")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white font-bold"
                    onClick={() => updateStatus.mutate({ id: unit.id, status: "ready" })}
                    disabled={updateStatus.isPending}
                    data-testid={`hk-btn-ready-${unit.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {t("hkDash.markReady", "READY")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HkCalendarView() {
  const { t } = useTranslation();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = (bookings || [])
    .filter(b => new Date(b.checkOutDate) >= today)
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

  const grouped: Record<string, { checkIns: Booking[]; checkOuts: Booking[] }> = {};
  upcoming.forEach(booking => {
    const inKey  = new Date(booking.checkInDate).toLocaleDateString("en-CA");
    const outKey = new Date(booking.checkOutDate).toLocaleDateString("en-CA");
    if (!grouped[inKey])  grouped[inKey]  = { checkIns: [], checkOuts: [] };
    if (!grouped[outKey]) grouped[outKey] = { checkIns: [], checkOuts: [] };
    grouped[inKey].checkIns.push(booking);
    if (inKey !== outKey) grouped[outKey].checkOuts.push(booking);
  });

  const sortedDates = Object.keys(grouped).sort();

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const todayStr = new Date().toLocaleDateString("en-CA");
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA");
    if (dateStr === todayStr) return t('calendar.today', 'Bu gün');
    if (dateStr === tomorrowStr) return t('calendar.tomorrow', 'Sabah');
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  };

  if (sortedDates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>{t('calendar.noUpcoming', 'Gələcək bron yoxdur')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="hk-calendar">
      {sortedDates.map(dateStr => {
        const { checkIns, checkOuts } = grouped[dateStr];
        return (
          <div key={dateStr} className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{formatLabel(dateStr)}</h4>
            {checkIns.map(b => (
              <Card key={`in-${b.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/10 shrink-0">
                    <DoorOpen className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{b.guestName || t('common.guest', 'Qonaq')}</p>
                    <p className="text-xs text-muted-foreground">{t('bookings.checkIn', 'Giriş')} · {t('common.room', 'Otaq')} {b.roomNumber}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {checkOuts.map(b => (
              <Card key={`out-${b.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-500/10 shrink-0">
                    <DoorOpen className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{b.guestName || t('common.guest', 'Qonaq')}</p>
                    <p className="text-xs text-muted-foreground">{t('bookings.checkOut', 'Çıxış')} · {t('common.room', 'Otaq')} {b.roomNumber}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function HkMessagesView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: staffUsers } = useQuery<Array<Omit<User, "password">>>({
    queryKey: ["/api/users/staff"],
  });

  const { data: dmConversations } = useQuery<StaffDmConversation[]>({
    queryKey: ["/api/chat/staff-dm/conversations"],
    refetchInterval: 10000,
  });

  const { data: dmMessages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/staff-dm", selectedStaffId],
    enabled: !!selectedStaffId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [dmMessages]);

  const sendMutation = useMutation({
    mutationFn: async ({ staffId, msg }: { staffId: string; msg: string }) => {
      const res = await apiRequest("POST", `/api/chat/staff-dm/${staffId}`, { message: msg });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", selectedStaffId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm/conversations"] });
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    onError: (err: Error) => showErrorToast(toast, err),
  });

  const handleSend = () => {
    if (!selectedStaffId || !message.trim()) return;
    sendMutation.mutate({ staffId: selectedStaffId, msg: message.trim() });
  };

  const managerPeers = (staffUsers || []).filter(s =>
    s.id !== currentUser?.id &&
    ["admin", "property_manager", "owner_admin", "reception"].includes(s.role ?? "")
  );

  const selectedPeer = staffUsers?.find(s => s.id === selectedStaffId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]" data-testid="hk-messages">
      <Card className="md:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("staffChat.managers", "Müdirlər")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {managerPeers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("staffChat.noManagers", "Müdir tapılmadı")}
              </div>
            ) : (
              <div className="divide-y">
                {managerPeers.map(peer => {
                  const conv = dmConversations?.find(c => c.peerId === peer.id);
                  return (
                    <div
                      key={peer.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${selectedStaffId === peer.id ? "bg-muted" : ""}`}
                      onClick={() => {
                        setSelectedStaffId(peer.id);
                        queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", peer.id] });
                      }}
                      data-testid={`hk-dm-peer-${peer.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {peer.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-sm truncate">{peer.fullName}</span>
                            {conv?.lastMessageAt && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv?.lastMessage || t("staffChat.noMessages", "Hələ mesaj yoxdur")}
                          </p>
                          {conv?.unreadCount > 0 && (
                            <Badge className="mt-1 text-xs" variant="destructive">{conv.unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {!selectedStaffId ? (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("staffChat.selectPeer", "Söhbət başlatmaq üçün müdiri seçin")}</p>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-3 flex-shrink-0 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {selectedPeer?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                {selectedPeer?.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-3/4" />)}
                  </div>
                ) : !dmMessages || dmMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    {t("staffChat.noMessages", "Hələ mesaj yoxdur")}
                  </div>
                ) : (
                  <div className="space-y-3" ref={scrollRef}>
                    {dmMessages.map(msg => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`hk-msg-${msg.id}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                            <p>{msg.message}</p>
                            <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatTimeAgo(msg.createdAt?.toString() ?? "")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder={t("staffChat.typeMessage", "Mesaj yazın...")}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1"
                  data-testid="hk-input-message"
                />
                <Button onClick={handleSend} disabled={sendMutation.isPending || !message.trim()} size="icon" data-testid="hk-btn-send">
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

const VIEWS = [
  { id: "rooms",    labelKey: "hkDash.rooms",    icon: BedDouble },
  { id: "tasks",    labelKey: "hkDash.tasks",    icon: ClipboardList },
  { id: "rating",   labelKey: "hkDash.rating",   icon: Star },
  { id: "calendar", labelKey: "hkDash.calendar", icon: CalendarDays },
  { id: "messages", labelKey: "hkDash.messages", icon: MessageSquare },
];

export default function HousekeepingDashboard() {
  const { t } = useTranslation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const viewParam = params.get("view") || "rooms";

  const currentView = VIEWS.find(v => v.id === viewParam) ? viewParam : "rooms";

  const setView = (v: string) => {
    const url = v === "rooms" ? "/dashboard" : `/dashboard?view=${v}`;
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 flex-wrap" data-testid="hk-view-tabs">
        {VIEWS.map(v => {
          const Icon = v.icon;
          const active = currentView === v.id;
          return (
            <Button
              key={v.id}
              variant={active ? "default" : "outline"}
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={() => setView(v.id)}
              data-testid={`hk-tab-${v.id}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(v.labelKey)}
            </Button>
          );
        })}
      </div>

      <div data-testid={`hk-view-content-${currentView}`}>
        {currentView === "rooms"    && <RoomsView />}
        {currentView === "tasks"    && <HousekeepingView />}
        {currentView === "rating"   && <StaffMyPerformance />}
        {currentView === "calendar" && <HkCalendarView />}
        {currentView === "messages" && <HkMessagesView />}
      </div>
    </div>
  );
}
