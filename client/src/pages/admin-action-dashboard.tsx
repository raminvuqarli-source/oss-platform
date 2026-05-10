import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { navigate } from "wouter/use-browser-location";
import {
  CalendarCheck, ListChecks, BellRing, BedDouble,
  CheckCircle2, ArrowRightLeft, User, Loader2, BedSingle,
  CalendarDays, Users, Wallet, SprayCan, DoorOpen,
  UtensilsCrossed, MessageSquare, Star, BarChart3,
} from "lucide-react";
import { ActionCard } from "@/components/action-card";
import { BottomSheet } from "@/components/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking, ServiceRequest } from "@shared/schema";

interface RoomUnit {
  id: string;
  unitNumber: string;
  unitType: string;
  status: string;
  floor: number | null;
  capacity: number | null;
  hasActiveBooking: boolean;
  activeBookingStatus: string | null;
}

type PanelType = "checkinout" | "bookings" | "requests" | "rooms" | null;

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  occupied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  dirty: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  cleaning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  out_of_order: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  checked_in: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  checked_out: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  no_show: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const REQUEST_PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
      <div className="p-4 rounded-2xl bg-muted/60">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

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

/* ── CHECK-IN / OUT PANEL ── */
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

  return (
    <div className="p-4 space-y-6">
      {/* Arrivals */}
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
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card"
              >
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                  <User className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.guestName || t("actionDash.guest")}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs px-3 rounded-lg shrink-0"
                  onClick={() => checkInMutation.mutate(b.id)}
                  disabled={checkInMutation.isPending}
                  data-testid={`button-checkin-${b.id}`}
                >
                  {checkInMutation.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : t("actionDash.checkIn")}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Departures */}
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
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card"
              >
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
                  <User className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.guestName || t("actionDash.guest")}</p>
                  <p className="text-xs text-muted-foreground">{t("actionDash.since")} {formatDate(b.checkIn)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3 rounded-lg shrink-0 border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/20"
                  onClick={() => checkOutMutation.mutate(b.id)}
                  disabled={checkOutMutation.isPending}
                  data-testid={`button-checkout-${b.id}`}
                >
                  {checkOutMutation.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : t("actionDash.checkOut")}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── BOOKINGS PANEL ── */
function BookingsPanel() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");
  const { data: bookings, isLoading } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });

  const filterOptions = [
    { key: "all", label: t("actionDash.filterAll") },
    { key: "confirmed", label: t("actionDash.filterConfirmed") },
    { key: "pending", label: t("actionDash.filterPending") },
    { key: "checked_in", label: t("actionDash.filterCheckedIn") },
  ];

  const filtered = (bookings || [])
    .filter(b => filter === "all" || b.status === filter)
    .slice(0, 30);

  if (isLoading) return <PanelSkeleton />;

  return (
    <div className="p-4 space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              filter === opt.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} label={t("actionDash.noBookings")} />
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card"
            >
              <div className="p-2 rounded-xl bg-muted shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.guestName || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                </p>
              </div>
              <Badge className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${BOOKING_STATUS_COLORS[b.status] || ""}`}>
                {b.status}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SERVICE REQUESTS PANEL ── */
function RequestsPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: requests, isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/all"],
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/service-requests/${id}`, { status: "resolved" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/all"] });
      toast({ title: t("actionDash.requestResolved") });
    },
  });

  const open = (requests || []).filter(r => r.status !== "resolved" && r.status !== "closed");
  const resolved = (requests || []).filter(r => r.status === "resolved" || r.status === "closed").slice(0, 5);

  if (isLoading) return <PanelSkeleton />;

  return (
    <div className="p-4 space-y-6">
      {/* Open requests */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("actionDash.openRequests")} · {open.length}
          </p>
        </div>
        {open.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{t("actionDash.allResolved")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {open.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card"
              >
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0 mt-0.5">
                  <BellRing className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.requestType || t("actionDash.serviceRequests")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.description || "—"}</p>
                  {r.priority && (
                    <Badge className={`mt-1 text-[10px] px-1.5 py-0 rounded-full ${REQUEST_PRIORITY_COLORS[r.priority] || ""}`}>
                      {t(`requests.${r.priority}`, r.priority)}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 rounded-lg shrink-0 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 mt-0.5"
                  onClick={() => resolveMutation.mutate(r.id)}
                  disabled={resolveMutation.isPending}
                  data-testid={`button-resolve-${r.id}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("actionDash.recentlyResolved")}
          </p>
          <div className="space-y-2">
            {resolved.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 opacity-60">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-sm truncate">{r.requestType || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ROOM STATUS PANEL ── */
function RoomsPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: units, isLoading } = useQuery<RoomUnit[]>({
    queryKey: ["/api/units/status"],
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ unitId, status }: { unitId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/units/${unitId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units/status"] });
      toast({ title: t("actionDash.statusUpdated") });
    },
  });

  if (isLoading) return <PanelSkeleton />;
  if (!units || units.length === 0) {
    return <EmptyState icon={BedSingle} label={t("actionDash.noRooms")} />;
  }

  const counts = {
    ready: units.filter(u => u.status === "ready" || u.status === "available").length,
    occupied: units.filter(u => u.status === "occupied").length,
    dirty: units.filter(u => u.status === "dirty").length,
    cleaning: units.filter(u => u.status === "cleaning").length,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Summary grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t("roomStatus.ready"), count: counts.ready, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
          { label: t("roomStatus.occupied"), count: counts.occupied, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
          { label: t("roomStatus.dirty"), count: counts.dirty, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
          { label: t("roomStatus.cleaning"), count: counts.cleaning, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        ].map(item => (
          <div key={item.label} className={`flex flex-col items-center p-2 rounded-xl ${item.color}`}>
            <span className="text-xl font-bold leading-none">{item.count}</span>
            <span className="text-[9.5px] font-medium mt-0.5 leading-tight text-center">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Room list */}
      <div className="space-y-2">
        {units.map(unit => (
          <motion.div
            key={unit.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card"
          >
            <div className="p-2 rounded-xl bg-muted shrink-0">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t("actionDash.room")} {unit.unitNumber}</p>
              <p className="text-xs text-muted-foreground capitalize">{unit.unitType}</p>
            </div>
            <Select
              value={unit.status}
              onValueChange={val => updateStatusMutation.mutate({ unitId: unit.id, status: val })}
            >
              <SelectTrigger className={`h-7 text-[11px] w-[108px] rounded-lg border-0 font-medium ${STATUS_COLORS[unit.status] || ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">{t("roomStatus.available")}</SelectItem>
                <SelectItem value="occupied">{t("roomStatus.occupied")}</SelectItem>
                <SelectItem value="dirty">{t("roomStatus.dirty")}</SelectItem>
                <SelectItem value="cleaning">{t("roomStatus.cleaning")}</SelectItem>
                <SelectItem value="out_of_order">{t("roomStatus.outOfOrder")}</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN ADMIN ACTION DASHBOARD
══════════════════════════════════════════ */
export default function AdminActionDashboard() {
  const { t } = useTranslation();
  const [openPanel, setOpenPanel] = useState<PanelType>(null);

  const { data: bookings } = useQuery<Booking[]>({ queryKey: ["/api/bookings"] });
  const { data: requests } = useQuery<ServiceRequest[]>({ queryKey: ["/api/service-requests/all"] });
  const { data: units } = useQuery<RoomUnit[]>({ queryKey: ["/api/units/status"] });

  const today = new Date().toISOString().slice(0, 10);

  const todayArrivals = (bookings || []).filter(b =>
    b.checkIn?.slice(0, 10) === today && (b.status === "confirmed" || b.status === "pending")
  ).length;
  const todayDepartures = (bookings || []).filter(b =>
    b.checkOut?.slice(0, 10) === today && b.status === "checked_in"
  ).length;
  const checkinBadge = todayArrivals + todayDepartures;

  const pendingBookings = (bookings || []).filter(b => b.status === "pending").length;
  const openRequests = (requests || []).filter(r => r.status !== "resolved" && r.status !== "closed").length;
  const dirtyRooms = (units || []).filter(u => u.status === "dirty" || u.status === "cleaning").length;

  const panels: Record<NonNullable<PanelType>, {
    title: string; subtitle: string; icon: React.ReactNode; content: React.ReactNode;
  }> = {
    checkinout: {
      title: t("actionDash.checkinout"),
      subtitle: `${todayArrivals} ${t("actionDash.summaryArrivals")} · ${todayDepartures} ${t("actionDash.summaryDepartures")}`,
      icon: <ArrowRightLeft className="h-5 w-5 text-primary" />,
      content: <CheckInOutPanel />,
    },
    bookings: {
      title: t("actionDash.bookings"),
      subtitle: `${(bookings || []).length} ${t("actionDash.total")}`,
      icon: <ListChecks className="h-5 w-5 text-primary" />,
      content: <BookingsPanel />,
    },
    requests: {
      title: t("actionDash.serviceRequests"),
      subtitle: `${openRequests} ${t("actionDash.open")}`,
      icon: <BellRing className="h-5 w-5 text-primary" />,
      content: <RequestsPanel />,
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
      description: checkinBadge > 0
        ? `${checkinBadge} ${t("actionDash.todayAction")}`
        : t("actionDash.allClear"),
      badge: checkinBadge,
      accentColor: "bg-primary",
      glowColor: "bg-primary/6",
    },
    {
      id: "bookings" as PanelType,
      icon: CalendarCheck,
      label: t("actionDash.bookings"),
      description: pendingBookings > 0
        ? `${pendingBookings} ${t("actionDash.pending")}`
        : `${(bookings || []).length} ${t("actionDash.total")}`,
      badge: pendingBookings,
      accentColor: "bg-blue-500",
      glowColor: "bg-blue-500/6",
    },
    {
      id: "requests" as PanelType,
      icon: BellRing,
      label: t("actionDash.serviceRequests"),
      description: openRequests > 0
        ? `${openRequests} ${t("actionDash.open")}`
        : t("actionDash.allClear"),
      badge: openRequests,
      accentColor: "bg-orange-500",
      glowColor: "bg-orange-500/6",
    },
    {
      id: "rooms" as PanelType,
      icon: BedDouble,
      label: t("actionDash.roomStatus"),
      description: dirtyRooms > 0
        ? `${dirtyRooms} ${t("actionDash.needAttention")}`
        : t("actionDash.allReady"),
      badge: dirtyRooms,
      accentColor: "bg-violet-500",
      glowColor: "bg-violet-500/6",
    },
  ];

  const navLinks = [
    { icon: CalendarDays, label: t("nav.calendar", "Calendar"), url: "/dashboard?view=calendar", accentColor: "bg-cyan-500", glowColor: "bg-cyan-500/6", testId: "nav-card-calendar" },
    { icon: Users, label: t("nav.guests", "Guests"), url: "/guests", accentColor: "bg-emerald-500", glowColor: "bg-emerald-500/6", testId: "nav-card-guests" },
    { icon: BarChart3, label: t("nav.staff", "Staff"), url: "/staff", accentColor: "bg-indigo-500", glowColor: "bg-indigo-500/6", testId: "nav-card-staff" },
    { icon: Wallet, label: t("nav.finance", "Finance"), url: "/dashboard?view=finance", accentColor: "bg-yellow-500", glowColor: "bg-yellow-500/6", testId: "nav-card-finance" },
    { icon: SprayCan, label: t("nav.housekeeping", "Housekeeping"), url: "/dashboard?view=housekeeping", accentColor: "bg-teal-500", glowColor: "bg-teal-500/6", testId: "nav-card-housekeeping" },
    { icon: DoorOpen, label: t("nav.roomPrep", "Room Prep"), url: "/dashboard?view=room-prep", accentColor: "bg-rose-500", glowColor: "bg-rose-500/6", testId: "nav-card-room-prep" },
    { icon: UtensilsCrossed, label: t("nav.restaurantManagement", "Restaurant"), url: "/restaurant/manager", accentColor: "bg-orange-500", glowColor: "bg-orange-500/6", testId: "nav-card-restaurant" },
    { icon: MessageSquare, label: t("nav.guestMessages", "Guest Messages"), url: "/dashboard?view=messages", accentColor: "bg-purple-500", glowColor: "bg-purple-500/6", testId: "nav-card-messages" },
    { icon: Star, label: t("staffPerformance.myRating", "My Rating"), url: "/dashboard?view=my-performance", accentColor: "bg-amber-500", glowColor: "bg-amber-500/6", testId: "nav-card-rating" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions — 2×2 Grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("actionDash.quickActions", "Quick Actions")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-3"
          data-testid="admin-action-grid"
        >
          {actions.map((action, i) => (
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
                onClick={() => setOpenPanel(action.id)}
                testId={`action-card-${action.id}`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Links */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t("actionDash.management", "Management")}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
          data-testid="admin-nav-grid"
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

      {/* Bottom Sheet Panel */}
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
