import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast, isPlanLimitError } from "@/lib/error-handler";
import { UpgradeModal } from "@/components/upgrade-modal";
import { formatTimeAgo } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { RequestStatusBadge, PrepStatusBadge } from "@/components/request-status-badge";
import { getPriorityTextColor } from "@/components/priority-indicator";
import {
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
  Coffee,
  Car,
  UtensilsCrossed,
  SprayCan,
  Wrench,
  HelpCircle,
  DoorOpen,
  Loader2,
  Archive,
  Bell,
  UserPlus,
  Users,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  Activity,
  Key,
  History,
  Trash2,
  MessageSquare,
  Send,
  RefreshCw,
  LogOut,
  PartyPopper,
  AlertTriangle,
  ClipboardList,
  CalendarDays,
  ArrowLeft,
  Eye,
  BedDouble,
  Sparkles,
  Users2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { validatePhone } from "@/lib/validation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ServiceRequest, User, Booking, ChatMessage, RoomPreparationOrder, Notification as NotificationItem } from "@shared/schema";
import { FinancePanel } from "@/components/finance-panel";
import { StaffMyPerformance } from "@/components/staff-my-performance";
import { HousekeepingView } from "@/components/housekeeping-view";
import { useNotificationAlert } from "@/hooks/use-notification-alert";

const serviceIcons: Record<string, React.ElementType> = {
  coffee: Coffee,
  taxi: Car,
  room_service: UtensilsCrossed,
  housekeeping: SprayCan,
  maintenance: Wrench,
  concierge: HelpCircle,
  other: HelpCircle,
};


function ReceptionTasksView() {
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
      <div className="space-y-3" data-testid="tasks-view-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const hasTasks = myServiceTasks.length > 0 || myPrepTasks.length > 0;

  return (
    <div className="space-y-6" data-testid="tasks-view">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('tasks.myTasks', 'My Tasks')}</h3>
        <Badge variant="secondary">{myServiceTasks.length + myPrepTasks.length}</Badge>
      </div>

      {!hasTasks && (
        <Card data-testid="tasks-empty">
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
              <Card key={request.id} className="overflow-visible" data-testid={`task-request-${request.id}`}>
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
                          <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: "in_progress" })} disabled={updateRequestMutation.isPending} data-testid={`task-start-${request.id}`}>
                            {t('tasks.startWork', 'Start Work')}
                          </Button>
                        )}
                        {request.status === "in_progress" && (
                          <Button size="sm" onClick={() => updateRequestMutation.mutate({ id: request.id, status: "completed" })} disabled={updateRequestMutation.isPending} data-testid={`task-complete-${request.id}`}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('tasks.markComplete', 'Mark Complete')}
                          </Button>
                        )}
                        {request.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => updateRequestMutation.mutate({ id: request.id, status: "approved" })} disabled={updateRequestMutation.isPending} data-testid={`task-approve-${request.id}`}>
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
            <Card key={order.id} className="overflow-visible" data-testid={`task-prep-${order.id}`}>
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
                        <Button size="sm" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "in_preparation" })} disabled={updatePrepMutation.isPending} data-testid={`task-prep-start-${order.id}`}>
                          {t('tasks.startPreparation', 'Start Preparation')}
                        </Button>
                      )}
                      {order.status === "in_preparation" && (
                        <Button size="sm" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "ready" })} disabled={updatePrepMutation.isPending} data-testid={`task-prep-ready-${order.id}`}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('tasks.markReady', 'Mark Ready')}
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button size="sm" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "delivered" })} disabled={updatePrepMutation.isPending} data-testid={`task-prep-deliver-${order.id}`}>
                          {t('tasks.markDelivered', 'Mark Delivered')}
                        </Button>
                      )}
                      {order.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updatePrepMutation.mutate({ id: order.id, status: "accepted" })} disabled={updatePrepMutation.isPending} data-testid={`task-prep-accept-${order.id}`}>
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

function ReceptionCalendarView() {
  const { t } = useTranslation();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: allUnits = [] } = useQuery<RoomUnit[]>({
    queryKey: ["/api/units/status"],
  });

  const getRoomLabel = (booking: { roomNumber: string; unitId?: string | null }) => {
    if (booking.unitId) {
      const unit = allUnits.find(u => u.id === booking.unitId);
      if (unit?.name) return `${unit.name} (${unit.unitNumber})`;
    }
    return booking.roomNumber;
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="calendar-view-loading">
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
    <div className="space-y-6" data-testid="calendar-view">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('calendar.title', 'Calendar')}</h3>
      </div>

      {sortedDates.length === 0 ? (
        <Card data-testid="calendar-empty">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('calendar.noUpcoming', 'No upcoming bookings')}</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((dateStr) => {
          const { checkIns, checkOuts } = groupedByDate[dateStr];
          return (
            <div key={dateStr} className="space-y-2" data-testid={`calendar-date-${dateStr}`}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{formatDateLabel(dateStr)}</h4>
              {checkIns.map((booking) => (
                <Card key={`in-${booking.id}`} className="overflow-visible" data-testid={`calendar-checkin-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-md bg-green-500/10 shrink-0">
                        <DoorOpen className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{t('common.room', 'Room')} {getRoomLabel(booking)}</span>
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
                <Card key={`out-${booking.id}`} className="overflow-visible" data-testid={`calendar-checkout-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-md bg-orange-500/10 shrink-0">
                        <LogOut className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{t('common.room', 'Room')} {getRoomLabel(booking)}</span>
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

function ReceptionRoomPrepPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [manageOrder, setManageOrder] = useState<RoomPreparationOrder | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [staffAssigned, setStaffAssigned] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: orders, isLoading } = useQuery<RoomPreparationOrder[]>({
    queryKey: ["/api/room-prep-orders/hotel"],
  });

  const { data: staffList = [] } = useQuery<User[]>({
    queryKey: ["/api/users/staff"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; price?: number; staffAssigned?: string; adminNotes?: string; rejectionReason?: string }) => {
      const { id, ...body } = data;
      const response = await apiRequest("PATCH", `/api/room-prep-orders/${id}`, body);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-prep-orders/hotel"] });
      setManageOpen(false);
      setManageOrder(null);
      toast({
        title: t('roomPrep.orderUpdated', 'Order Updated'),
        description: t('roomPrep.orderUpdatedDesc', 'The room preparation order has been updated.'),
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleOpenManage = (order: RoomPreparationOrder) => {
    setManageOrder(order);
    setOrderStatus(order.status);
    setOrderPrice(order.price ? (order.price / 100).toString() : "");
    setStaffAssigned(order.staffAssigned || "");
    setAdminNotes(order.adminNotes || "");
    setRejectionReason(order.rejectionReason || "");
    setManageOpen(true);
  };

  const handleSubmitManage = () => {
    if (!manageOrder) return;
    updateOrderMutation.mutate({
      id: manageOrder.id,
      status: orderStatus,
      price: orderPrice ? Math.round(parseFloat(orderPrice) * 100) : undefined,
      staffAssigned: staffAssigned || undefined,
      adminNotes: adminNotes || undefined,
      rejectionReason: orderStatus === "rejected" ? rejectionReason : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="room-prep-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card data-testid="room-prep-empty">
        <CardContent className="p-8 text-center text-muted-foreground">
          <PartyPopper className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>{t('roomPrep.noOrders', 'No room preparation orders')}</p>
          <p className="text-sm">{t('roomPrep.noOrdersDesc', 'Room preparation orders from guests will appear here.')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3" data-testid="room-prep-list">
        {orders.map((order) => (
          <Card key={order.id} data-testid={`room-prep-order-${order.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle className="text-base capitalize">
                  {t(`roomPrep.occasion.${order.occasionType}`, order.occasionType.replace("_", " "))}
                </CardTitle>
                <CardDescription>
                  {(order as any).guestName || order.guestId} — {t('common.room', 'Room')} {order.roomNumber}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <PrepStatusBadge status={order.status} />
                <Button size="sm" variant="outline" onClick={() => handleOpenManage(order)} data-testid={`manage-room-prep-${order.id}`}>
                  {t('common.manage', 'Manage')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {order.decorationStyle && (
                  <span>{t(`roomPrep.decoration.${order.decorationStyle}`, order.decorationStyle.replace("_", " "))}</span>
                )}
                <span>{t(`roomPrep.budget.${order.budgetRange}`, order.budgetRange)}</span>
              </div>
              {order.addOns && order.addOns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {order.addOns.map((addon, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs" data-testid={`addon-badge-${order.id}-${idx}`}>
                      {t(`roomPrep.addon.${addon}`, addon.replace("_", " "))}
                    </Badge>
                  ))}
                </div>
              )}
              {order.notes && (
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {order.price != null && (
                  <span className="font-medium" data-testid={`price-${order.id}`}>
                    ${(order.price / 100).toFixed(2)}
                  </span>
                )}
                {order.createdAt && (
                  <span className="text-muted-foreground" data-testid={`date-${order.id}`}>
                    {formatTimeAgo(order.createdAt)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('roomPrep.manageOrder', 'Manage Room Preparation')}</DialogTitle>
            <DialogDescription>
              {t('roomPrep.manageOrderDesc', 'Update the status and details for this order.')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common.status', 'Status')}</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger data-testid="select-prep-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('roomPrep.status.pending', 'Pending')}</SelectItem>
                    <SelectItem value="accepted">{t('roomPrep.status.accepted', 'Accepted')}</SelectItem>
                    <SelectItem value="in_preparation">{t('roomPrep.status.in_preparation', 'In Preparation')}</SelectItem>
                    <SelectItem value="ready">{t('roomPrep.status.ready', 'Ready')}</SelectItem>
                    <SelectItem value="delivered">{t('roomPrep.status.delivered', 'Delivered')}</SelectItem>
                    <SelectItem value="rejected">{t('roomPrep.status.rejected', 'Rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('roomPrep.price', 'Price ($)')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-prep-price"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('roomPrep.staffAssigned', 'Staff Assigned')}</Label>
                <Select value={staffAssigned} onValueChange={setStaffAssigned}>
                  <SelectTrigger data-testid="select-staff-assigned">
                    <SelectValue placeholder={t('requests.selectStaffMember', 'Select staff member')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('common.none', 'None')}</SelectItem>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.fullName} data-testid={`option-staff-${staff.id}`}>
                        {staff.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('roomPrep.adminNotes', 'Admin Notes')}</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('roomPrep.adminNotesPlaceholder', 'Add internal notes...')}
                  data-testid="textarea-admin-notes"
                />
              </div>

              {orderStatus === "rejected" && (
                <div className="space-y-2">
                  <Label>{t('roomPrep.rejectionReason', 'Rejection Reason')}</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('roomPrep.rejectionReasonPlaceholder', 'Explain why the order was rejected...')}
                    data-testid="textarea-rejection-reason"
                  />
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)} data-testid="button-cancel-prep">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmitManage} disabled={updateOrderMutation.isPending} data-testid="button-save-prep">
              {updateOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface RoomUnit {
  id: string;
  name: string | null;
  unitNumber: string;
  unitType: string;
  status: string;
  floor: number | null;
  capacity: number | null;
  propertyId: string;
  pricePerNight: number | null;
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

function RoomStatusPanel() {
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
    <div className="space-y-4" data-testid="room-status-panel">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center" data-testid="count-ready">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{statusCounts.ready}</div>
          <div className="text-xs text-green-600 dark:text-green-400">{t('roomStatus.ready', 'Ready')}</div>
        </div>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center" data-testid="count-occupied">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">{statusCounts.occupied}</div>
          <div className="text-xs text-red-600 dark:text-red-400">{t('roomStatus.occupied', 'Occupied')}</div>
        </div>
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center" data-testid="count-dirty">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{statusCounts.dirty}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">{t('roomStatus.dirty', 'Dirty')}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center" data-testid="count-cleaning">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{statusCounts.cleaning}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">{t('roomStatus.cleaning', 'Cleaning')}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-center" data-testid="count-out-of-order">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{statusCounts.out_of_order}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{t('roomStatus.outOfOrder', 'Out of Order')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {units.map(unit => (
          <Card key={unit.id} className="overflow-visible" data-testid={`room-card-${unit.unitNumber}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-bold text-lg" data-testid={`text-room-number-${unit.unitNumber}`}>
                      {unit.name || unit.unitNumber}
                    </span>
                    {unit.name && (
                      <span className="text-xs text-muted-foreground ml-1.5">({unit.unitNumber})</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{unit.unitType}</span>
                </div>
                <Badge className={ROOM_STATUS_COLORS[unit.status] || ROOM_STATUS_COLORS.available} data-testid={`badge-status-${unit.unitNumber}`}>
                  {unit.status === "out_of_order" ? t('roomStatus.outOfOrder', 'Out of Order') : t(`roomStatus.${unit.status}`, unit.status)}
                </Badge>
              </div>

              {unit.hasActiveBooking && (
                <div className="mb-3">
                  <Badge variant="outline" className="text-xs" data-testid={`badge-booking-${unit.unitNumber}`}>
                    <Activity className="h-3 w-3 mr-1" />
                    {t('roomStatus.activeBooking', 'Active Booking')} ({unit.activeBookingStatus})
                  </Badge>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {unit.status !== "cleaning" && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(unit.id, "cleaning")} data-testid={`btn-cleaning-${unit.unitNumber}`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {t('roomStatus.markCleaning', 'Cleaning')}
                  </Button>
                )}
                {unit.status !== "ready" && (
                  <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleStatusChange(unit.id, "ready")} data-testid={`btn-ready-${unit.unitNumber}`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('roomStatus.markReady', 'Ready')}
                  </Button>
                )}
                {unit.status !== "out_of_order" && (
                  <Button size="sm" variant="outline" className="text-xs h-7 text-gray-600 border-gray-300" onClick={() => handleStatusChange(unit.id, "out_of_order")} data-testid={`btn-oor-${unit.unitNumber}`}>
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

interface StaffDmConversation {
  peerId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

function StaffChatView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const urlStaffId = urlParams.get("staffId");

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(urlStaffId);
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

  const otherStaff = staffUsers?.filter(s => s.id !== currentUser?.id) ?? [];
  const selectedPeer = staffUsers?.find(s => s.id === selectedStaffId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
      <Card className="md:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("staffChat.conversations", "Staff")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {otherStaff.length > 0 ? (
              <div className="divide-y">
                {otherStaff.map((staff) => {
                  const conv = dmConversations?.find(c => c.peerId === staff.id);
                  return (
                    <div
                      key={staff.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${selectedStaffId === staff.id ? "bg-muted" : ""}`}
                      onClick={() => {
                        setSelectedStaffId(staff.id);
                        queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", staff.id] });
                      }}
                      data-testid={`dm-staff-${staff.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {staff.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-sm truncate">{staff.fullName}</span>
                            {conv?.lastMessageAt && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          {conv ? (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t(`staffList.roles.${staff.role}`, { defaultValue: staff.role })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">{t("staffChat.noStaff", "No staff members")}</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              {selectedPeer
                ? selectedPeer.fullName
                : t("staffChat.selectStaff", "Select a staff member to chat")}
            </CardTitle>
            {selectedStaffId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", selectedStaffId] })}
                data-testid="button-refresh-dm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
          {selectedStaffId ? (
            <>
              <ScrollArea className="flex-1 border rounded-md p-3">
                {messagesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-2/3 ml-auto" />
                    <Skeleton className="h-10 w-3/4" />
                  </div>
                ) : dmMessages && dmMessages.length > 0 ? (
                  <div className="space-y-3">
                    {dmMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                        data-testid={`dm-msg-${msg.id}`}
                      >
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          msg.senderId === currentUser?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}>
                          <p className="break-words">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === currentUser?.id ? "opacity-70" : "text-muted-foreground"}`}>
                            {msg.createdAt ? formatTimeAgo(msg.createdAt) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center py-12">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                      <p className="text-sm text-muted-foreground">{t("staffChat.startConversation", "Start a conversation")}</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
              <div className="flex gap-2 flex-shrink-0">
                <Input
                  ref={inputRef}
                  placeholder={t("chat.typeMessage", "Type a message...")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sendMutation.isPending}
                  data-testid="input-staff-chat"
                />
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMutation.isPending}
                  size="icon"
                  data-testid="button-send-staff-chat"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">{t("staffChat.selectStaff", "Select a staff member to chat")}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReceptionDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const searchString = useSearch();

  const { data: receptionNotifications } = useQuery<NotificationItem[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
  });

  useNotificationAlert(receptionNotifications as any, (title, message) => {
    toast({ title, description: message, duration: 6000 });
  });

  // Real-time WebSocket for room prep notifications
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard`);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === "room_prep_new") {
          queryClient.invalidateQueries({ queryKey: ["/api/room-prep-orders/hotel"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          toast({
            title: t("roomPrep.newOrderTitle", "New Preparation Order"),
            description: data.order?.guestName
              ? `${data.order.guestName} — ${t("roomPrep.room", "Room")} ${data.order.roomNumber}`
              : t("roomPrep.newOrderDesc", "A guest submitted a preparation request"),
            duration: 8000,
          });
        }
      } catch {}
    };
    return () => { try { ws.close(); } catch {} };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("payment");
    const bookingId = params.get("bookingId");

    if (paymentResult) {
      if (paymentResult === "success") {
        toast({ title: "Ödəniş uğurla tamamlandı" });
      } else if (paymentResult === "declined") {
        toast({ title: "Ödəniş uğursuz oldu", variant: "destructive" });
      }
      params.delete("payment");
      params.delete("bookingId");
      params.delete("orderId");
      const remaining = params.toString();
      const cleanUrl = window.location.pathname + (remaining ? `?${remaining}` : "");
      window.history.replaceState({}, "", cleanUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    }
  }, []);

  const currentView = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("view") || null;
  }, [searchString]);

  const defaultTab = useMemo(() => {
    const viewToTab: Record<string, string> = {
      requests: "pending",
      messages: "chat",
      "room-prep": "room-prep",
      finance: "finance",
      "arrival-info": "arrival-info",
      "room-status": "room-status",
      "staff-messages": "staff-messages",
    };
    return currentView ? (viewToTab[currentView] || "arrival-info") : "arrival-info";
  }, [currentView]);

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [guestUpgradeOpen, setGuestUpgradeOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("")

  const { data: availableUnits = [], isLoading: unitsLoading } = useQuery<RoomUnit[]>({
    queryKey: ["/api/units/status"],
  });

  const getRoomLabel = (booking: { roomNumber: string; unitId?: string | null }) => {
    if (booking.unitId) {
      const unit = availableUnits.find(u => u.id === booking.unitId);
      if (unit?.name) return `${unit.name} (${unit.unitNumber})`;
    }
    return booking.roomNumber;
  };
  const [guestDetailOpen, setGuestDetailOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  // Convert local Date → YYYY-MM-DD without UTC shift
  const toYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  // Convert YYYY-MM-DD → DD.MM.YYYY for display
  const ymdToDMY = (s: string) => {
    if (!s || s.length !== 10) return s;
    const [y, m, d] = s.split('-');
    return `${d}.${m}.${y}`;
  };
  // Parse DD.MM.YYYY → YYYY-MM-DD; returns null if invalid
  const dmyToYMD = (s: string): string | null => {
    const match = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return null;
    const [, d, m, y] = match.map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime()) || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}`;
  };

  const buildInitialForm = () => {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return {
      fullName: "",
      email: "",
      phoneNumber: "+994501234567",
      roomNumber: "",
      checkInDate: toYMD(today),
      checkInRaw: ymdToDMY(toYMD(today)),
      checkInTime: "14:00",
      checkOutDate: toYMD(tomorrow),
      checkOutRaw: ymdToDMY(toYMD(tomorrow)),
      checkOutTime: "12:00",
      password: "",
      paymentAmount: "",
      paymentStatus: "pending" as "paid" | "pending" | "unpaid",
      paymentMethod: "cash" as "cash" | "card" | "online" | "other",
      bookingNumber: "",
      bookingSource: "" as "" | "booking_com" | "airbnb" | "expedia" | "direct" | "walkin" | "travel_agency" | "other",
      numberOfGuests: "",
      specialNotes: "",
      travelAgencyName: "",
      nightlyRate: "",
      discount: "",
    };
  };
  const [guestForm, setGuestForm] = useState(buildInitialForm);

  const nights = (() => {
    if (!guestForm.checkInDate || !guestForm.checkOutDate) return 1;
    const [cy, cm, cd] = guestForm.checkInDate.split('-').map(Number);
    const [oy, om, od] = guestForm.checkOutDate.split('-').map(Number);
    if (!cy || !cm || !cd || !oy || !om || !od) return 1;
    const ci = new Date(cy, cm - 1, cd);
    const co = new Date(oy, om - 1, od);
    const diff = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();
  const nightlyRateNum = parseFloat(guestForm.nightlyRate) || 0;
  const discountNum = parseFloat(guestForm.discount) || 0;
  const calculatedTotal = Math.max(0, (nights * nightlyRateNum) - discountNum);

  const [phoneError, setPhoneError] = useState("");
  const [selectedChatGuestId, setSelectedChatGuestId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const { data: requests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/all"],
  });

  const { data: staff } = useQuery<User[]>({
    queryKey: ["/api/users/staff"],
  });

  const { data: guests, isLoading: guestsLoading } = useQuery<User[]>({
    queryKey: ["/api/users/guests"],
  });

  interface ChatGuest {
    guestId: string;
    guestName: string;
    roomNumber: string | null;
    roomName: string | null;
    lastMessage: string;
    lastMessageAt: string;
  }

  const { data: chatGuests, isLoading: chatGuestsLoading } = useQuery<ChatGuest[]>({
    queryKey: ["/api/chat/guests"],
    refetchInterval: 10000,
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

  const [precheckDetailBooking, setPrecheckDetailBooking] = useState<Booking | null>(null);
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

  interface CredentialLog {
    id: string;
    guestId: string;
    action: string;
    performedBy: string;
    performedByName: string;
    notes: string | null;
    createdAt: string;
  }

  interface GuestDetails {
    guest: Omit<User, 'password'>;
    credentials: {
      username: string;
      password: string;
    };
    booking: Booking | null;
    serviceRequests: ServiceRequest[];
    credentialLogs: CredentialLog[];
  }

  const { data: guestDetails, isLoading: guestDetailsLoading } = useQuery<GuestDetails>({
    queryKey: [`/api/users/guests/${selectedGuestId}/details`],
    enabled: !!selectedGuestId && guestDetailOpen,
  });

  const createGuestMutation = useMutation({
    mutationFn: async (data: typeof guestForm) => {
      const response = await apiRequest("POST", "/api/staff/create-guest", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('dashboard.reception.guestCreated', 'Guest Created'), description: t('dashboard.reception.guestCreatedDesc', 'Guest account and booking created successfully') });
      setAddGuestOpen(false);
        setGuestForm(buildInitialForm());
      setPhoneError("");
      setSelectedUnitId("");
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        setGuestUpgradeOpen(true);
        return;
      }
      showErrorToast(toast, error);
    },
  });

  const handleAddGuest = () => {
    if (!validatePhone(guestForm.phoneNumber)) {
      setPhoneError(t('validation.phoneFormat', 'Phone must start with + followed by country code and number'));
      return;
    }
    setPhoneError("");
    // Combine date and time for check-in and check-out
    const formData = {
      ...guestForm,
      checkInDate: `${guestForm.checkInDate}T${guestForm.checkInTime}`,
      checkOutDate: `${guestForm.checkOutDate}T${guestForm.checkOutTime}`,
      nightlyRate: guestForm.nightlyRate || "",
      totalPrice: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : "",
      discount: guestForm.discount || "",
    };
    createGuestMutation.mutate(formData);
  };

  const deleteGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const response = await apiRequest("DELETE", `/api/users/guests/${guestId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('dashboard.reception.guestDeleted', 'Guest Deleted'), description: t('dashboard.reception.guestDeletedDesc', 'Guest account has been removed') });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; notes?: string; assignedTo?: string }) => {
      const response = await apiRequest("PATCH", `/api/service-requests/${data.id}`, {
        status: data.status,
        notes: data.notes,
        assignedTo: data.assignedTo,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/all"] });
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setNotes("");
      toast({
        title: t('dashboard.reception.requestUpdated', 'Request updated'),
        description: t('dashboard.reception.requestUpdatedDesc', 'The service request has been updated.'),
      });
    },
  });

  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const arrivalInfoRequests = useMemo(() => {
    return (allBookings || []).filter((b) => b.status === "arrival_info_submitted" || b.status === "precheck_submitted");
  }, [allBookings]);

  const confirmCheckinMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/confirm-checkin`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
      toast({ title: t('dashboard.reception.checkinConfirmed', 'Check-in Confirmed'), description: t('dashboard.reception.checkinConfirmedDesc', 'Guest has been checked in successfully.') });
    },
    onError: (error: Error) => showErrorToast(toast, error),
  });

  const pendingRequests = requests?.filter((r) => r.status === "pending") || [];
  const activeRequests = requests?.filter((r) => ["approved", "in_progress"].includes(r.status)) || [];
  const completedRequests = requests?.filter((r) => ["completed", "cancelled"].includes(r.status)) || [];

  const handleQuickAction = (request: ServiceRequest, status: string) => {
    updateRequestMutation.mutate({ id: request.id, status });
  };

  const handleDetailedAction = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setNotes(request.notes || "");
    setActionDialogOpen(true);
  };

  const handleSubmitAction = () => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        id: selectedRequest.id,
        status: newStatus,
        notes,
      });
    }
  };

  const handleOpenGuestDetail = (guestId: string) => {
    setSelectedGuestId(guestId);
    setGuestDetailOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string) => formatTimeAgo(date);

  const RequestCard = ({ request, showActions = true }: { request: ServiceRequest; showActions?: boolean }) => {
    const Icon = serviceIcons[request.requestType] || HelpCircle;
    
    return (
      <Card className="overflow-visible" data-testid={`request-card-${request.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-md bg-muted shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium capitalize">
                      {request.requestType.replace("_", " ")}
                    </span>
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
                      {formatTime(request.createdAt!)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm">{request.description}</p>
              {request.notes && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                  {t('common.note', 'Note')}: {request.notes}
                </p>
              )}
              {showActions && request.status === "pending" && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction(request, "approved")}
                    disabled={updateRequestMutation.isPending}
                    data-testid={`button-approve-${request.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('common.approve', 'Approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetailedAction(request)}
                    data-testid={`button-manage-${request.id}`}
                  >
                    {t('common.manage', 'Manage')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickAction(request, "cancelled")}
                    disabled={updateRequestMutation.isPending}
                    data-testid={`button-cancel-${request.id}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {showActions && request.status === "approved" && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction(request, "in_progress")}
                    disabled={updateRequestMutation.isPending}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    {t('common.start', 'Start')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetailedAction(request)}
                  >
                    {t('common.manage', 'Manage')}
                  </Button>
                </div>
              )}
              {showActions && request.status === "in_progress" && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction(request, "completed")}
                    disabled={updateRequestMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('common.complete', 'Complete')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetailedAction(request)}
                  >
                    {t('common.manage', 'Manage')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (requestsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 hidden sm:block">
          <h2 className="text-xl sm:text-2xl font-bold truncate">{t('dashboard.reception.title')}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">{t('dashboard.reception.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={addGuestOpen} onOpenChange={setAddGuestOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-guest" size="sm" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                <span className="hidden xs:inline">{t('dashboard.reception.addGuest')}</span>
                <span className="xs:hidden">{t('common.add', 'Add')}</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('dashboard.reception.addGuest')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.reception.createGuest')}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  data-testid="input-guest-name"
                  placeholder={t('placeholders.guestName', 'John Smith')}
                  value={guestForm.fullName}
                  onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email', 'Email')} ({t('auth.username', 'Username')})</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-guest-email"
                  placeholder={t('placeholders.guestEmail', 'guest@example.com')}
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('dashboard.reception.phoneNumber')}</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  data-testid="input-guest-phone"
                  placeholder={t('placeholders.phoneNumber', '+1234567890')}
                  value={guestForm.phoneNumber}
                  onChange={(e) => {
                    setGuestForm({ ...guestForm, phoneNumber: e.target.value });
                    if (phoneError) setPhoneError("");
                  }}
                  className={phoneError ? "border-destructive" : ""}
                />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">{t('dashboard.reception.roomNumber')}</Label>
                  {!unitsLoading && availableUnits.length === 0 ? (
                    <Input
                      id="roomNumber"
                      data-testid="input-guest-room"
                      placeholder={t('placeholders.roomNumber', '101')}
                      value={guestForm.roomNumber}
                      onChange={(e) => setGuestForm({ ...guestForm, roomNumber: e.target.value })}
                    />
                  ) : (
                    <Select
                      value={selectedUnitId}
                      disabled={unitsLoading}
                      onValueChange={(val) => {
                        const unit = availableUnits.find(u => u.id === val);
                        setSelectedUnitId(val);
                        if (unit) {
                          const autoRate = unit.pricePerNight ? (unit.pricePerNight / 100).toFixed(2) : "";
                          setGuestForm(f => ({ ...f, roomNumber: unit.unitNumber, nightlyRate: autoRate }));
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-guest-room">
                        <SelectValue placeholder={unitsLoading ? t('common.loading', 'Loading...') : t('placeholders.selectRoom', 'Select room...')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name ? `${unit.name} (${unit.unitNumber})` : unit.unitNumber}
                            {unit.pricePerNight ? ` — ${(unit.pricePerNight / 100).toFixed(0)} ${t('common.perNight', '/night')}` : ""}
                            {unit.hasActiveBooking ? ` · ${t('common.occupied', 'Occupied')}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingNumber">{t('dashboard.reception.bookingNumber', 'Booking Number')}</Label>
                  <Input
                    id="bookingNumber"
                    data-testid="input-booking-number"
                    placeholder={t('placeholders.bookingNumber', 'RES-123456')}
                    value={guestForm.bookingNumber}
                    onChange={(e) => setGuestForm({ ...guestForm, bookingNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bookingSource">{t('dashboard.reception.bookingSource', 'Booking Source')}</Label>
                  <Select
                    value={guestForm.bookingSource}
                    onValueChange={(value) => setGuestForm({ ...guestForm, bookingSource: value as typeof guestForm.bookingSource })}
                  >
                    <SelectTrigger data-testid="select-booking-source">
                      <SelectValue placeholder={t('common.selectOption', 'Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking_com">{t('bookingSource.bookingCom', 'Booking.com')}</SelectItem>
                      <SelectItem value="airbnb">{t('bookingSource.airbnb', 'Airbnb')}</SelectItem>
                      <SelectItem value="expedia">{t('bookingSource.expedia', 'Expedia')}</SelectItem>
                      <SelectItem value="direct">{t('bookingSource.direct', 'Direct Booking')}</SelectItem>
                      <SelectItem value="walkin">{t('bookingSource.walkin', 'Walk-in')}</SelectItem>
                      <SelectItem value="travel_agency">{t('bookingSource.travelAgency', 'Travel Agency')}</SelectItem>
                      <SelectItem value="other">{t('services.other', 'Other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {guestForm.bookingSource === "travel_agency" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="travelAgencyName">{t('dashboard.reception.travelAgencyName', 'Agency Name')}</Label>
                    <Input
                      id="travelAgencyName"
                      data-testid="input-travel-agency-name"
                      placeholder={t('placeholders.travelAgencyName', 'Enter travel agency name')}
                      value={guestForm.travelAgencyName}
                      onChange={(e) => setGuestForm({ ...guestForm, travelAgencyName: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="numberOfGuests">{t('dashboard.reception.numberOfGuests', 'Number of Guests')}</Label>
                  <Input
                    id="numberOfGuests"
                    type="number"
                    min="1"
                    data-testid="input-number-of-guests"
                    placeholder="2"
                    value={guestForm.numberOfGuests}
                    onChange={(e) => setGuestForm({ ...guestForm, numberOfGuests: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('dashboard.reception.checkInDate')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="checkInDate"
                    type="text"
                    data-testid="input-guest-checkin-date"
                    value={guestForm.checkInRaw}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setGuestForm(prev => {
                        const ymd = dmyToYMD(raw);
                        if (!ymd) return { ...prev, checkInRaw: raw };
                        const [y, m, d] = ymd.split('-').map(Number);
                        const nextDay = new Date(y, m - 1, d + 1);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const autoYMD = `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`;
                        const autoRaw = ymdToDMY(autoYMD);
                        const needAutoOut = !prev.checkOutDate || prev.checkOutDate <= ymd;
                        return {
                          ...prev,
                          checkInRaw: raw,
                          checkInDate: ymd,
                          checkOutDate: needAutoOut ? autoYMD : prev.checkOutDate,
                          checkOutRaw: needAutoOut ? autoRaw : prev.checkOutRaw,
                        };
                      });
                    }}
                    placeholder="DD.MM.YYYY"
                    maxLength={10}
                  />
                  <Input
                    id="checkInTime"
                    type="time"
                    data-testid="input-guest-checkin-time"
                    value={guestForm.checkInTime}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('dashboard.reception.checkOutDate')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="checkOutDate"
                    type="text"
                    data-testid="input-guest-checkout-date"
                    value={guestForm.checkOutRaw}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setGuestForm(prev => {
                        const ymd = dmyToYMD(raw);
                        if (!ymd) return { ...prev, checkOutRaw: raw };
                        return { ...prev, checkOutRaw: raw, checkOutDate: ymd };
                      });
                    }}
                    placeholder="DD.MM.YYYY"
                    maxLength={10}
                  />
                  <Input
                    id="checkOutTime"
                    type="time"
                    data-testid="input-guest-checkout-time"
                    value={guestForm.checkOutTime}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  />
                </div>
                <p className="text-xs font-medium text-primary" data-testid="text-nights-count">
                  {nights} {t('dashboard.reception.nights', 'night(s)')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialNotes">{t('dashboard.reception.specialNotes', 'Special Notes / Requests')}</Label>
                <Textarea
                  id="specialNotes"
                  data-testid="input-special-notes"
                  placeholder={t('placeholders.specialNotes', 'Any special requests or notes about this guest...')}
                  value={guestForm.specialNotes}
                  onChange={(e) => setGuestForm({ ...guestForm, specialNotes: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-guest-password"
                  placeholder={t('placeholders.guestPassword', 'Guest login password')}
                  value={guestForm.password}
                  onChange={(e) => setGuestForm({ ...guestForm, password: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              
              {calculatedTotal > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3" data-testid="text-booking-summary">
                    <div className="text-sm text-muted-foreground">
                      {nights} {t('dashboard.reception.nights', 'night(s)')} × {nightlyRateNum.toFixed(2)}
                    </div>
                    <div className="text-lg font-bold text-primary" data-testid="text-total-price">
                      = {calculatedTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">{t('dashboard.reception.roomPayment')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">{t('finance.amount')}</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      data-testid="input-payment-amount"
                      placeholder={t('placeholders.amount', '0.00')}
                      value={guestForm.paymentAmount}
                      onChange={(e) => setGuestForm({ ...guestForm, paymentAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">{t('common.status')}</Label>
                    <Select
                      value={guestForm.paymentStatus}
                      onValueChange={(value: "paid" | "pending" | "unpaid") => setGuestForm({ ...guestForm, paymentStatus: value })}
                    >
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue placeholder={t('common.status', 'Status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">{t('finance.paid', 'Paid')}</SelectItem>
                        <SelectItem value="pending">{t('finance.pending', 'Pending')}</SelectItem>
                        <SelectItem value="unpaid">{t('finance.unpaid', 'Unpaid')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('finance.paymentMethod')}</Label>
                    <Select
                      value={guestForm.paymentMethod}
                      onValueChange={(value: "cash" | "card" | "online" | "other") => setGuestForm({ ...guestForm, paymentMethod: value })}
                    >
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder={t('finance.method', 'Method')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t('finance.cash', 'Cash')}</SelectItem>
                        <SelectItem value="card">{t('finance.card', 'Card')}</SelectItem>
                        <SelectItem value="online">{t('finance.online', 'Online')}</SelectItem>
                        <SelectItem value="other">{t('services.other', 'Other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddGuestOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                data-testid="button-submit-guest"
                onClick={handleAddGuest}
                disabled={createGuestMutation.isPending}
              >
                {createGuestMutation.isPending ? t('dashboard.reception.creating') : t('dashboard.reception.createGuest')}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-md bg-orange-500/10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('common.pending', 'Pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-md bg-blue-500/10">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{activeRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('common.inProgress', 'In Progress')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-md bg-green-500/10">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{completedRequests.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('common.completed', 'Completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-md bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{guests?.length || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.reception.guests', 'Guests')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {arrivalInfoRequests.length > 0 && !currentView && (
        <Card className="border-green-500/40 bg-green-500/5 cursor-pointer" onClick={() => {}} data-testid="banner-precheck">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10 shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {arrivalInfoRequests.filter(b => b.status === "precheck_submitted").length > 0
                  ? `${arrivalInfoRequests.filter(b => b.status === "precheck_submitted").length} ${t('dashboard.reception.precheckPending', 'guest(s) submitted Online Check-in — review in Arrival Info tab')}`
                  : `${arrivalInfoRequests.length} ${t('dashboard.reception.arrivalInfoPending', 'guest(s) sent arrival info — see Arrival Info tab')}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentView === "tasks" ? (
        <ReceptionTasksView />
      ) : currentView === "calendar" ? (
        <ReceptionCalendarView />
      ) : currentView === "my-performance" ? (
        <StaffMyPerformance />
      ) : currentView === "housekeeping" ? (
        <HousekeepingView />
      ) : currentView === "staff-chat" ? (
        <StaffChatView />
      ) : (
      <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full min-w-0">
          <TabsList className="flex gap-1 h-auto flex-wrap justify-start p-1">
            <TabsTrigger value="arrival-info" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-arrival-info">
              <ClipboardList className="h-3.5 w-3.5" />
              {t('dashboard.reception.arrivalInfo', 'Arrival Info')} ({arrivalInfoRequests.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-pending">
              <Bell className="h-3.5 w-3.5" />
              {t('common.pending')} ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-active">
              <UserCheck className="h-3.5 w-3.5" />
              {t('common.active')} ({activeRequests.length})
            </TabsTrigger>
            <TabsTrigger value="guests" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-guests">
              <Users className="h-3.5 w-3.5" />
              {t('dashboard.reception.guests')} ({guests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-chat">
              <MessageSquare className="h-3.5 w-3.5" />
              {t('chat.title')} ({chatGuests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-archive">
              <Archive className="h-3.5 w-3.5" />
              {t('dashboard.reception.archive')}
            </TabsTrigger>
            <TabsTrigger value="finance" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-finance">
              <CreditCard className="h-3.5 w-3.5" />
              {t('finance.title')}
            </TabsTrigger>
            <TabsTrigger value="room-prep" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-room-prep">
              <PartyPopper className="h-3.5 w-3.5" />
              {t('roomPrep.tabLabel', 'Room Prep')}
            </TabsTrigger>
            <TabsTrigger value="room-status" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-room-status">
              <BedDouble className="h-3.5 w-3.5" />
              {t('roomStatus.title', 'Room Status')}
            </TabsTrigger>
            <TabsTrigger value="staff-messages" className="gap-1.5 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm" data-testid="tab-staff-messages">
              <Users2 className="h-3.5 w-3.5" />
              {t('staffMessages.tab', 'Staff Messages')}
            </TabsTrigger>
          </TabsList>

        <TabsContent value="arrival-info" className="mt-4">
          {arrivalInfoRequests.length > 0 ? (
            <div className="space-y-3">
              {arrivalInfoRequests.map((booking) => {
                const guest = guests?.find((g) => g.id === booking.guestId);
                const isPrecheck = booking.status === "precheck_submitted";
                return (
                  <Card key={booking.id} className={`overflow-visible ${isPrecheck ? 'border-green-500/30' : ''}`} data-testid={`arrival-card-${booking.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold truncate">{guest?.fullName || t('common.guest', 'Guest')}</h4>
                            {isPrecheck ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Online Check-in
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                {t('dashboard.reception.arrivalInfoReceived', 'Arrival Info Received')}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <DoorOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">{t('common.room', 'Room')}:</span>
                              <span className="font-medium">{getRoomLabel(booking)}</span>
                            </div>
                            {booking.arrivalTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{t('dashboard.guest.arrivalTime', 'Expected Arrival')}:</span>
                                <span className="font-medium">{booking.arrivalTime}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">{t('common.dates', 'Dates')}:</span>
                              <span className="font-medium">{booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : ''} - {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : ''}</span>
                            </div>
                            {isPrecheck && booking.passportNumber && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">Pasport:</span>
                                <span className="font-medium">{booking.passportNumber}</span>
                              </div>
                            )}
                            {isPrecheck && booking.nationality && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Vətəndaşlıq:</span>
                                <span className="font-medium">{booking.nationality}</span>
                              </div>
                            )}
                          </div>
                          {booking.preCheckNotes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">{t('dashboard.guest.notesRequests', 'Notes / Requests')}:</span> {booking.preCheckNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {isPrecheck && (
                            <Button
                              variant="outline"
                              onClick={() => setPrecheckDetailBooking(booking)}
                              data-testid={`button-view-precheck-${booking.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ətraflı
                            </Button>
                          )}
                          <Button
                            variant="default"
                            onClick={() => confirmCheckinMutation.mutate(booking.id)}
                            disabled={confirmCheckinMutation.isPending}
                            data-testid={`button-confirm-checkin-${booking.id}`}
                          >
                            {confirmCheckinMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            {t('dashboard.reception.confirmCheckin', 'Confirm Check-in')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.reception.noArrivalRequests', 'No pending arrival information')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.reception.noPendingRequests', 'No pending requests')}</p>
                <p className="text-sm">{t('dashboard.reception.allCaughtUp', 'All caught up!')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {activeRequests.length > 0 ? (
            <div className="space-y-3">
              {activeRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.reception.noActiveRequests', 'No active requests')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('dashboard.reception.guestList')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.reception.allRegisteredGuests', 'All registered hotel guests')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {guestsLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : guests && guests.length > 0 ? (
                    guests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover-elevate"
                        data-testid={`guest-row-${guest.id}`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 rounded-md bg-primary/10 shrink-0">
                            <UserCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium break-words">{guest.fullName}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {t('common.guest', 'Guest')}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1 min-w-0">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="break-all">{guest.username}</span>
                              </span>
                              {guest.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  {guest.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:shrink-0 ml-10 sm:ml-0">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-view-guest-${guest.id}`}
                            onClick={() => handleOpenGuestDetail(guest.id)}
                          >
                            {t('dashboard.reception.viewDetails')}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-guest-${guest.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('dashboard.reception.deleteGuest', 'Delete Guest')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('dashboard.reception.deleteGuestConfirm', 'Are you sure you want to delete {{name}}? This will remove all their bookings, service requests, and account data. This action cannot be undone.', { name: guest.fullName })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGuestMutation.mutate(guest.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('common.delete', 'Delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t('dashboard.reception.noGuests', 'No guests registered')}</p>
                      <p className="text-sm">{t('dashboard.reception.addGuestHint', 'Add a guest using the button above')}</p>
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
                  <CardTitle className="text-base">{t('chat.conversations', 'Conversations')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/guests"] })}
                    data-testid="button-refresh-chat-list"
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
                          data-testid={`chat-guest-${chat.guestId}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{chat.guestName}</span>
                                {(chat.roomName || chat.roomNumber) && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {chat.roomName || `${t('common.room')} ${chat.roomNumber}`}
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
                      <p className="text-sm">{t('chat.guestsWillAppear', 'Guests will appear here when they message')}</p>
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
                      ? chatGuests?.find(g => g.guestId === selectedChatGuestId)?.guestName || t('dashboard.reception.chat')
                      : t('chat.selectConversation', 'Select a conversation')}
                  </CardTitle>
                  {selectedChatGuestId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedChatGuestId] })}
                      data-testid="button-refresh-messages"
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
                              data-testid={`chat-msg-${msg.id}`}
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
                        data-testid="input-reception-chat"
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        disabled={!chatMessage.trim() || sendChatMutation.isPending}
                        data-testid="button-send-reception-chat"
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
                              data-testid="button-escalate-chat"
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
                                data-testid="input-escalation-note"
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
                                data-testid="button-confirm-escalate"
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
                      <p>{t('chat.selectConversation', 'Select a conversation to view messages')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <ScrollArea className="h-[500px]">
            {completedRequests.length > 0 ? (
              <div className="space-y-3 pr-4">
                {completedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} showActions={false} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Archive className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t('dashboard.reception.noRequests', 'No archived requests')}</p>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <FinancePanel isReadOnly={false} />
        </TabsContent>

        <TabsContent value="room-prep" className="mt-4">
          <ReceptionRoomPrepPanel />
        </TabsContent>

        <TabsContent value="room-status" className="mt-4">
          <RoomStatusPanel />
        </TabsContent>

        <TabsContent value="staff-messages" className="mt-4">
          <StaffChatView />
        </TabsContent>
      </Tabs>
      )}

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('requests.manageRequest', 'Manage Request')}</DialogTitle>
            <DialogDescription>
              {t('requests.manageRequestDesc', 'Update the status and add notes for this request.')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="font-medium capitalize">
                  {selectedRequest.requestType.replace("_", " ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('common.room')} {selectedRequest.roomNumber}
                </p>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.status')}</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('common.pending', 'Pending')}</SelectItem>
                    <SelectItem value="approved">{t('common.approve', 'Approved')}</SelectItem>
                    <SelectItem value="in_progress">{t('common.inProgress', 'In Progress')}</SelectItem>
                    <SelectItem value="completed">{t('common.completed', 'Completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('common.cancelled', 'Cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('requests.notes')}</label>
                <Textarea
                  placeholder={t('requests.addNotes', 'Add notes for the team...')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={updateRequestMutation.isPending}
              data-testid="button-save-changes"
            >
              {updateRequestMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {t('common.save', 'Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={guestDetailOpen} onOpenChange={setGuestDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {t('dashboard.reception.guestDetails')}
            </DialogTitle>
            <DialogDescription className="break-words">
              {t('dashboard.reception.guestDetailsDesc', 'Complete guest information and activity history')}
            </DialogDescription>
          </DialogHeader>
          
          <DialogBody>
          {guestDetailsLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : guestDetails ? (
            <div className="space-y-4 sm:space-y-6 min-w-0">
              <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{t('dashboard.reception.guestCredentials', 'Guest Login Credentials')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 min-w-0">
                      <span className="text-xs text-muted-foreground">{t('auth.username', 'Username')}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="font-mono text-xs sm:text-sm px-2 sm:px-3 py-1 break-all whitespace-normal max-w-full">
                          {guestDetails.credentials.username}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-xs text-muted-foreground">{t('auth.password', 'Password')}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="font-mono text-xs sm:text-sm px-2 sm:px-3 py-1 break-all whitespace-normal max-w-full text-muted-foreground">
                          ••••••••
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground break-words">
                    {t('dashboard.reception.shareCredentials', 'Share these credentials with the guest via SMS, email, or printed receipt at check-in.')}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t('dashboard.reception.personalInfo', 'Personal Information')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{t('auth.fullName', 'Name')}</span>
                      <span className="font-medium truncate text-right">{guestDetails.guest.fullName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{t('auth.email', 'Email')}</span>
                      <span className="font-medium truncate text-right">{guestDetails.guest.email || t('common.na', 'N/A')}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{t('dashboard.reception.phone', 'Phone')}</span>
                      <span className="font-medium truncate text-right">{guestDetails.guest.phone || t('common.na', 'N/A')}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{t('common.registered', 'Registered')}</span>
                      <span className="font-medium truncate text-right">
                        {guestDetails.guest.createdAt ? formatDate(guestDetails.guest.createdAt) : t('common.na', 'N/A')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t('dashboard.reception.bookingDetails', 'Booking Details')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm p-3 pt-0 sm:p-6 sm:pt-0">
                    {guestDetails.booking ? (
                      <>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground shrink-0">{t('dashboard.reception.room', 'Room')}</span>
                          <Badge variant="outline" className="truncate">{guestDetails.booking.roomNumber}</Badge>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground shrink-0">{t('dashboard.guest.checkIn', 'Check-in')}</span>
                          <span className="font-medium truncate text-right">{formatDate(guestDetails.booking.checkInDate)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground shrink-0">{t('dashboard.guest.checkOut', 'Check-out')}</span>
                          <span className="font-medium truncate text-right">{formatDate(guestDetails.booking.checkOutDate)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground shrink-0">{t('common.status', 'Status')}</span>
                          {guestDetails.booking.status === "checked_in" && (
                            <Badge variant="default">{t('dashboard.guest.checkedIn', 'Checked in')}</Badge>
                          )}
                          {(guestDetails.booking.status === "arrival_info_submitted" || guestDetails.booking.status === "precheck_submitted") && (
                            <Badge variant="secondary">{t('dashboard.guest.arrivalInfoSent', 'Arrival info sent')}</Badge>
                          )}
                          {guestDetails.booking.status === "checked_out" && (
                            <Badge variant="outline">{t('dashboard.guest.checkedOut', 'Checked out')}</Badge>
                          )}
                          {(guestDetails.booking.status === "booked" || guestDetails.booking.status === "pending" || guestDetails.booking.status === "confirmed") && (
                            <Badge variant="secondary">{t('dashboard.guest.notCheckedIn', 'Not checked in')}</Badge>
                          )}
                        </div>
                        {guestDetails.booking.bookingNumber && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">{t('dashboard.reception.bookingNumber', 'Booking #')}</span>
                            <span className="font-medium truncate text-right">{guestDetails.booking.bookingNumber}</span>
                          </div>
                        )}
                        {guestDetails.booking.bookingSource && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">{t('dashboard.reception.bookingSource', 'Source')}</span>
                            <span className="font-medium truncate text-right">{t(`bookingSource.${guestDetails.booking.bookingSource}`, guestDetails.booking.bookingSource)}</span>
                          </div>
                        )}
                        {guestDetails.booking.numberOfGuests && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">{t('dashboard.reception.numberOfGuests', 'Guests')}</span>
                            <span className="font-medium truncate text-right">{guestDetails.booking.numberOfGuests}</span>
                          </div>
                        )}
                        {guestDetails.booking.arrivalTime && (
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">{t('dashboard.guest.arrivalTime', 'Expected Arrival')}</span>
                            <span className="font-medium truncate text-right">{guestDetails.booking.arrivalTime}</span>
                          </div>
                        )}
                        {guestDetails.booking.specialNotes && (
                          <div className="flex flex-col gap-1 pt-2 border-t mt-2">
                            <span className="text-muted-foreground text-xs">{t('dashboard.reception.specialNotes', 'Notes')}</span>
                            <span className="text-sm">{guestDetails.booking.specialNotes}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t('dashboard.guest.noActiveBooking', 'No active booking')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-hidden">
                <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t('dashboard.reception.serviceRequests')} ({guestDetails.serviceRequests.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px]">
                    <div className="divide-y">
                      {guestDetails.serviceRequests.length > 0 ? (
                        guestDetails.serviceRequests.map((request) => {
                          const Icon = serviceIcons[request.requestType] || HelpCircle;
                          return (
                            <div key={request.id} className="flex items-center gap-3 p-3">
                              <div className="p-1.5 rounded-md bg-muted">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm capitalize">
                                    {request.requestType.replace("_", " ")}
                                  </span>
                                  <RequestStatusBadge status={request.status} showIcon />
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {request.description}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTime(request.createdAt!)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-muted-foreground">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{t('dashboard.reception.noRequests', 'No service requests')}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {t('dashboard.reception.credentialHistory', 'Credential History')} ({guestDetails.credentialLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[120px]">
                    <div className="divide-y">
                      {guestDetails.credentialLogs.length > 0 ? (
                        guestDetails.credentialLogs.map((log) => (
                          <div key={log.id} className="p-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge 
                                variant={log.action === "created" ? "default" : "secondary"}
                                className="text-xs shrink-0"
                              >
                                {log.action}
                              </Badge>
                              <span className="text-sm truncate">{log.notes || t('dashboard.reception.credentialsUpdated', 'Credentials updated')}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">{log.performedByName}</p>
                              <p className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          {t('dashboard.reception.noCredentialHistory', 'No credential history')}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-green-500/10">
                        <CreditCard className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.reception.paymentStatus', 'Payment Status')}</p>
                        <Badge variant="default" className="text-xs">{t('common.confirmed', 'Confirmed')}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.reception.lastActivity', 'Last Activity')}</p>
                        <p className="font-medium text-sm">
                          {guestDetails.serviceRequests.length > 0 
                            ? formatTime([...guestDetails.serviceRequests].sort((a, b) => 
                                new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
                              )[0].createdAt!)
                            : t('dashboard.reception.noActivity', 'No activity')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{t('dashboard.reception.guestNotFound', 'Guest details not found')}</p>
            </div>
          )}
          </DialogBody>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuestDetailOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!precheckDetailBooking} onOpenChange={(open) => { if (!open) setPrecheckDetailBooking(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Online Check-in Məlumatları</DialogTitle>
            <DialogDescription>
              Qonağın göndərdiyi check-in məlumatları
            </DialogDescription>
          </DialogHeader>
          {precheckDetailBooking && (
            <DialogBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Otaq</p>
                    <p className="font-medium">{getRoomLabel(precheckDetailBooking)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pasport nömrəsi</p>
                    <p className="font-medium" data-testid="text-precheck-passport">{precheckDetailBooking.passportNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vətəndaşlıq</p>
                    <p className="font-medium" data-testid="text-precheck-nationality">{precheckDetailBooking.nationality || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Doğum tarixi</p>
                    <p className="font-medium" data-testid="text-precheck-dob">{precheckDetailBooking.dateOfBirth || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ünvan</p>
                    <p className="font-medium">{precheckDetailBooking.guestAddress || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Qonaq sayı</p>
                    <p className="font-medium">{precheckDetailBooking.numberOfGuests || '—'}</p>
                  </div>
                </div>
                {precheckDetailBooking.specialRequests && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Xüsusi istəklər</p>
                    <p className="text-sm bg-muted p-2 rounded">{precheckDetailBooking.specialRequests}</p>
                  </div>
                )}
                {precheckDetailBooking.guestSignatureBase64 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">İmza</p>
                    <div className="border rounded p-2 bg-white">
                      <img
                        src={precheckDetailBooking.guestSignatureBase64}
                        alt="Guest Signature"
                        className="max-h-24 mx-auto"
                        data-testid="img-precheck-signature"
                      />
                    </div>
                  </div>
                )}
                {precheckDetailBooking.idDocumentBase64 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Şəxsiyyət vəsiqəsi</p>
                    <div className="border rounded p-2">
                      <img
                        src={precheckDetailBooking.idDocumentBase64}
                        alt="ID Document"
                        className="max-h-48 mx-auto rounded"
                        data-testid="img-precheck-id"
                      />
                    </div>
                  </div>
                )}
              </div>
            </DialogBody>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrecheckDetailBooking(null)}>
              {t('common.close', 'Close')}
            </Button>
            <Button
              onClick={() => {
                if (precheckDetailBooking) {
                  confirmCheckinMutation.mutate(precheckDetailBooking.id);
                  setPrecheckDetailBooking(null);
                }
              }}
              disabled={confirmCheckinMutation.isPending}
              data-testid="button-confirm-from-detail"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('dashboard.reception.confirmCheckin', 'Confirm Check-in')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={guestUpgradeOpen}
        onClose={() => setGuestUpgradeOpen(false)}
        featureName="Guest Management"
      />
    </div>
  );
}
