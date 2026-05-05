import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTimeAgo } from "@/lib/formatters";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { navigate } from "wouter/use-browser-location";
import {
  Bell,
  BellOff,
  CheckCircle,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  Trash2,
  Calendar,
  Wrench,
  DoorOpen,
  CreditCard,
  Zap,
  ExternalLink,
  Check,
  X,
  UserPlus,
  BellRing,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Notification } from "@shared/schema";

const notificationTypeIcons: Record<string, React.ElementType> = {
  booking: Calendar,
  service_request: Wrench,
  escalation: AlertTriangle,
  room_prep: DoorOpen,
  payment: CreditCard,
  device_alert: Zap,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const notificationTypeColors: Record<string, string> = {
  booking: "text-blue-500",
  service_request: "text-orange-500",
  escalation: "text-red-500",
  room_prep: "text-green-500",
  payment: "text-purple-500",
  device_alert: "text-yellow-500",
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-orange-500",
  error: "text-red-500",
};

const navigationTargets: Record<string, { label: string; path: string }> = {
  service_request: { label: "viewRequest", path: "/dashboard?view=requests" },
  booking: { label: "viewBooking", path: "/dashboard" },
  device_alert: { label: "viewDevices", path: "/dashboard?view=properties" },
  escalation: { label: "viewEscalation", path: "/dashboard?view=escalations" },
  room_prep: { label: "viewOrder", path: "/dashboard?view=room-prep" },
};

const navigationLabels: Record<string, string> = {
  viewRequest: "View Request",
  viewBooking: "View Booking",
  viewDevices: "View Devices",
  viewEscalation: "View Escalation",
  viewOrder: "View Order",
};

function groupNotificationsByDate(notifications: Notification[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; key: string; notifications: Notification[] }[] = [
    { label: "today", key: "today", notifications: [] },
    { label: "yesterday", key: "yesterday", notifications: [] },
    { label: "earlier", key: "earlier", notifications: [] },
  ];

  for (const n of notifications) {
    const created = new Date(n.createdAt!);
    created.setHours(0, 0, 0, 0);
    if (created.getTime() >= today.getTime()) {
      groups[0].notifications.push(n);
    } else if (created.getTime() >= yesterday.getTime()) {
      groups[1].notifications.push(n);
    } else {
      groups[2].notifications.push(n);
    }
  }

  return groups.filter((g) => g.notifications.length > 0);
}

function extractRequestId(notification: Notification): string | null {
  if (notification.actionUrl) {
    const match = notification.actionUrl.match(/service-requests\/([^/?]+)/);
    if (match) return match[1];
  }
  return null;
}

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast({ title: t("notifications.enabled", "Browser notifications enabled!") });
    }
  };

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notifications/mark-all-read", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t('notifications.allMarkedRead', 'All notifications marked as read'),
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t('notifications.deleted', 'Notification deleted'),
      });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("PATCH", `/api/service-requests/${requestId}`, { status: "in_progress" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: t('notifications.requestAccepted', 'Request accepted') });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("PATCH", `/api/service-requests/${requestId}`, { status: "rejected" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: t('notifications.requestRejected', 'Request rejected') });
    },
  });

  const formatTime = (date: Date | string) => formatTimeAgo(date);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin" || user?.role === "reception" || user?.role === "oss_super_admin";
  const isOwner = user?.role === "owner_admin";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  const groups = groupNotificationsByDate(notifications || []);

  const dateGroupLabels: Record<string, string> = {
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier",
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="relative p-3 rounded-full bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs px-1"
                    data-testid="badge-notification-count"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t('notifications.title', 'Notifications')}</h2>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? t('notifications.unreadCount', '{{count}} unread', { count: unreadCount }) : t('notifications.allCaughtUp', 'All caught up!')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {notifPermission !== null && notifPermission !== "granted" && (
                <Button
                  variant={notifPermission === "denied" ? "ghost" : "outline"}
                  size="sm"
                  onClick={requestNotificationPermission}
                  disabled={notifPermission === "denied"}
                  data-testid="button-enable-notifications"
                  className={notifPermission === "denied" ? "text-muted-foreground" : "border-primary/40 text-primary hover:bg-primary/10"}
                >
                  {notifPermission === "denied" ? (
                    <><BellOff className="mr-2 h-4 w-4" />{t("notifications.blocked", "Notifications blocked")}</>
                  ) : (
                    <><BellRing className="mr-2 h-4 w-4" />{t("notifications.enablePush", "Enable Notifications")}</>
                  )}
                </Button>
              )}
              {notifPermission === "granted" && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t("notifications.active", "Notifications active")}
                </span>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  {t('notifications.markAllRead', 'Mark all as read')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-300px)]">
        {groups.length > 0 ? (
          <div className="space-y-6 pr-4">
            {groups.map((group) => (
              <div key={group.key} className="space-y-3">
                <h3
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1"
                  data-testid={`date-group-${group.key}`}
                >
                  {t(`notifications.${group.label}`, dateGroupLabels[group.label] || group.label)}
                </h3>
                {group.notifications.map((notification) => {
                  const Icon = notificationTypeIcons[notification.type] || Info;
                  const colorClass = notificationTypeColors[notification.type] || "text-blue-500";
                  const navTarget = navigationTargets[notification.type];
                  const requestId = notification.type === "service_request" ? extractRequestId(notification) : null;

                  return (
                    <Card
                      key={notification.id}
                      className={`overflow-visible transition-colors ${!notification.read ? "bg-muted/30 border-primary/20" : ""}`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-md bg-muted shrink-0 ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{notification.title}</span>
                                  {!notification.read && (
                                    <Badge variant="default" className="text-xs">{t('notifications.new', 'New')}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTime(notification.createdAt!)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                              {navTarget && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(navTarget.path)}
                                  data-testid={`button-navigate-${notification.type}-${notification.id}`}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {t(`notifications.${navTarget.label}`, navigationLabels[navTarget.label])}
                                </Button>
                              )}
                              {notification.type === "service_request" && isStaffOrAdmin && requestId && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => acceptRequestMutation.mutate(requestId)}
                                    disabled={acceptRequestMutation.isPending}
                                    data-testid={`button-accept-request-${notification.id}`}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    {t('notifications.accept', 'Accept')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectRequestMutation.mutate(requestId)}
                                    disabled={rejectRequestMutation.isPending}
                                    data-testid={`button-reject-request-${notification.id}`}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    {t('notifications.reject', 'Reject')}
                                  </Button>
                                </>
                              )}
                              {notification.type === "escalation" && isOwner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate("/dashboard?view=escalations")}
                                  data-testid={`button-assign-escalation-${notification.id}`}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  {t('notifications.assign', 'Assign')}
                                </Button>
                              )}
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markReadMutation.mutate(notification.id)}
                                  disabled={markReadMutation.isPending}
                                  data-testid={`button-mark-read-${notification.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {t('notifications.markAsRead', 'Mark as read')}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                disabled={deleteNotificationMutation.isPending}
                                data-testid={`button-delete-${notification.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium text-lg mb-1">{t('notifications.noNotifications', 'No notifications')}</h3>
              <p className="text-sm">{t('notifications.checkBackLater', "You're all caught up! Check back later for updates.")}</p>
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}
