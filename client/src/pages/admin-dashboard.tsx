import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { formatTimeAgo } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge, PrepStatusBadge } from "@/components/request-status-badge";
import { getPriorityTextColor } from "@/components/priority-indicator";
interface FinanceAnalytics {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  serviceRevenue: number;
  bookingRevenue: number;
  monthlyTrend: number;
  occupancyRate: number;
  totalRooms: number;
  bookedRooms: number;
  revPar: number;
  noShowCount: number;
  noShowRevenueLoss: number;
  serviceDistribution: Array<{ category: string; amount: number }>;
  recentTransactions: Array<{ id: string; description: string; amount: number; category: string; paymentStatus: string; createdAt: string }>;
}
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import { useState, useMemo, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  DoorOpen,
  Bell,
  TrendingUp,
  CheckCircle,
  Clock,
  UserCheck,
  BarChart3,
  Activity,
  Coffee,
  Car,
  UtensilsCrossed,
  SprayCan,
  Wrench,
  HelpCircle,
  Calendar,
  Sparkles,
  UserPlus,
  Lock,
  LockOpen,
  Shield,
  UserCog,
  MessageSquare,
  Send,
  RefreshCw,
  Loader2,
  LogOut,
  PartyPopper,
  AlertTriangle,
  ClipboardList,
  CalendarDays,
  ArrowLeft,
  BedDouble,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import type { User, ServiceRequest, Booking, Notification, DoorActionLog, ChatMessage, RoomPreparationOrder } from "@shared/schema";
import { FinancePanel } from "@/components/finance-panel";
import { StaffMyPerformance } from "@/components/staff-my-performance";
import { HousekeepingView } from "@/components/housekeeping-view";
import { StatCard } from "@/components/stat-card";
import { DollarSign, TrendingDown, Percent, Building, Plus } from "lucide-react";

interface RoomUnit {
  id: string;
  unitNumber: string;
  unitType: string;
  status: string;
  floor: number | null;
  capacity: number | null;
  propertyId: string;
  hasActiveBooking: boolean;
  activeBookingStatus: string | null;
}

const ROOM_STATUS_COLORS: Record<string, string> = {
  ready: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  dirty: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  cleaning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  occupied: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  out_of_order: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function AdminRoomStatusPanel() {
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
      toast({ title: t('roomStatus.updated', 'Room status updated') });
    },
    onError: (error: any) => {
      showErrorToast(error, toast);
    },
  });

  const handleStatusChange = (unitId: string, status: string) => {
    updateStatusMutation.mutate({ unitId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="room-status-loading">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <Card data-testid="room-status-empty">
        <CardContent className="p-6 text-center text-muted-foreground">
          <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{t('roomStatus.noRooms', 'No rooms found. Add units to your property first.')}</p>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = {
    ready: units.filter(u => u.status === "ready" || u.status === "available").length,
    occupied: units.filter(u => u.status === "occupied").length,
    dirty: units.filter(u => u.status === "dirty").length,
    cleaning: units.filter(u => u.status === "cleaning").length,
    out_of_order: units.filter(u => u.status === "out_of_order").length,
  };

  return (
    <div className="space-y-4" data-testid="admin-room-status-panel">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{statusCounts.ready}</div>
          <div className="text-xs text-green-600 dark:text-green-400">{t('roomStatus.ready', 'Ready')}</div>
        </div>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{statusCounts.occupied}</div>
          <div className="text-xs text-red-600 dark:text-red-400">{t('roomStatus.occupied', 'Occupied')}</div>
        </div>
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{statusCounts.dirty}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">{t('roomStatus.dirty', 'Dirty')}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{statusCounts.cleaning}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">{t('roomStatus.cleaning', 'Cleaning')}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-center">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{statusCounts.out_of_order}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{t('roomStatus.outOfOrder', 'Out of Order')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {units.map(unit => (
          <Card key={unit.id} className="overflow-visible" data-testid={`admin-room-card-${unit.unitNumber}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold text-lg">{unit.unitNumber}</span>
                  <span className="text-xs text-muted-foreground capitalize">{unit.unitType}</span>
                </div>
                <Badge className={ROOM_STATUS_COLORS[unit.status] || ROOM_STATUS_COLORS.available}>
                  {unit.status === "out_of_order" ? t('roomStatus.outOfOrder', 'Out of Order') : t(`roomStatus.${unit.status}`, unit.status)}
                </Badge>
              </div>

              {unit.hasActiveBooking && (
                <div className="mb-3">
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    {t('roomStatus.activeBooking', 'Active Booking')} ({unit.activeBookingStatus})
                  </Badge>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {unit.status !== "cleaning" && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(unit.id, "cleaning")}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {t('roomStatus.markCleaning', 'Cleaning')}
                  </Button>
                )}
                {unit.status !== "ready" && (
                  <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleStatusChange(unit.id, "ready")}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('roomStatus.markReady', 'Ready')}
                  </Button>
                )}
                {unit.status !== "out_of_order" && (
                  <Button size="sm" variant="outline" className="text-xs h-7 text-gray-600 border-gray-300" onClick={() => handleStatusChange(unit.id, "out_of_order")}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {t('roomStatus.markOOO', 'Out of Order')}
                  </Button>
                )}
              </div>

              {unit.floor != null && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {t('roomStatus.floor', 'Floor')}: {unit.floor} | {t('roomStatus.capacity', 'Cap')}: {unit.capacity || '-'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const serviceIcons: Record<string, React.ElementType> = {
  coffee: Coffee,
  taxi: Car,
  room_service: UtensilsCrossed,
  housekeeping: SprayCan,
  maintenance: Wrench,
  concierge: HelpCircle,
  other: HelpCircle,
};

function AdminTasksView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: allRequests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/all"],
  });

  const { data: prepOrders, isLoading: prepLoading } = useQuery<RoomPreparationOrder[]>({
    queryKey: ["/api/room-prep-orders/hotel"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/service-requests/${data.id}`, { status: data.status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/all"] });
      toast({ title: t('dashboard.reception.requestUpdated', 'Task updated') });
    },
    onError: (error: Error) => showErrorToast(toast, error),
  });

  const updatePrepMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/room-prep-orders/${data.id}`, { status: data.status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-prep-orders/hotel"] });
      toast({ title: t('roomPrep.orderUpdated', 'Task updated') });
    },
    onError: (error: Error) => showErrorToast(toast, error),
  });

  const myServiceTasks = allRequests?.filter((r) => r.assignedTo === userId && !["completed", "cancelled"].includes(r.status)) || [];
  const myPrepTasks = prepOrders?.filter((o) => o.staffAssigned === user?.fullName && !["delivered", "rejected"].includes(o.status)) || [];

  const isLoading = requestsLoading || prepLoading;

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="admin-tasks-view-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const hasTasks = myServiceTasks.length > 0 || myPrepTasks.length > 0;

  return (
    <div className="space-y-6" data-testid="admin-tasks-view">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('tasks.myTasks', 'My Tasks')}</h3>
        <Badge variant="secondary">{myServiceTasks.length + myPrepTasks.length}</Badge>
      </div>

      {!hasTasks && (
        <Card data-testid="admin-tasks-empty">
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('tasks.noTasks', 'No tasks assigned to you')}</p>
            <p className="text-sm">{t('tasks.allCaughtUp', 'You are all caught up!')}</p>
          </CardContent>
        </Card>
      )}

      {myServiceTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">{t('tasks.serviceRequests', 'Service Requests')}</h4>
          {myServiceTasks.map((request) => {
            const Icon = serviceIcons[request.requestType] || HelpCircle;
            return (
              <Card key={request.id} className="overflow-visible" data-testid={`admin-task-request-${request.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-md bg-muted shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium capitalize">{request.requestType.replace("_", " ")}</span>
                            <RequestStatusBadge status={request.status} showIcon />
                            {request.priority && request.priority !== "normal" && (
                              <Badge variant="outline" className={`text-xs ${getPriorityTextColor(request.priority)}`}>
                                {request.priority}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DoorOpen className="h-3 w-3" />
                              {t('common.room', 'Room')} {request.roomNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(request.createdAt!)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm">{request.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        {request.status === "approved" && (
                          <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: "in_progress" })} disabled={updateRequestMutation.isPending} data-testid={`admin-task-start-${request.id}`}>
                            {t('tasks.startWork', 'Start Work')}
                          </Button>
                        )}
                        {request.status === "in_progress" && (
                          <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: "completed" })} disabled={updateRequestMutation.isPending} data-testid={`admin-task-complete-${request.id}`}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('tasks.markComplete', 'Mark Complete')}
                          </Button>
                        )}
                        {request.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => updateRequestMutation.mutate({ id: request.id, status: "approved" })} disabled={updateRequestMutation.isPending} data-testid={`admin-task-approve-${request.id}`}>
                            {t('common.approve', 'Approve')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {myPrepTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">{t('tasks.roomPreparation', 'Room Preparation')}</h4>
          {myPrepTasks.map((order) => (
            <Card key={order.id} className="overflow-visible" data-testid={`admin-task-prep-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-md bg-muted shrink-0">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium capitalize">{t(`roomPrep.occasion.${order.occasionType}`, order.occasionType.replace("_", " "))}</span>
                      <PrepStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{t('common.room', 'Room')} {order.roomNumber}</span>
                      {order.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(order.createdAt)}
                        </span>
                      )}
                    </div>
                    {order.notes && <p className="text-sm">{order.notes}</p>}
                    <div className="flex items-center gap-2 pt-1">
                      {order.status === "accepted" && (
                        <Button size="sm" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "in_preparation" })} disabled={updatePrepMutation.isPending} data-testid={`admin-task-prep-start-${order.id}`}>
                          {t('tasks.startPreparation', 'Start Preparation')}
                        </Button>
                      )}
                      {order.status === "in_preparation" && (
                        <Button size="sm" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "ready" })} disabled={updatePrepMutation.isPending} data-testid={`admin-task-prep-ready-${order.id}`}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('tasks.markReady', 'Mark Ready')}
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button size="sm" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "delivered" })} disabled={updatePrepMutation.isPending} data-testid={`admin-task-prep-deliver-${order.id}`}>
                          {t('tasks.markDelivered', 'Mark Delivered')}
                        </Button>
                      )}
                      {order.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "accepted" })} disabled={updatePrepMutation.isPending} data-testid={`admin-task-prep-accept-${order.id}`}>
                          {t('common.approve', 'Accept')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminCalendarView() {
  const { t } = useTranslation();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="admin-calendar-view-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = (bookings || [])
    .filter((b) => new Date(b.checkOutDate) >= today)
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

  const groupedByDate: Record<string, { checkIns: Booking[]; checkOuts: Booking[] }> = {};

  upcomingBookings.forEach((booking) => {
    const checkInKey = new Date(booking.checkInDate).toLocaleDateString("en-CA");
    const checkOutKey = new Date(booking.checkOutDate).toLocaleDateString("en-CA");

    if (!groupedByDate[checkInKey]) groupedByDate[checkInKey] = { checkIns: [], checkOuts: [] };
    if (!groupedByDate[checkOutKey]) groupedByDate[checkOutKey] = { checkIns: [], checkOuts: [] };

    groupedByDate[checkInKey].checkIns.push(booking);
    if (checkInKey !== checkOutKey) {
      groupedByDate[checkOutKey].checkOuts.push(booking);
    }
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const todayStr = new Date().toLocaleDateString("en-CA");
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA");

    if (dateStr === todayStr) return t('calendar.today', 'Today');
    if (dateStr === tomorrowStr) return t('calendar.tomorrow', 'Tomorrow');
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  };

  return (
    <div className="space-y-6" data-testid="admin-calendar-view">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('calendar.title', 'Calendar')}</h3>
      </div>

      {sortedDates.length === 0 ? (
        <Card data-testid="admin-calendar-empty">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('calendar.noUpcoming', 'No upcoming bookings')}</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((dateStr) => {
          const { checkIns, checkOuts } = groupedByDate[dateStr];
          return (
            <div key={dateStr} className="space-y-2" data-testid={`admin-calendar-date-${dateStr}`}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{formatDateLabel(dateStr)}</h4>
              {checkIns.map((booking) => (
                <Card key={`in-${booking.id}`} className="overflow-visible" data-testid={`admin-calendar-checkin-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-md bg-green-500/10 shrink-0">
                        <DoorOpen className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{t('common.room', 'Room')} {booking.roomNumber}</span>
                          <Badge variant="default" className="text-xs">{t('calendar.checkIn', 'Check-in')}</Badge>
                          <Badge variant={booking.status === "confirmed" ? "secondary" : "outline"} className="text-xs">
                            {t(`common.${booking.status}`, booking.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.roomType} — {new Date(booking.checkInDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {checkOuts.map((booking) => (
                <Card key={`out-${booking.id}`} className="overflow-visible" data-testid={`admin-calendar-checkout-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-md bg-orange-500/10 shrink-0">
                        <LogOut className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{t('common.room', 'Room')} {booking.roomNumber}</span>
                          <Badge variant="outline" className="text-xs">{t('calendar.checkOut', 'Check-out')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.roomType} — {new Date(booking.checkOutDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const searchString = useSearch();

  const currentView = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("view") || null;
  }, [searchString]);

  const defaultTab = useMemo(() => {
    const viewToTab: Record<string, string> = {
      requests: "activity",
      messages: "chat",
      "room-prep": "room-prep",
      finance: "finance",
    };
    return currentView ? (viewToTab[currentView] || "activity") : "activity";
  }, [currentView]);

  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    username: "",
    password: "",
    email: "",
    role: "reception" as "admin" | "manager" | "reception" | "cleaner" | "restaurant_manager" | "waiter" | "kitchen_staff",
  });
  const [selectedChatGuestId, setSelectedChatGuestId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  interface ChatGuest {
    guestId: string;
    guestName: string;
    roomNumber: string | null;
    lastMessage: string;
    lastMessageAt: string;
  }

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: staffMembers, isLoading: staffLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/staff"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/all"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/all"],
    refetchInterval: 15000,
  });

  const { data: doorLogs, isLoading: doorLogsLoading } = useQuery<DoorActionLog[]>({
    queryKey: ["/api/door-logs"],
  });

  const { data: chatGuests, isLoading: chatGuestsLoading } = useQuery<ChatGuest[]>({
    queryKey: ["/api/chat/guests"],
    refetchInterval: 15000,
  });

  const { data: chatMessages, isLoading: chatMessagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", selectedChatGuestId],
    enabled: !!selectedChatGuestId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (chatEndRef.current) {
      const viewport = chatEndRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  const sendChatMutation = useMutation({
    mutationFn: async ({ guestId, message }: { guestId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/chat/messages/${guestId}`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedChatGuestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/guests"] });
      setChatMessage("");
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleSendChatMessage = () => {
    if (!selectedChatGuestId || !chatMessage.trim()) return;
    sendChatMutation.mutate({ guestId: selectedChatGuestId, message: chatMessage.trim() });
  };

  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [escalateMessageId, setEscalateMessageId] = useState<string | null>(null);
  const [escalationNote, setEscalationNote] = useState("");

  const escalateMutation = useMutation({
    mutationFn: async ({ messageId, note }: { messageId: string; note: string }) => {
      const response = await apiRequest("POST", "/api/chat/escalate", { messageId, note });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('chat.escalated', 'Issue escalated'), description: t('chat.escalatedDesc', 'The owner has been notified') });
      setEscalateDialogOpen(false);
      setEscalateMessageId(null);
      setEscalationNote("");
    },
    onError: (error: Error) => showErrorToast(toast, error),
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof staffForm) => {
      const payload = {
        fullName: data.fullName,
        username: data.username,
        password: data.password,
        email: data.email || undefined,
        role: data.role.toLowerCase(),
      };
      if (user?.propertyId) {
        const response = await apiRequest("POST", `/api/properties/${user.propertyId}/staff/create`, payload);
        return response.json();
      }
      const response = await apiRequest("POST", "/api/admin/create-staff", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('dashboard.admin.staffCreated', 'Staff Created'), description: t('dashboard.admin.staffCreatedDesc', 'Staff account created successfully') });
      setAddStaffOpen(false);
      setStaffForm({ fullName: "", username: "", password: "", email: "", role: "reception" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleAddStaff = () => {
    if (!staffForm.fullName || !staffForm.username || !staffForm.password) {
      showErrorToast(toast, new Error(t('errors.requiredFieldsMissing', 'Please fill in all required fields')));
      return;
    }
    createStaffMutation.mutate(staffForm);
  };

  const guestCount = users?.filter((u) => u.role === "guest").length || 0;
  const staffCount = users?.filter((u) => u.role === "reception").length || 0;
  const activeBookings = bookings?.filter((b) => b.status === "confirmed" || b.status === "pending").length || 0;
  const completedRequests = requests?.filter((r) => r.status === "completed").length || 0;
  const pendingRequests = requests?.filter((r) => r.status === "pending").length || 0;

  const requestsByType = requests?.reduce((acc, r) => {
    acc[r.requestType] = (acc[r.requestType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const formatTime = (date: Date | string) => formatTimeAgo(date);

  const isLoading = usersLoading || requestsLoading || bookingsLoading || notificationsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold truncate">{t('dashboard.admin.title', 'Admin Dashboard')}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">{t('dashboard.admin.subtitle', 'Manage guests, bookings, and monitor hotel activity')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
            data-testid="button-signout"
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.signOut', 'Sign Out')}</span>
          </Button>
        </div>
      </div>

      {!currentView && (<>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.admin.totalGuests', 'Total Guests')}
          value={guestCount}
          description={t('dashboard.admin.registeredGuests', 'Registered guests')}
          icon={Users}
          trend={{ value: 12, positive: true }}
          iconColor="text-blue-500"
        />
        <StatCard
          title={t('dashboard.admin.activeBookings', 'Active Bookings')}
          value={activeBookings}
          description={t('dashboard.admin.currentReservations', 'Current reservations')}
          icon={DoorOpen}
          iconColor="text-green-500"
        />
        <StatCard
          title={t('dashboard.admin.pendingRequests', 'Pending Requests')}
          value={pendingRequests}
          description={t('dashboard.admin.awaitingResponse', 'Awaiting response')}
          icon={Clock}
          iconColor="text-orange-500"
        />
        <StatCard
          title={t('dashboard.admin.completedRequests', 'Completed Requests')}
          value={completedRequests}
          description={t('dashboard.admin.fulfilledThisWeek', 'Fulfilled this week')}
          icon={CheckCircle}
          trend={{ value: 8, positive: true }}
          iconColor="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('dashboard.admin.serviceRequestsByType', 'Service Requests by Type')}
            </CardTitle>
            <CardDescription>{t('dashboard.admin.requestDistribution', 'Distribution of service requests')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(requestsByType).length > 0 ? (
                Object.entries(requestsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const Icon = serviceIcons[type] || HelpCircle;
                    const total = requests?.length || 1;
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{t(`dashboard.admin.transactionCategories.${type}`, type.replace("_", " "))}</span>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t('dashboard.admin.noRequestData', 'No request data available')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {t('dashboard.admin.staffList')}
            </CardTitle>
            <CardDescription>{t('dashboard.admin.teamMembers', '{{count}} team members', { count: staffMembers?.length || 0 })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffMembers && staffMembers.length > 0 ? (
                staffMembers.slice(0, 5).map((staff) => (
                  <div key={staff.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {staff.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{staff.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {staff.role === "admin" ? t('common.admin', 'Admin') : t('common.staff', 'Staff')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('dashboard.admin.noStaffMembers', 'No staff members')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </>)}

      {currentView === "tasks" ? (
        <AdminTasksView />
      ) : currentView === "calendar" ? (
        <AdminCalendarView />
      ) : currentView === "my-performance" ? (
        <StaffMyPerformance />
      ) : currentView === "room-status" ? (
        <AdminRoomStatusPanel />
      ) : currentView === "housekeeping" ? (
        <HousekeepingView />
      ) : (
      <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full min-w-0 overflow-hidden">
        <TabsList className="flex w-full gap-1 overflow-x-auto scrollbar-hide h-auto flex-nowrap justify-start p-1">
          <TabsTrigger value="activity" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-activity">
            <Activity className="h-4 w-4" />
            {t('dashboard.admin.activity')}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-bookings">
            <Calendar className="h-4 w-4" />
            {t('dashboard.admin.bookings')}
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-staff">
            <UserCog className="h-4 w-4" />
            {t('dashboard.admin.staff')}
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-admin-chat">
            <MessageSquare className="h-4 w-4" />
            {t('chat.title')} ({chatGuests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="door-security" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-door-security">
            <Shield className="h-4 w-4" />
            {t('dashboard.admin.security')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            {t('dashboard.admin.notifications')}
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-admin-finance">
            <DollarSign className="h-4 w-4" />
            {t('finance.title')}
          </TabsTrigger>
          <TabsTrigger value="room-prep" className="gap-2 flex-shrink-0 whitespace-nowrap" data-testid="tab-room-prep">
            <PartyPopper className="h-4 w-4" />
            {t('roomPrep.ordersManagement')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {requests && requests.length > 0 ? (
                    requests.slice(0, 15).map((request) => {
                      const Icon = serviceIcons[request.requestType] || HelpCircle;
                      return (
                        <div key={request.id} className="p-4 flex items-start gap-4" data-testid={`activity-item-${request.id}`}>
                          <div className="p-2 rounded-md bg-muted shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium capitalize text-sm">
                                {t(`dashboard.admin.transactionCategories.${request.requestType}`, request.requestType.replace("_", " "))}
                              </span>
                              <RequestStatusBadge status={request.status} />
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {t('common.room', 'Room')} {request.roomNumber} - {request.description}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(request.createdAt!)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('dashboard.admin.noRecentActivity', 'No recent activity')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {bookings && bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <div key={booking.id} className="p-4 flex items-start gap-4" data-testid={`booking-item-${booking.id}`}>
                        <div className="p-2 rounded-md bg-muted shrink-0">
                          <DoorOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {t('common.room', 'Room')} {booking.roomNumber}
                            </span>
                            {booking.status === "checked_in" && (
                              <Badge variant="default" className="text-xs">{t('dashboard.guest.checkedIn', 'Checked in')}</Badge>
                            )}
                            {(booking.status === "arrival_info_submitted" || booking.status === "precheck_submitted") && (
                              <Badge variant="secondary" className="text-xs">{t('dashboard.guest.arrivalInfoSent', 'Arrival info sent')}</Badge>
                            )}
                            {booking.status === "checked_out" && (
                              <Badge variant="outline" className="text-xs">{t('dashboard.guest.checkedOut', 'Checked out')}</Badge>
                            )}
                            {(booking.status === "booked" || booking.status === "pending" || booking.status === "confirmed") && (
                              <Badge variant="secondary" className="text-xs">{t(`common.${booking.status}`, booking.status)}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.roomType} - {new Date(booking.checkInDate).toLocaleDateString()} — {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('dashboard.admin.noBookingsFound', 'No bookings found')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">{t('dashboard.admin.manageStaff')}</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('dashboard.admin.manageStaffDesc', 'Manage admin and reception staff for your hotel')}
                </CardDescription>
              </div>
              <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-staff">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('dashboard.admin.addStaff')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('staff.addStaffMember', 'Add Staff Member')}</DialogTitle>
                    <DialogDescription>{t('staff.createDescription', 'Create a new admin or reception staff account')}</DialogDescription>
                  </DialogHeader>
                  <DialogBody className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-name">{t('staff.fullName')} *</Label>
                      <Input
                        id="staff-name"
                        value={staffForm.fullName}
                        onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                        placeholder={t('placeholders.fullName', 'John Smith')}
                        data-testid="input-staff-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-role">{t('common.role')} *</Label>
                      <Select
                        value={staffForm.role}
                        onValueChange={(value: "admin" | "manager" | "reception" | "cleaner" | "restaurant_manager" | "waiter" | "kitchen_staff") => setStaffForm({ ...staffForm, role: value })}
                      >
                        <SelectTrigger data-testid="select-staff-role">
                          <SelectValue placeholder={t('staff.selectRole', 'Select role')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('staff.adminRole', 'Admin (Full Access)')}</SelectItem>
                          <SelectItem value="manager">{t('staff.managerRole', 'Manager')}</SelectItem>
                          <SelectItem value="reception">{t('staff.receptionRole', 'Reception (Guest Management)')}</SelectItem>
                          <SelectItem value="cleaner">{t('staff.cleanerRole', 'Cleaner')}</SelectItem>
                          <SelectItem value="restaurant_manager">Restaurant Manager</SelectItem>
                          <SelectItem value="waiter">Waiter</SelectItem>
                          <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-username">{t('auth.username')} *</Label>
                      <Input
                        id="staff-username"
                        value={staffForm.username}
                        onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                        placeholder={t('placeholders.username', 'jsmith')}
                        data-testid="input-staff-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-password">{t('auth.password')} *</Label>
                      <Input
                        id="staff-password"
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder={t('placeholders.password', 'Choose a password')}
                        data-testid="input-staff-password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-email">{t('common.email')} ({t('common.optional')})</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        placeholder={t('placeholders.email', 'jsmith@hotel.com')}
                        data-testid="input-staff-email"
                      />
                    </div>
                  </DialogBody>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddStaffOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                    <Button onClick={handleAddStaff} disabled={createStaffMutation.isPending} data-testid="button-create-staff">
                      {createStaffMutation.isPending ? t('common.creating', 'Creating...') : t('dashboard.admin.addStaff', 'Add Staff')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {staffLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : staffMembers && staffMembers.length > 0 ? (
                    staffMembers.map((staff) => (
                      <div key={staff.id} className="p-4 flex items-center gap-4" data-testid={`staff-item-${staff.id}`}>
                        <Avatar>
                          <AvatarFallback>{staff.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{staff.fullName}</span>
                            <Badge variant={staff.role === "admin" ? "default" : "secondary"}>
                              {staff.role === "admin" ? t('common.admin', 'Admin') : t('common.reception', 'Reception')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">@{staff.username}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <UserCog className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('dashboard.admin.noStaffMembers', 'No staff members found')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{t('dashboard.admin.guestList')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/guests"] })}
                    data-testid="button-admin-refresh-chat-list"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {chatGuestsLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : chatGuests && chatGuests.length > 0 ? (
                    <div className="divide-y">
                      {chatGuests.map((chat) => (
                        <div
                          key={chat.guestId}
                          className={`p-3 cursor-pointer hover-elevate ${
                            selectedChatGuestId === chat.guestId ? "bg-muted" : ""
                          }`}
                          onClick={() => {
                            setSelectedChatGuestId(chat.guestId);
                            queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", chat.guestId] });
                          }}
                          data-testid={`admin-chat-guest-${chat.guestId}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{chat.guestName}</span>
                                {chat.roomNumber && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {t('common.room', 'Room')} {chat.roomNumber}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {chat.lastMessage}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('chat.noConversations', 'No conversations yet')}</p>
                      <p className="text-sm">{t('chat.startConversation', 'Guests will appear here when they message')}</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {selectedChatGuestId 
                      ? chatGuests?.find(g => g.guestId === selectedChatGuestId)?.guestName || t('chat.title', 'Chat')
                      : t('chat.selectConversation', 'Select a conversation')}
                  </CardTitle>
                  {selectedChatGuestId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedChatGuestId] })}
                      data-testid="button-admin-refresh-messages"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {selectedChatGuestId ? (
                  <>
                    <ScrollArea className="h-[300px] mb-4 border rounded-md p-3">
                      {chatMessagesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-3/4" />
                          <Skeleton className="h-10 w-2/3 ml-auto" />
                          <Skeleton className="h-10 w-3/4" />
                        </div>
                      ) : chatMessages && chatMessages.length > 0 ? (
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderRole === "guest" ? "justify-start" : "justify-end"}`}
                              data-testid={`admin-chat-msg-${msg.id}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                  msg.senderRole === "guest"
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${
                                  msg.senderRole === "guest" ? "text-muted-foreground" : "text-primary-foreground/70"
                                }`}>
                                  {msg.senderRole !== "guest" && <span className="capitalize">{msg.senderRole} · </span>}
                                  {new Date(msg.createdAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          <p>{t('chat.noMessages', 'No messages yet')}</p>
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Input
                        ref={chatInputRef}
                        placeholder={t('chat.typeMessage', 'Type a message...')}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                        }}
                        disabled={sendChatMutation.isPending}
                        data-testid="input-admin-chat"
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        disabled={!chatMessage.trim() || sendChatMutation.isPending}
                        data-testid="button-admin-send-chat"
                      >
                        {sendChatMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {chatMessages && chatMessages.length > 0 && (
                      <div className="mt-2 flex justify-end">
                        <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                const lastGuestMsg = chatMessages.filter(m => m.senderRole === "guest").pop();
                                if (lastGuestMsg) setEscalateMessageId(lastGuestMsg.id);
                              }}
                              data-testid="button-admin-escalate-chat"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t('chat.escalateToOwner', 'Escalate to Owner')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t('chat.escalateIssue', 'Escalate Issue')}</DialogTitle>
                              <DialogDescription>
                                {t('chat.escalateDesc', 'This will notify the property owner about this guest issue.')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-2 px-4 sm:px-6">
                              <Label>{t('chat.escalationNote', 'Note for owner')}</Label>
                              <Textarea
                                value={escalationNote}
                                onChange={(e) => setEscalationNote(e.target.value)}
                                placeholder={t('chat.escalationNotePlaceholder', 'Describe why this needs owner attention...')}
                                data-testid="input-admin-escalation-note"
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEscalateDialogOpen(false)}
                              >
                                {t('common.cancel', 'Cancel')}
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={!escalateMessageId || escalateMutation.isPending}
                                onClick={() => {
                                  if (escalateMessageId) {
                                    escalateMutation.mutate({ messageId: escalateMessageId, note: escalationNote });
                                  }
                                }}
                                data-testid="button-admin-confirm-escalate"
                              >
                                {escalateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                )}
                                {t('chat.escalate', 'Escalate')}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('chat.selectConversation', 'Select a guest conversation to view messages')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="door-security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('dashboard.admin.doorLogs')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.admin.doorLogsDesc', 'Real-time monitoring of all door lock/unlock events')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {doorLogsLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : doorLogs && doorLogs.length > 0 ? (
                    doorLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4"
                        data-testid={`door-log-${log.id}`}
                      >
                        <div className={`p-2 rounded-md ${log.action === "open" ? "bg-red-500/10" : "bg-green-500/10"}`}>
                          {log.action === "open" ? (
                            <LockOpen className="h-5 w-5 text-red-500" />
                          ) : (
                            <Lock className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{t('common.room', 'Room')} {log.roomNumber}</span>
                            <Badge variant={log.action === "open" ? "destructive" : "default"} className="text-xs">
                              {log.action === "open" ? t('room.unlocked', 'Unlocked') : t('room.locked', 'Locked')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{t('requests.assignedTo', 'By')}: {log.performedBy}</span>
                            <span className="text-xs">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(log.createdAt!).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Shield className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('dashboard.admin.noDoorActivity', 'No door activity recorded')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 flex items-start gap-4 ${!notification.read ? "bg-muted/30" : ""}`}
                        data-testid={`notification-item-${notification.id}`}
                      >
                        <div className="p-2 rounded-md bg-muted shrink-0">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(notification.createdAt!)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('notifications.noNotifications', 'No notifications')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <AdminFinancePanel />
        </TabsContent>

        <TabsContent value="room-prep" className="mt-4">
          <AdminRoomPrepPanel />
        </TabsContent>

      </Tabs>
      )}
    </div>
  );
}

function AdminFinancePanel() {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = useQuery<FinanceAnalytics>({
    queryKey: ["/api/finance/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    room_booking: t('dashboard.admin.transactionCategories.room_booking', 'Room Booking'),
    room_service: t('dashboard.admin.transactionCategories.room_service', 'Room Service'),
    housekeeping: t('dashboard.admin.transactionCategories.housekeeping', 'Housekeeping'),
    late_checkout: t('dashboard.admin.transactionCategories.late_checkout', 'Late Check-out'),
    damage_charge: t('dashboard.admin.transactionCategories.damage_charge', 'Damage Charge'),
    minibar: t('dashboard.admin.transactionCategories.minibar', 'Minibar'),
    spa: t('dashboard.admin.transactionCategories.spa', 'Spa & Wellness'),
    restaurant: t('dashboard.admin.transactionCategories.restaurant', 'Restaurant'),
    laundry: t('dashboard.admin.transactionCategories.laundry', 'Laundry'),
    parking: t('dashboard.admin.transactionCategories.parking', 'Parking'),
    other: t('dashboard.admin.transactionCategories.other', 'Other'),
  };

  const topServices = analytics?.serviceDistribution
    ?.filter(s => s.category !== "room_booking")
    ?.sort((a, b) => b.amount - a.amount)
    ?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('finance.dailyRevenue')}</p>
                <p className="text-2xl font-bold">${analytics?.dailyRevenue?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('finance.monthlyRevenue')}</p>
                <p className="text-2xl font-bold">${analytics?.monthlyRevenue?.toFixed(2) || "0.00"}</p>
                {analytics?.monthlyTrend !== undefined && (
                  <div className={`text-xs flex items-center gap-1 ${analytics.monthlyTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.monthlyTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(analytics.monthlyTrend).toFixed(1)}% {t('dashboard.admin.vsLastMonth', 'vs last month')}
                  </div>
                )}
              </div>
              <div className="p-2 rounded-md bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('finance.occupancyRate')}</p>
                <p className="text-2xl font-bold">{analytics?.occupancyRate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {analytics?.bookedRooms || 0} / {analytics?.totalRooms || 0} {t('dashboard.admin.rooms', 'rooms')}
                </p>
              </div>
              <div className="p-2 rounded-md bg-blue-500/10">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('finance.revPar')}</p>
                <p className="text-2xl font-bold">${analytics?.revPar?.toFixed(2) || "0.00"}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.admin.revenuePerRoom', 'Revenue per available room')}</p>
              </div>
              <div className="p-2 rounded-md bg-orange-500/10">
                <Building className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.admin.revenueBreakdown')}</CardTitle>
            <CardDescription>{t('dashboard.admin.servicesVsBookings', 'Services vs Room Bookings')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">{t('dashboard.admin.bookingsRevenue')}</span>
                <span className="text-xl font-bold text-primary">${analytics?.bookingRevenue?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">{t('dashboard.admin.servicesRevenue')}</span>
                <span className="text-xl font-bold text-primary">${analytics?.serviceRevenue?.toFixed(2) || "0.00"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.admin.topServices')}</CardTitle>
            <CardDescription>{t('dashboard.admin.revenueByServiceCategory', 'Revenue by service category')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topServices.length > 0 ? (
              <div className="space-y-3">
                {topServices.map((service) => (
                  <div key={service.category} className="flex justify-between items-center">
                    <span className="text-sm">{categoryLabels[service.category] || service.category}</span>
                    <span className="font-medium">${service.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">{t('dashboard.admin.noServiceData', 'No service data yet')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics && analytics.noShowCount > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              {t('finance.noShowImpact')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.admin.totalNoShows', 'Total No-Shows')}</p>
                <p className="text-2xl font-bold">{analytics.noShowCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.admin.estimatedRevenueLoss', 'Estimated Revenue Loss')}</p>
                <p className="text-2xl font-bold text-orange-600">${analytics.noShowRevenueLoss.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AdminExpenseEntry />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.admin.transactionManagement', 'Transaction Management')}</CardTitle>
          <CardDescription>{t('dashboard.admin.viewAllTransactions', 'View all financial transactions')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FinancePanel isReadOnly={true} />
        </CardContent>
      </Card>
    </div>
  );
}

function AdminExpenseEntry() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");

  const { data: recentExpenses } = useQuery<any[]>({
    queryKey: ["/api/finance-center/expenses"],
  });

  const addExpense = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/finance-center/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/summary"] });
      toast({ title: t('dashboard.admin.expenseRecorded', 'Expense recorded') });
      setOpen(false);
      setDescription("");
      setCategory("");
      setVendor("");
      setAmount("");
    },
    onError: (error: any) => {
      showErrorToast(toast, error);
    },
  });

  const expenseCats = [
    { value: "utilities_electricity", label: t('dashboard.admin.expenseCategories.utilities_electricity', 'Electricity') },
    { value: "utilities_water", label: t('dashboard.admin.expenseCategories.utilities_water', 'Water') },
    { value: "utilities_internet", label: t('dashboard.admin.expenseCategories.utilities_internet', 'Internet / WiFi') },
    { value: "maintenance", label: t('dashboard.admin.expenseCategories.maintenance', 'Maintenance & Repairs') },
    { value: "supplies", label: t('dashboard.admin.expenseCategories.supplies', 'Supplies & Amenities') },
    { value: "cleaning", label: t('dashboard.admin.expenseCategories.cleaning', 'Cleaning Supplies') },
    { value: "food_beverage", label: t('dashboard.admin.expenseCategories.food_beverage', 'Food & Beverage') },
    { value: "equipment", label: t('dashboard.admin.expenseCategories.equipment', 'Equipment') },
    { value: "emergency", label: t('dashboard.admin.expenseCategories.emergency', 'Emergency Purchase') },
    { value: "external_service", label: t('dashboard.admin.expenseCategories.external_service', 'External Service') },
    { value: "other", label: t('dashboard.admin.expenseCategories.other', 'Other') },
  ];

  const last5 = (recentExpenses || []).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">{t("finance.recordExpense", "Record Expense")}</CardTitle>
          <CardDescription>{t('dashboard.admin.logOperationalExpenses', 'Log operational expenses for this property')}</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-expense">
              <Plus className="h-4 w-4 mr-1" />
              {t('dashboard.admin.addExpense', 'Add Expense')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.admin.recordNewExpense', 'Record New Expense')}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-4">
                <div>
                  <Label>{t('common.description', 'Description')}</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('dashboard.admin.whatWasPurchased', 'What was purchased?')} data-testid="input-expense-description" />
                </div>
                <div>
                  <Label>{t('common.category', 'Category')}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-expense-category">
                      <SelectValue placeholder={t('finance.selectCategory', 'Select category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCats.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('common.vendor', 'Vendor')}</Label>
                  <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder={t('dashboard.admin.supplierName', 'Supplier name (optional)')} data-testid="input-expense-vendor" />
                </div>
                <div>
                  <Label>{t('common.amount', 'Amount')}</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('placeholders.amount', '0.00')} data-testid="input-expense-amount" />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
              <Button
                onClick={() => {
                  const parsed = parseFloat(amount);
                  if (isNaN(parsed) || parsed <= 0) return;
                  addExpense.mutate({
                    description,
                    category,
                    vendor: vendor || null,
                    amount: Math.round(parsed * 100),
                  });
                }}
                disabled={!description || !category || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || addExpense.isPending}
                data-testid="button-submit-expense"
              >
                {addExpense.isPending ? t('common.saving', 'Saving...') : t('dashboard.admin.saveExpense', 'Save Expense')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {last5.length > 0 ? (
          <div className="space-y-2">
            {last5.map((exp: any) => (
              <div key={exp.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">{exp.vendor || exp.category} &middot; {new Date(exp.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-red-600">${(exp.amount / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.admin.noExpensesRecorded', 'No expenses recorded yet')}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AdminRoomPrepPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<RoomPreparationOrder | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageForm, setManageForm] = useState({
    status: "",
    price: "",
    staffAssigned: "",
    adminNotes: "",
    rejectionReason: "",
  });

  const { data: orders, isLoading } = useQuery<RoomPreparationOrder[]>({
    queryKey: ["/api/room-prep-orders/hotel"],
  });

  const { data: staffList = [] } = useQuery<User[]>({
    queryKey: ["/api/users/staff"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await apiRequest("PATCH", `/api/room-prep-orders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('roomPrep.orderUpdated', 'Order updated successfully') });
      setManageOpen(false);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ["/api/room-prep-orders/hotel"] });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleManageOrder = (order: RoomPreparationOrder) => {
    setSelectedOrder(order);
    setManageForm({
      status: order.status,
      price: order.price ? (order.price / 100).toString() : "",
      staffAssigned: order.staffAssigned || "",
      adminNotes: order.adminNotes || "",
      rejectionReason: order.rejectionReason || "",
    });
    setManageOpen(true);
  };

  const handleSaveOrder = () => {
    if (!selectedOrder) return;
    const data: Record<string, unknown> = {
      status: manageForm.status,
      staffAssigned: manageForm.staffAssigned || null,
      adminNotes: manageForm.adminNotes || null,
      rejectionReason: manageForm.status === "rejected" ? manageForm.rejectionReason : null,
    };
    if (manageForm.price) {
      data.price = Math.round(parseFloat(manageForm.price) * 100);
    }
    updateOrderMutation.mutate({ id: selectedOrder.id, data });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-primary" />
            {t('roomPrep.ordersManagement', 'Room Preparation Orders')}
          </CardTitle>
          <CardDescription>{t('roomPrep.manageOrders', 'Manage Orders')}</CardDescription>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} data-testid={`room-prep-order-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm capitalize" data-testid={`text-occasion-${order.id}`}>
                            {t(`roomPrep.occasion.${order.occasionType}`, order.occasionType.replace("_", " "))}
                          </span>
                          <PrepStatusBadge status={order.status} />
                          {order.budgetRange && (
                            <Badge variant="outline" className="text-xs" data-testid={`badge-budget-${order.id}`}>
                              {t(`roomPrep.budget.${order.budgetRange}`, order.budgetRange)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span data-testid={`text-guest-${order.id}`}>{t('common.guest', 'Guest')}: {(order as any).guestName || order.guestId}</span>
                          <span data-testid={`text-room-${order.id}`}>{t('common.room', 'Room')}: {order.roomNumber}</span>
                          {order.decorationStyle && (
                            <span data-testid={`text-decoration-${order.id}`}>
                              {t(`roomPrep.decoration.${order.decorationStyle}`, order.decorationStyle.replace("_", " "))}
                            </span>
                          )}
                        </div>
                        {order.addOns && order.addOns.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap" data-testid={`addons-${order.id}`}>
                            {order.addOns.map((addOn) => (
                              <Badge key={addOn} variant="secondary" className="text-xs">
                                {t(`roomPrep.addon.${addOn}`, addOn.replace("_", " "))}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {order.notes && (
                          <p className="text-sm text-muted-foreground" data-testid={`text-notes-${order.id}`}>{order.notes}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span data-testid={`text-date-${order.id}`}>{new Date(order.createdAt!).toLocaleString()}</span>
                          {order.price && (
                            <span className="font-medium text-foreground" data-testid={`text-price-${order.id}`}>
                              ${(order.price / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageOrder(order)}
                        data-testid={`button-manage-order-${order.id}`}
                      >
                        {t('common.manage', 'Manage')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <PartyPopper className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{t('roomPrep.noOrders', 'No preparation orders yet')}</p>
              <p className="text-sm mt-1">{t('roomPrep.noOrdersDesc', 'Create your first special occasion order to make your stay unforgettable.')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('roomPrep.orderDetails', 'Order Details')}</DialogTitle>
            <DialogDescription>
              {selectedOrder && t(`roomPrep.occasion.${selectedOrder.occasionType}`, selectedOrder.occasionType)} - {t('common.room', 'Room')} {selectedOrder?.roomNumber}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roomPrep.updateStatus', 'Update Status')}</Label>
              <Select
                value={manageForm.status}
                onValueChange={(value) => setManageForm({ ...manageForm, status: value })}
              >
                <SelectTrigger data-testid="select-prep-status">
                  <SelectValue placeholder={t('common.selectOption', 'Select an option')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('common.pending', 'Pending')}</SelectItem>
                  <SelectItem value="accepted">{t('roomPrep.status.accepted', 'Accepted')}</SelectItem>
                  <SelectItem value="in_preparation">{t('roomPrep.status.in_preparation', 'In Preparation')}</SelectItem>
                  <SelectItem value="ready">{t('roomPrep.status.ready', 'Ready')}</SelectItem>
                  <SelectItem value="delivered">{t('roomPrep.status.delivered', 'Delivered')}</SelectItem>
                  <SelectItem value="rejected">{t('roomPrep.status.rejected', 'Rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep-price">{t('roomPrep.setPrice', 'Set Price')} ($)</Label>
              <Input
                id="prep-price"
                type="number"
                step="0.01"
                min="0"
                value={manageForm.price}
                onChange={(e) => setManageForm({ ...manageForm, price: e.target.value })}
                placeholder="0.00"
                data-testid="input-prep-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep-staff">{t('roomPrep.assignStaff', 'Assign Staff')}</Label>
              <Select
                value={manageForm.staffAssigned}
                onValueChange={(value) => setManageForm({ ...manageForm, staffAssigned: value })}
              >
                <SelectTrigger id="prep-staff" data-testid="select-prep-staff">
                  <SelectValue placeholder={t('requests.selectStaffMember', 'Select staff member')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.none', 'None')}</SelectItem>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.fullName} data-testid={`option-admin-staff-${staff.id}`}>
                      {staff.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep-admin-notes">{t('roomPrep.adminNotes', 'Internal Notes')}</Label>
              <Textarea
                id="prep-admin-notes"
                value={manageForm.adminNotes}
                onChange={(e) => setManageForm({ ...manageForm, adminNotes: e.target.value })}
                placeholder={t('roomPrep.adminNotes', 'Internal Notes')}
                data-testid="input-prep-admin-notes"
              />
            </div>
            {manageForm.status === "rejected" && (
              <div className="space-y-2">
                <Label htmlFor="prep-rejection-reason">{t('roomPrep.rejectionReason', 'Rejection Reason')}</Label>
                <Textarea
                  id="prep-rejection-reason"
                  value={manageForm.rejectionReason}
                  onChange={(e) => setManageForm({ ...manageForm, rejectionReason: e.target.value })}
                  placeholder={t('roomPrep.rejectionReason', 'Rejection Reason')}
                  data-testid="input-prep-rejection-reason"
                />
              </div>
            )}
          </DialogBody>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setManageOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleSaveOrder} disabled={updateOrderMutation.isPending} data-testid="button-save-prep-order">
              {updateOrderMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

