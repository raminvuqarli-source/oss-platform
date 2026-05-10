import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { navigate } from "wouter/use-browser-location";
import {
  ArrowRightLeft, BellRing, BedDouble, DoorOpen,
  CalendarDays, Users, Wallet, SprayCan, MessageSquare,
  Star, ClipboardList, UserCheck, MessageCircle, Loader2, User,
} from "lucide-react";
import { ActionCard } from "@/components/action-card";
import { BottomSheet } from "@/components/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequest, Booking, RoomPreparationOrder } from "@shared/schema";

interface RoomUnit {
  id: string;
  unitNumber: string;
  unitType: string;
  status: string;
  floor: number | null;
  capacity: number | null;
}

type PanelType = "checkinout" | "requests" | "roomprep" | "rooms" | null;

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  occupied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  dirty: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  cleaning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  out_of_order: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function PanelSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function CheckInOutPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: bookings, isLoading } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/checkin`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: t("actionDash.checkInSuccess") });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/checkout`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: t("actionDash.checkOutSuccess") });
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayCheckIns = (bookings || []).filter(b =>
    b.checkIn?.slice(0, 10) === today && (b.status === "confirmed" || b.status === "pending")
  );
  const todayCheckOuts = (bookings || []).filter(b =>
    b.checkOut?.slice(0, 10) === today && b.status === "checked_in"
  );

  if (isLoading) return <PanelSkeleton />;

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("actionDash.todayArrivals")} · {todayCheckIns.length}
          </p>
        </div>
        {todayCheckIns.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">{t("actionDash.noArrivals")}</p>
        ) : (
          <div className="space-y-2">
            {todayCheckIns.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                  <User className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.guestName || t("actionDash.guest")}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                </div>
                <Button size="sm" className="h-7 text-xs px-3 rounded-lg shrink-0"
                  onClick={() => checkInMutation.mutate(b.id)} disabled={checkInMutation.isPending}
                  data-testid={`button-checkin-${b.id}`}>
                  {checkInMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("actionDash.checkIn")}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("actionDash.todayDepartures")} · {todayCheckOuts.length}
          </p>
        </div>
        {todayCheckOuts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">{t("actionDash.noDepartures")}</p>
        ) : (
          <div className="space-y-2">
            {todayCheckOuts.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
                  <User className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.guestName || t("actionDash.guest")}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs px-3 rounded-lg shrink-0"
                  onClick={() => checkOutMutation.mutate(b.id)} disabled={checkOutMutation.isPending}
                  data-testid={`button-checkout-${b.id}`}>
                  {checkOutMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("actionDash.checkOut")}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestsPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: requests, isLoading } = useQuery<ServiceRequest[]>({ queryKey: ["/api/service-requests/all"] });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/service-requests/${id}`, { status: "approved" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/all"] });
      toast({ title: t("requests.approved") });
    },
  });

  if (isLoading) return <PanelSkeleton />;
  const pending = (requests || []).filter(r => r.status === "pending");

  return (
    <div className="p-4 space-y-2">
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("actionDash.allClear")}</p>
      ) : pending.map(r => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{r.category} — {t(`priority.${r.priority}`, r.priority)}</p>
            <p className="text-xs text-muted-foreground truncate">{r.description}</p>
          </div>
          <Button size="sm" className="h-7 text-xs px-3 rounded-lg shrink-0"
            onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}
            data-testid={`button-approve-${r.id}`}>
            {t("actionDash.approve", "Approve")}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

function RoomPrepPanel() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useQuery<RoomPreparationOrder[]>({ queryKey: ["/api/room-prep-orders/hotel"] });
  if (isLoading) return <PanelSkeleton />;

  const pending = (orders || []).filter(o => o.status === "pending" || o.status === "in_progress");
  return (
    <div className="p-4 space-y-2">
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("roomPrep.noOrders")}</p>
      ) : pending.map(o => (
        <motion.div key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{o.guestName} — {t(`roomPrep.occasion.${o.occasionType}`, o.occasionType)}</p>
            <p className="text-xs text-muted-foreground">{o.roomNumber} · {o.status}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[11px]">{o.status}</Badge>
        </motion.div>
      ))}
    </div>
  );
}

function RoomsPanel() {
  const { t } = useTranslation();
  const { data: units, isLoading } = useQuery<RoomUnit[]>({ queryKey: ["/api/units/status"] });
  if (isLoading) return <PanelSkeleton />;
  return (
    <div className="p-4 space-y-2">
      {(units || []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t("actionDash.allReady")}</p>
      ) : (units || []).map(u => (
        <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t("roomPrep.room", "Room")} {u.unitNumber}</p>
            <p className="text-xs text-muted-foreground capitalize">{u.unitType}</p>
          </div>
          <Badge className={`${STATUS_COLORS[u.status] || ""} text-[11px] border-0 shrink-0`}>
            {t(`roomStatus.${u.status}`, u.status)}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

export default function ReceptionActionDashboard() {
  const { t } = useTranslation();
  const [openPanel, setOpenPanel] = useState<PanelType>(null);

  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });
  const { data: requests } = useQuery<ServiceRequest[]>({ queryKey: ["/api/service-requests/all"] });
  const { data: prepOrders } = useQuery<RoomPreparationOrder[]>({ queryKey: ["/api/room-prep-orders/hotel"] });
  const { data: units } = useQuery<RoomUnit[]>({ queryKey: ["/api/units/status"] });

  const today = new Date().toISOString().slice(0, 10);
  const todayArrivals = (bookings || []).filter(b =>
    b.checkIn?.slice(0, 10) === today && (b.status === "confirmed" || b.status === "pending")
  ).length;
  const todayDepartures = (bookings || []).filter(b =>
    b.checkOut?.slice(0, 10) === today && b.status === "checked_in"
  ).length;
  const checkinBadge = todayArrivals + todayDepartures;

  const pendingRequests = (requests || []).filter(r => r.status === "pending").length;
  const pendingPrep = (prepOrders || []).filter(o => o.status === "pending" || o.status === "in_progress").length;
  const dirtyRooms = (units || []).filter(u => u.status === "dirty" || u.status === "cleaning").length;

  const panels: Record<NonNullable<PanelType>, { title: string; subtitle: string; icon: React.ReactNode; content: React.ReactNode }> = {
    checkinout: {
      title: t("actionDash.checkinout"),
      subtitle: `${todayArrivals} ${t("actionDash.summaryArrivals")} · ${todayDepartures} ${t("actionDash.summaryDepartures")}`,
      icon: <ArrowRightLeft className="h-5 w-5 text-primary" />,
      content: <CheckInOutPanel />,
    },
    requests: {
      title: t("actionDash.serviceRequests"),
      subtitle: `${pendingRequests} ${t("actionDash.open")}`,
      icon: <BellRing className="h-5 w-5 text-primary" />,
      content: <RequestsPanel />,
    },
    roomprep: {
      title: t("nav.roomPrep", "Room Prep"),
      subtitle: `${pendingPrep} ${t("actionDash.pending")}`,
      icon: <DoorOpen className="h-5 w-5 text-primary" />,
      content: <RoomPrepPanel />,
    },
    rooms: {
      title: t("actionDash.roomStatus"),
      subtitle: `${(units || []).length} ${t("actionDash.total")}`,
      icon: <BedDouble className="h-5 w-5 text-primary" />,
      content: <RoomsPanel />,
    },
  };

  const actions = [
    {
      id: "checkinout" as PanelType,
      icon: ArrowRightLeft,
      label: t("actionDash.checkinout"),
      description: checkinBadge > 0 ? `${checkinBadge} ${t("actionDash.todayAction")}` : t("actionDash.allClear"),
      badge: checkinBadge,
      accentColor: "bg-primary",
      glowColor: "bg-primary/6",
    },
    {
      id: "requests" as PanelType,
      icon: BellRing,
      label: t("actionDash.serviceRequests"),
      description: pendingRequests > 0 ? `${pendingRequests} ${t("actionDash.open")}` : t("actionDash.allClear"),
      badge: pendingRequests,
      accentColor: "bg-orange-500",
      glowColor: "bg-orange-500/6",
    },
    {
      id: "roomprep" as PanelType,
      icon: DoorOpen,
      label: t("nav.roomPrep", "Room Prep"),
      description: pendingPrep > 0 ? `${pendingPrep} ${t("actionDash.pending")}` : t("actionDash.allClear"),
      badge: pendingPrep,
      accentColor: "bg-rose-500",
      glowColor: "bg-rose-500/6",
    },
    {
      id: "rooms" as PanelType,
      icon: BedDouble,
      label: t("actionDash.roomStatus"),
      description: dirtyRooms > 0 ? `${dirtyRooms} ${t("actionDash.needAttention")}` : t("actionDash.allReady"),
      badge: dirtyRooms,
      accentColor: "bg-violet-500",
      glowColor: "bg-violet-500/6",
    },
  ];

  const navLinks = [
    { icon: CalendarDays, label: t("nav.calendar", "Calendar"), url: "/dashboard?view=calendar", accentColor: "bg-cyan-500", glowColor: "bg-cyan-500/6", testId: "nav-card-calendar" },
    { icon: Users, label: t("nav.guests", "Guests"), url: "/guests", accentColor: "bg-emerald-500", glowColor: "bg-emerald-500/6", testId: "nav-card-guests" },
    { icon: ClipboardList, label: t("nav.tasks", "Tasks"), url: "/dashboard?view=tasks", accentColor: "bg-indigo-500", glowColor: "bg-indigo-500/6", testId: "nav-card-tasks" },
    { icon: Wallet, label: t("nav.finance", "Finance"), url: "/dashboard?view=finance", accentColor: "bg-yellow-500", glowColor: "bg-yellow-500/6", testId: "nav-card-finance" },
    { icon: SprayCan, label: t("nav.housekeeping", "Housekeeping"), url: "/dashboard?view=housekeeping", accentColor: "bg-teal-500", glowColor: "bg-teal-500/6", testId: "nav-card-housekeeping" },
    { icon: UserCheck, label: t("nav.roomStatus", "Room Status"), url: "/dashboard?view=room-status", accentColor: "bg-blue-500", glowColor: "bg-blue-500/6", testId: "nav-card-room-status" },
    { icon: MessageSquare, label: t("nav.guestMessages", "Guest Messages"), url: "/dashboard?view=messages", accentColor: "bg-purple-500", glowColor: "bg-purple-500/6", testId: "nav-card-messages" },
    { icon: MessageCircle, label: t("nav.staffChat", "Staff Chat"), url: "/dashboard?view=staff-chat", accentColor: "bg-pink-500", glowColor: "bg-pink-500/6", testId: "nav-card-staff-chat" },
    { icon: Star, label: t("staffPerformance.myRating", "My Rating"), url: "/dashboard?view=my-performance", accentColor: "bg-amber-500", glowColor: "bg-amber-500/6", testId: "nav-card-rating" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("actionDash.quickActions", "Quick Actions")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-3"
          data-testid="reception-action-grid"
        >
          {actions.map((action, i) => (
            <motion.div key={action.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.055 }}>
              <ActionCard
                icon={action.icon}
                label={action.label}
                description={action.description}
                badge={action.badge}
                accentColor={action.accentColor}
                glowColor={action.glowColor}
                onClick={() => setOpenPanel(action.id)}
                testId={`action-card-${action.id}`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("actionDash.management", "Management")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
          data-testid="reception-nav-grid"
        >
          {navLinks.map((link, i) => (
            <motion.div key={link.url} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, delay: 0.1 + i * 0.04 }}>
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

      {openPanel && (
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
