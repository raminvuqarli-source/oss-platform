import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { navigate } from "wouter/use-browser-location";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ActionCard } from "@/components/action-card";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Booking, ServiceRequest, ChatMessage, RoomPreparationOrder } from "@shared/schema";
import {
  MessageSquare, UtensilsCrossed, Bell, PartyPopper,
  Lightbulb, ClipboardList, CheckCircle, Sparkles,
  DoorOpen, Calendar, Loader2, Send, Coffee,
  Car, SprayCan, Wrench, HelpCircle, ArrowRight, User, Settings, LayoutDashboard,
} from "lucide-react";

const SERVICE_TYPES = [
  { value: "coffee", key: "coffee", icon: Coffee, color: "bg-amber-500" },
  { value: "taxi", key: "taxi", icon: Car, color: "bg-blue-500" },
  { value: "room_service", key: "roomService", icon: UtensilsCrossed, color: "bg-orange-500" },
  { value: "housekeeping", key: "housekeeping", icon: SprayCan, color: "bg-teal-500" },
  { value: "maintenance", key: "maintenance", icon: Wrench, color: "bg-red-500" },
  { value: "concierge", key: "guestExperienceServices", icon: HelpCircle, color: "bg-purple-500" },
];

function ServiceRequestPanel({ booking, onClose }: { booking: Booking | null | undefined; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { requestType: string; description: string }) => {
      const res = await apiRequest("POST", "/api/service-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      onClose();
      toast({ title: t("requests.submitted", "Request submitted") });
    },
    onError: () => toast({ title: t("common.error", "Error"), variant: "destructive" }),
  });

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {SERVICE_TYPES.map(s => (
          <button
            key={s.value}
            onClick={() => setSelectedService(s.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              selectedService === s.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:border-muted-foreground/30"
            }`}
            data-testid={`btn-service-${s.value}`}
          >
            <div className={`p-2 rounded-lg ${s.color}/10`}>
              <s.icon className="h-4 w-4 text-foreground/70" />
            </div>
            <span className="text-[11px] text-center leading-tight">
              {t(`services.${s.key}`, s.key)}
            </span>
          </button>
        ))}
      </div>
      {selectedService && (
        <Textarea
          placeholder={t("services.describeRequest", "Describe your request...")}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          data-testid="textarea-guest-request"
        />
      )}
      <Button
        className="w-full"
        onClick={() => createMutation.mutate({ requestType: selectedService, description })}
        disabled={!selectedService || !description.trim() || createMutation.isPending}
        data-testid="button-submit-guest-request"
      >
        {createMutation.isPending
          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
          : <Send className="h-4 w-4 mr-2" />
        }
        {t("chat.send", "Send")}
      </Button>
    </div>
  );
}

function WaiterPanel({ booking }: { booking: Booking | null | undefined }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const callWaiterMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/restaurant/waiter-call", {
        roomNumber: (booking as any)?.unitId,
        bookingId: booking?.id,
      }),
    onSuccess: () => toast({ title: t("restaurant.waiterCalled", "Waiter notified") }),
    onError: () => toast({ title: t("common.error", "Error"), variant: "destructive" }),
  });

  return (
    <div className="p-4 space-y-3">
      <Button
        className="w-full h-14 text-base gap-2 bg-orange-500 hover:bg-orange-600 text-white"
        onClick={() => callWaiterMutation.mutate()}
        disabled={callWaiterMutation.isPending}
        data-testid="button-call-waiter-hub"
      >
        {callWaiterMutation.isPending
          ? <Loader2 className="h-5 w-5 animate-spin" />
          : <Bell className="h-5 w-5" />
        }
        {t("restaurant.callWaiter", "Call Waiter")}
      </Button>
      <Button
        variant="outline"
        className="w-full h-14 text-base gap-2"
        onClick={() => navigate("/dashboard?view=restaurant")}
        data-testid="button-order-food-hub"
      >
        <UtensilsCrossed className="h-5 w-5" />
        {t("restaurant.orderFood", "Order Food")}
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </div>
  );
}

function RoomPrepStatusPanel() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useQuery<RoomPreparationOrder[]>({
    queryKey: ["/api/room-prep-orders/my"],
  });

  if (isLoading) return <div className="p-4"><Skeleton className="h-20" /></div>;
  const active = (orders || []).filter(o => o.status !== "completed");

  return (
    <div className="p-4 space-y-3">
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("roomPrep.noOrders", "No active prep orders")}
        </p>
      ) : (
        active.map(o => (
          <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {t(`roomPrep.occasion.${o.occasionType}`, o.occasionType)}
              </p>
              <p className="text-xs text-muted-foreground">{o.status}</p>
            </div>
            <Badge variant="outline" className="text-[11px] shrink-0">{o.status}</Badge>
          </div>
        ))
      )}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => navigate("/dashboard?view=room-prep")}
        data-testid="button-new-room-prep"
      >
        <PartyPopper className="h-4 w-4" />
        {t("roomPrep.newOrder", "New Room Prep")}
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </div>
  );
}

export default function GuestActionDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const { data: booking, isLoading: bookingLoading } = useQuery<Booking>({
    queryKey: ["/api/bookings/current"],
  });
  const { data: requests } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });
  const { data: chatMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
  });
  const { data: prepOrders } = useQuery<RoomPreparationOrder[]>({
    queryKey: ["/api/room-prep-orders/my"],
  });

  const pendingRequests = (requests || []).filter(r => r.status === "pending").length;
  const staffMessages = (chatMessages || []).filter(m => (m as any).senderRole === "staff" || m.sender === "staff").length;
  const activePrepOrders = (prepOrders || []).filter(o => o.status !== "completed").length;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date as string).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const panels: Record<string, { title: string; subtitle: string; icon: React.ReactNode; content: React.ReactNode }> = {
    services: {
      title: t("dashboard.guest.requestService", "Request Service"),
      subtitle: t("guest.hub.chooseService", "Choose a service type"),
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      content: <ServiceRequestPanel booking={booking} onClose={() => setOpenPanel(null)} />,
    },
    waiter: {
      title: t("restaurant.callWaiter", "Restaurant"),
      subtitle: t("restaurant.waiterCallDesc", "Call waiter or order food"),
      icon: <UtensilsCrossed className="h-5 w-5 text-primary" />,
      content: <WaiterPanel booking={booking} />,
    },
    roomprep: {
      title: t("roomPrep.title", "Room Prep"),
      subtitle: `${activePrepOrders} ${t("actionDash.active", "active")}`,
      icon: <PartyPopper className="h-5 w-5 text-primary" />,
      content: <RoomPrepStatusPanel />,
    },
  };

  const quickActions = [
    {
      id: "services",
      icon: MessageSquare,
      label: t("dashboard.guest.requestService", "Request Service"),
      description: pendingRequests > 0
        ? `${pendingRequests} ${t("actionDash.pending", "pending")}`
        : t("actionDash.allClear", "All clear"),
      badge: pendingRequests,
      accentColor: "bg-blue-500",
      glowColor: "bg-blue-500/6",
      action: () => setOpenPanel("services"),
    },
    {
      id: "chat",
      icon: Bell,
      label: t("dashboard.guest.chat", "Chat"),
      description: staffMessages > 0
        ? `${staffMessages} ${t("chat.messages", "messages")}`
        : t("actionDash.allClear", "All clear"),
      badge: staffMessages,
      accentColor: "bg-primary",
      glowColor: "bg-primary/6",
      action: () => navigate("/dashboard?view=messages"),
    },
    {
      id: "waiter",
      icon: UtensilsCrossed,
      label: t("restaurant.callWaiter", "Restaurant"),
      description: t("restaurant.waiterCallDesc", "Call waiter or order"),
      badge: 0,
      accentColor: "bg-orange-500",
      glowColor: "bg-orange-500/6",
      action: () => setOpenPanel("waiter"),
    },
    {
      id: "roomprep",
      icon: PartyPopper,
      label: t("roomPrep.title", "Room Prep"),
      description: activePrepOrders > 0
        ? `${activePrepOrders} ${t("actionDash.active", "active")}`
        : t("actionDash.allClear", "All clear"),
      badge: activePrepOrders,
      accentColor: "bg-rose-500",
      glowColor: "bg-rose-500/6",
      action: () => setOpenPanel("roomprep"),
    },
  ];

  const navLinks = [
    {
      icon: Lightbulb,
      label: t("dashboard.guest.roomControls", "Room Controls"),
      url: "/dashboard?view=room-controls",
      accentColor: "bg-yellow-500",
      glowColor: "bg-yellow-500/6",
      testId: "nav-card-room-controls",
    },
    {
      icon: ClipboardList,
      label: t("dashboard.guest.requests", "My Requests"),
      url: "/dashboard?view=services",
      accentColor: "bg-indigo-500",
      glowColor: "bg-indigo-500/6",
      testId: "nav-card-my-requests",
    },
    {
      icon: Sparkles,
      label: t("smartExtras.title", "Smart Extras"),
      url: "/dashboard?view=smart-extras",
      accentColor: "bg-purple-500",
      glowColor: "bg-purple-500/6",
      testId: "nav-card-smart-extras",
    },
    {
      icon: CheckCircle,
      label: t("dashboard.guest.onlineCheckin", "Check-in"),
      url: "/dashboard?view=checkin",
      accentColor: "bg-emerald-500",
      glowColor: "bg-emerald-500/6",
      testId: "nav-card-checkin",
    },
    {
      icon: DoorOpen,
      label: t("dashboard.guest.prepareMyStay", "Prepare Stay"),
      url: "/dashboard?view=prepare",
      accentColor: "bg-cyan-500",
      glowColor: "bg-cyan-500/6",
      testId: "nav-card-prepare-stay",
    },
    {
      icon: ArrowRight,
      label: t("guest.hub.viewAll", "View All"),
      url: "/dashboard?view=all",
      accentColor: "bg-slate-500",
      glowColor: "bg-slate-500/6",
      testId: "nav-card-view-all",
    },
  ];

  if (bookingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {booking && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user?.fullName || t("actionDash.guest", "Guest")}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <DoorOpen className="h-3 w-3" />
                      {t("common.room", "Room")} {booking.roomNumber}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(booking.checkInDate)} — {formatDate(booking.checkOutDate)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={booking.status === "checked_in" ? "default" : "secondary"}
                  className="shrink-0 text-[11px]"
                >
                  {booking.status === "checked_in"
                    ? t("dashboard.guest.checkedIn", "Checked in")
                    : t("dashboard.guest.notCheckedIn", "Not checked in")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("actionDash.quickActions", "Quick Actions")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-3"
          data-testid="guest-action-grid"
        >
          {quickActions.map((action, i) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.055 }}
            >
              <ActionCard
                icon={action.icon}
                label={action.label}
                description={action.description}
                badge={action.badge}
                accentColor={action.accentColor}
                glowColor={action.glowColor}
                onClick={action.action}
                testId={`action-card-${action.id}`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("actionDash.management", "More")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
          data-testid="guest-nav-grid"
        >
          {navLinks.map((link, i) => (
            <motion.div
              key={link.url}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, delay: 0.1 + i * 0.04 }}
            >
              <ActionCard
                icon={link.icon}
                label={link.label}
                accentColor={link.accentColor}
                glowColor={link.glowColor}
                onClick={() => navigate(link.url)}
                testId={link.testId}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("nav.group.system", "System")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="grid grid-cols-3 gap-3"
          data-testid="guest-system-nav-grid"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
            data-testid="nav-card-dashboard"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">{t("common.dashboard", "Dashboard")}</span>
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border bg-card hover:border-amber-400/50 hover:shadow-md transition-all duration-200"
            data-testid="nav-card-notifications"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">{t("common.notifications", "Notifications")}</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border bg-card hover:border-slate-400/50 hover:shadow-md transition-all duration-200"
            data-testid="nav-card-settings"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-500/10">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">{t("common.settings", "Settings")}</span>
          </button>
        </motion.div>
      </div>

      {openPanel && panels[openPanel] && (
        <BottomSheet
          open={!!openPanel}
          onClose={() => setOpenPanel(null)}
          title={panels[openPanel].title}
          subtitle={panels[openPanel].subtitle}
          icon={panels[openPanel].icon}
          height="tall"
        >
          {panels[openPanel].content}
        </BottomSheet>
      )}
    </div>
  );
}
