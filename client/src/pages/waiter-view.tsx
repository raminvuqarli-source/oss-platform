import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getDemoToken } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { Bell, Package, CheckCircle2, Clock, Utensils, MessageSquare, LayoutGrid, Users, ClipboardCheck, Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { initOneSignal, requestNotificationPermission } from "@/lib/onesignal";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { az as azLocale, tr as trLocale, ru as ruLocale, ar as arLocale, fr as frLocale, de as deLocale, es as esLocale, nl as nlLocale } from "date-fns/locale";
import { faIR } from "date-fns/locale/fa-IR";

const dateFnsLocaleMap: Record<string, Locale> = {
  az: azLocale, tr: trLocale, ru: ruLocale, ar: arLocale,
  fr: frLocale, de: deLocale, es: esLocale, nl: nlLocale, fa: faIR,
};
import { useTranslation } from "react-i18next";
import { StaffDmChat } from "@/components/staff-dm-chat";

type PosOrder = {
  id: string;
  tableNumber: string | null;
  guestName: string | null;
  notes: string | null;
  totalCents: number;
  kitchenStatus: string;
  settlementStatus: string;
  createdAt: string;
  readyAt: string | null;
};

type WaiterCall = {
  id: string;
  tableNumber: string | null;
  roomNumber: string | null;
  status: string;
  calledAt: string;
};

type MyProfile = { tablesAssigned: string | null; salaryAmount: string };

export default function WaiterView() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    initOneSignal().then(() => requestNotificationPermission());
  }, []);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 10000,
  });

  const { data: calls = [], isLoading: callsLoading } = useQuery<WaiterCall[]>({
    queryKey: ["/api/restaurant/waiter-calls"],
    refetchInterval: 8000,
  });

  const { data: myProfile } = useQuery<MyProfile>({
    queryKey: ["/api/restaurant/my-profile"],
  });

  type GuestMessage = { id: string; tableNumber: string; senderName: string | null; message: string; isReadByWaiter: boolean; createdAt: string };
  const { data: guestMessages = [], refetch: refetchMessages } = useQuery<GuestMessage[]>({
    queryKey: ["/api/restaurant/guest-messages"],
    refetchInterval: 15000,
  });

  const unreadCount = guestMessages.filter(m => !m.isReadByWaiter).length;
  const pendingConfirmOrders = orders.filter(o => o.kitchenStatus === "awaiting_confirmation");

  const confirmOrder = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/restaurant/orders/${id}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      toast({ title: t("rm.waiterConfirmed") });
    },
    onError: () => toast({ title: t("errors.generic", "Failed"), variant: "destructive" }),
  });

  const markMessagesRead = useMutation({
    mutationFn: (tableNumber: string) => apiRequest("PATCH", "/api/restaurant/guest-messages/read", { tableNumber }),
    onSuccess: () => refetchMessages(),
  });

  const deliverOrder = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/restaurant/orders/${id}/deliver`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      toast({ title: t('restaurant.markedDelivered') });
    },
    onError: () => toast({ title: t('errors.generic', 'Failed to update order'), variant: "destructive" }),
  });

  const acknowledgeCall = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/restaurant/waiter-calls/${id}/acknowledge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/waiter-calls"] });
      toast({ title: t('restaurant.acknowledged') });
    },
    onError: () => toast({ title: t('errors.generic', 'Failed to acknowledge'), variant: "destructive" }),
  });

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;
      const demoTok = getDemoToken();
      const demoHdrs: Record<string, string> = demoTok ? { "X-Demo-Token": demoTok } : {};
      fetch("/api/ws-token", { credentials: "include", headers: demoHdrs })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
        .then(data => {
          if (!mountedRef.current) return;
          try {
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const tokenParam = data?.token ? `&wsToken=${encodeURIComponent(data.token)}` : "";
            const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard${tokenParam}`);
            wsRef.current = ws;
            ws.onmessage = (evt) => {
              try {
                const msg = JSON.parse(evt.data as string);
                if (msg.type === "RESTAURANT_ORDER_READY") {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
                  toast({ title: t('restaurant.orderReady', { table: msg.order?.tableNumber || "?" }), description: t('restaurant.pickUpFromKitchen') });
                }
                if (msg.type === "RESTAURANT_CALL_WAITER") {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant/waiter-calls"] });
                  toast({
                    title: `${t('restaurant.waiterNeeded')} — ${msg.tableNumber ? `${t('restaurant.table')} ${msg.tableNumber}` : msg.roomNumber ? `${t('restaurant.room')} ${msg.roomNumber}` : ""}`,
                    description: msg.guestName || undefined,
                  });
                }
                if (msg.type === "RESTAURANT_GUEST_MESSAGE") {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant/guest-messages"] });
                  toast({ title: `💬 ${msg.senderName || "Qonaq"} — ${t('restaurant.table')} ${msg.tableNumber}`, description: msg.message });
                }
                if (msg.type === "RESTAURANT_GUEST_ORDER") {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
                  toast({ title: `🍽️ ${t("rm.pendingConfirm")} — ${t("restaurant.table")} ${msg.tableNumber}` });
                }
              } catch {}
            };
            ws.onclose = () => {
              if (!mountedRef.current) return;
              reconnectTimerRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, 5000);
            };
            ws.onerror = () => { ws.close(); };
          } catch {}
        });
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [queryClient, toast, t]);

  const readyOrders = orders.filter(o => o.kitchenStatus === "ready");
  const pendingCalls = (calls as WaiterCall[]).filter(c => c.status === "pending");
  const [msgTableFilter, setMsgTableFilter] = useState<string | null>(null);

  const [activeView, setActiveView] = useState("");

  const hubGroups = [
    {
      title: t("waiter.hubGroupLive", "Live Actions"),
      icon: <Package className="h-4 w-4 text-primary" />,
      color: "bg-primary/10",
      items: [
        {
          value: "orders",
          label: t("restaurant.tabOrders"),
          icon: <Package className="h-5 w-5" />,
          iconBg: "bg-emerald-100 dark:bg-emerald-900",
          iconColor: "text-emerald-700 dark:text-emerald-300",
          desc: t("waiter.hubDescOrders", "Ready orders to deliver"),
          badge: readyOrders.length,
          urgent: readyOrders.length > 0,
        },
        {
          value: "confirm",
          label: t("rm.pendingConfirm"),
          icon: <ClipboardCheck className="h-5 w-5" />,
          iconBg: "bg-amber-100 dark:bg-amber-900",
          iconColor: "text-amber-700 dark:text-amber-300",
          desc: t("waiter.hubDescConfirm", "QR orders awaiting confirmation"),
          badge: pendingConfirmOrders.length,
          urgent: pendingConfirmOrders.length > 0,
        },
        {
          value: "calls",
          label: t("restaurant.callWaiter"),
          icon: <Bell className="h-5 w-5" />,
          iconBg: "bg-rose-100 dark:bg-rose-900",
          iconColor: "text-rose-700 dark:text-rose-300",
          desc: t("waiter.hubDescCalls", "Guests calling for service"),
          badge: pendingCalls.length,
          urgent: pendingCalls.length > 0,
        },
      ],
    },
    {
      title: t("waiter.hubGroupComms", "Communication"),
      icon: <MessageSquare className="h-4 w-4 text-blue-600" />,
      color: "bg-blue-50 dark:bg-blue-950/30",
      items: [
        {
          value: "customer-msgs",
          label: t("rm.customerMsgs"),
          icon: <Users className="h-5 w-5" />,
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-700 dark:text-blue-300",
          desc: t("waiter.hubDescGuestMsgs", "Messages from guests"),
          badge: unreadCount,
          urgent: unreadCount > 0,
        },
        {
          value: "messages",
          label: t("restaurant.tabMessages"),
          icon: <MessageSquare className="h-5 w-5" />,
          iconBg: "bg-indigo-100 dark:bg-indigo-900",
          iconColor: "text-indigo-700 dark:text-indigo-300",
          desc: t("waiter.hubDescTeamMsgs", "Chat with team"),
          badge: 0,
          urgent: false,
        },
      ],
    },
  ];

  const currentLabel = hubGroups.flatMap(g => g.items).find(i => i.value === activeView)?.label ?? activeView;

  return (
    <>
      <Helmet>
        <title>{t('restaurant.waiter', 'Waiter')} | O.S.S</title>
      </Helmet>
      <div className="pb-8" data-testid="waiter-dashboard">

        {activeView === "" ? (
          /* ── HUB VIEW ── */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary rounded-xl">
                  <Utensils className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('restaurant.waiter')}</h1>
                  <p className="text-sm text-muted-foreground">{t('restaurant.markReady')}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {readyOrders.length > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {t('restaurant.readyCount', { count: readyOrders.length })}
                  </Badge>
                )}
                {pendingCalls.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 animate-pulse">
                    <Bell className="h-3 w-3 mr-1" />
                    {pendingCalls.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Assigned tables banner */}
            {myProfile?.tablesAssigned && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5" data-testid="waiter-assigned-tables">
                <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">{t('rm.waiterTablesAssigned')}:</span>
                <div className="flex gap-1 flex-wrap">
                  {myProfile.tablesAssigned.split(",").map(s => s.trim()).filter(Boolean).map(tbl => (
                    <Badge key={tbl} className="bg-primary/10 text-primary hover:bg-primary/20 text-xs" data-testid={`badge-waiter-table-${tbl}`}>
                      {tbl}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-emerald-600" /><span className="text-xs text-muted-foreground">{t('restaurant.statusReady')}</span></div>
                  <p className="text-xl font-bold text-emerald-600">{readyOrders.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">{t("restaurant.allActiveOrders")}</span></div>
                  <p className="text-xl font-bold">{orders.filter(o => o.kitchenStatus !== "delivered").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1"><Bell className={`h-4 w-4 ${pendingCalls.length > 0 ? "text-rose-600" : "text-muted-foreground"}`} /><span className="text-xs text-muted-foreground">{t('restaurant.callWaiter')}</span></div>
                  <p className={`text-xl font-bold ${pendingCalls.length > 0 ? "text-rose-600" : ""}`}>{pendingCalls.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1"><Users className={`h-4 w-4 ${unreadCount > 0 ? "text-blue-600" : "text-muted-foreground"}`} /><span className="text-xs text-muted-foreground">{t("rm.customerMsgs")}</span></div>
                  <p className={`text-xl font-bold ${unreadCount > 0 ? "text-blue-600" : ""}`}>{unreadCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Hub groups */}
            {hubGroups.map((group, gi) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.07 }}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden"
              >
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${group.color}`}>
                  {group.icon}
                  <span className="text-sm font-semibold">{group.title}</span>
                </div>
                <div className={`grid divide-x divide-y ${group.items.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
                  {group.items.map(item => (
                    <button
                      key={item.value}
                      onClick={() => setActiveView(item.value)}
                      className="flex flex-col items-start gap-2 p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
                      data-testid={`hub-btn-${item.value}`}
                    >
                      <div className={`p-2 rounded-lg ${item.iconBg} ${item.urgent ? "ring-2 ring-offset-1 ring-rose-400 dark:ring-rose-600" : ""}`}>
                        <span className={item.iconColor}>{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium leading-tight">{item.label}</p>
                          {item.badge > 0 && (
                            <Badge variant="destructive" className={`text-[10px] h-4 px-1.5 rounded-full ${item.urgent ? "animate-pulse" : ""}`}>
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* ── CONTENT VIEW ── */
          <div className="space-y-4">
            {/* Back button + breadcrumb */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView("")}
                className="gap-1.5 -ml-1"
                data-testid="btn-back-to-hub"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back", "Back")}
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{currentLabel}</span>
            </div>

            {/* ── Orders View ── */}
            {activeView === "orders" && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t('restaurant.statusReady')}</h2>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />)}
                  </div>
                ) : readyOrders.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                    <p>{t('restaurant.noMenuAvailable', 'No orders ready for pickup')}</p>
                  </div>
                ) : (
                  readyOrders.map(order => (
                    <Card key={order.id} className="border-2 border-emerald-200 dark:border-emerald-800" data-testid={`card-ready-order-${order.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {order.tableNumber ? `${t('restaurant.table')} ${order.tableNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                          </CardTitle>
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{t('restaurant.statusReady').toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {order.notes && <p className="text-sm text-muted-foreground mb-2 italic">{order.notes}</p>}
                        <p className="text-sm font-medium mb-3">{(order.totalCents / 100).toFixed(2)} ₼</p>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-3 h-auto"
                          onClick={() => deliverOrder.mutate(order.id)}
                          disabled={deliverOrder.isPending}
                          data-testid={`button-deliver-${order.id}`}
                        >
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          {t("restaurant.delivered")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
                <div className="mt-4">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">{t("restaurant.allActiveOrders")}</h2>
                  {orders.filter(o => o.kitchenStatus !== "delivered").map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border mb-2" data-testid={`row-order-${order.id}`}>
                      <div>
                        <p className="font-medium text-sm">
                          {order.tableNumber ? `${t('restaurant.table')} ${order.tableNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{order.kitchenStatus}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Confirm QR Orders View ── */}
            {activeView === "confirm" && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("rm.pendingConfirm")}</h2>
                {pendingConfirmOrders.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <ClipboardCheck className="h-12 w-12 mb-3 opacity-30" />
                    <p>{t("rm.noCustomerMsgs")}</p>
                  </div>
                ) : (
                  pendingConfirmOrders.map(order => (
                    <Card key={order.id} className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20" data-testid={`card-confirm-${order.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            {order.tableNumber ? `${t('restaurant.table')} ${order.tableNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                          </CardTitle>
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">QR</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {order.notes && <p className="text-sm text-muted-foreground mb-2 italic">{order.notes}</p>}
                        <p className="text-sm font-medium mb-3">{(order.totalCents / 100).toFixed(2)} ₼</p>
                        <Button
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                          onClick={() => confirmOrder.mutate(order.id)}
                          disabled={confirmOrder.isPending}
                          data-testid={`btn-confirm-order-${order.id}`}
                        >
                          {confirmOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
                          {t("rm.confirmOrder")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ── Calls View ── */}
            {activeView === "calls" && (
              <div className="space-y-3">
                {callsLoading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
                  </div>
                ) : pendingCalls.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-3 opacity-30" />
                    <p>{t('restaurant.waiterNeeded', 'No pending waiter calls')}</p>
                  </div>
                ) : (
                  pendingCalls.map(call => (
                    <Card key={call.id} className="border-2 border-amber-200 dark:border-amber-800" data-testid={`card-call-${call.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {call.tableNumber ? `${t('restaurant.table')} ${call.tableNumber}` : call.roomNumber ? `${t('restaurant.room')} ${call.roomNumber}` : t('restaurant.callWaiter')}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(call.calledAt), { addSuffix: true, locale: dateFnsLocale })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => acknowledgeCall.mutate(call.id)}
                            disabled={acknowledgeCall.isPending}
                            data-testid={`button-ack-call-${call.id}`}
                          >
                            {t('restaurant.acknowledged')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* ── Guest Messages View ── */}
            {activeView === "customer-msgs" && (
              <div className="space-y-3">
                {(() => {
                  const tableGroups = guestMessages.reduce<Record<string, typeof guestMessages>>((acc, m) => {
                    if (!acc[m.tableNumber]) acc[m.tableNumber] = [];
                    acc[m.tableNumber].push(m);
                    return acc;
                  }, {});
                  const tables = Object.keys(tableGroups);
                  if (tables.length === 0) return (
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mb-3 opacity-30" />
                      <p>{t("rm.noCustomerMsgs")}</p>
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant={msgTableFilter === null ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMsgTableFilter(null)}>Hamısı</Button>
                        {tables.map(tbl => {
                          const unread = tableGroups[tbl].filter(m => !m.isReadByWaiter).length;
                          return (
                            <Button key={tbl} size="sm" variant={msgTableFilter === tbl ? "default" : "outline"} className="h-7 text-xs relative" onClick={() => { setMsgTableFilter(tbl); markMessagesRead.mutate(tbl); }}>
                              {t("restaurant.table")} {tbl}
                              {unread > 0 && <span className="ml-1 bg-rose-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">{unread}</span>}
                            </Button>
                          );
                        })}
                      </div>
                      {(msgTableFilter ? tableGroups[msgTableFilter] || [] : guestMessages).map(msg => (
                        <div key={msg.id} className={`flex gap-2 items-start p-3 rounded-lg border ${msg.isReadByWaiter ? "opacity-60 bg-muted/20" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20"}`} data-testid={`guest-msg-${msg.id}`}>
                          <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
                            <Users className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold">{msg.senderName || "Qonaq"}</span>
                              <Badge variant="secondary" className="text-xs h-4 px-1">{t("restaurant.table")} {msg.tableNumber}</Badge>
                              {!msg.isReadByWaiter && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                            </div>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: dateFnsLocale })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Staff Messages View ── */}
            {activeView === "messages" && (
              <StaffDmChat
                peerRoles={["restaurant_manager", "admin", "owner_admin", "property_manager", "kitchen_staff", "restaurant_cashier"]}
                panelLabel={t("restaurant.teamLabel")}
                emptyLabel={t("restaurant.noTeamMembers")}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
