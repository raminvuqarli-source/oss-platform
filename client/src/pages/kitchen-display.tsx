import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Clock, CheckCircle2, RefreshCw, MapPin, BedDouble } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { az as azLocale, tr as trLocale, ru as ruLocale, ar as arLocale, fr as frLocale, de as deLocale, es as esLocale, nl as nlLocale } from "date-fns/locale";
import { faIR } from "date-fns/locale/fa-IR";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDemoToken } from "@/lib/queryClient";

type PosOrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

type PosOrder = {
  id: string;
  tableNumber: string | null;
  roomNumber: string | null;
  orderType: string | null;
  guestName: string | null;
  notes: string | null;
  totalCents: number;
  kitchenStatus: string;
  settlementStatus: string;
  createdAt: string;
  readyAt: string | null;
  items: PosOrderItem[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700",
  cooking: "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700",
  ready: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700",
  delivered: "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700",
};

const STATUS_HEADER_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  cooking: "bg-blue-500",
  ready: "bg-emerald-500",
  delivered: "bg-slate-500",
};

const dateFnsLocaleMap: Record<string, Locale> = {
  az: azLocale,
  tr: trLocale,
  ru: ruLocale,
  ar: arLocale,
  fr: frLocale,
  de: deLocale,
  es: esLocale,
  nl: nlLocale,
  fa: faIR,
};

export default function KitchenDisplay() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? undefined;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [mobileTab, setMobileTab] = useState<"pending" | "cooking" | "ready">("pending");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const { data: orders = [], isLoading, refetch } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/restaurant/orders/${id}/kitchen-status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      setLastRefresh(new Date());
    },
    onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
  });

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
                if (msg.type === "RESTAURANT_NEW_ORDER") {
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
                  setLastRefresh(new Date());
                  const audio = new Audio("/notification.mp3");
                  audio.play().catch(() => {});
                  if (isMobile) setMobileTab("pending");
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
  }, [queryClient, isMobile]);

  const active = orders.filter(o => o.kitchenStatus !== "delivered");
  const pending = active.filter(o => o.kitchenStatus === "pending");
  const cooking = active.filter(o => o.kitchenStatus === "cooking");
  const ready = active.filter(o => o.kitchenStatus === "ready");

  function OrderCard({ order }: { order: PosOrder }) {
    const isDineIn = order.orderType === "dine_in" || !!order.tableNumber;
    const locationLabel = isDineIn
      ? (order.tableNumber ? `${t('restaurant.table')} ${order.tableNumber}` : t('restaurant.restaurantLabel'))
      : (order.roomNumber ? `${t('restaurant.room')} ${order.roomNumber}` : t('restaurant.roomDeliveryLabel'));

    return (
      <Card
        className={`border-2 ${STATUS_COLORS[order.kitchenStatus] || ""} transition-all overflow-hidden`}
        data-testid={`card-order-${order.id}`}
      >
        <div className={`h-1.5 w-full ${STATUS_HEADER_COLORS[order.kitchenStatus] || "bg-slate-400"}`} />

        <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                {isDineIn
                  ? <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                  : <BedDouble className="h-4 w-4 text-blue-500 shrink-0" />
                }
                <span className="truncate">{locationLabel}</span>
              </CardTitle>
              {order.guestName && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">👤 {order.guestName}</p>
              )}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
              order.kitchenStatus === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              order.kitchenStatus === "cooking" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
              order.kitchenStatus === "ready" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" :
              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
            }`}>
              {order.kitchenStatus === "pending" ? `⏳` :
               order.kitchenStatus === "cooking" ? `🔥` :
               order.kitchenStatus === "ready" ? `✅` : "✓"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}
            </span>
            <span className="text-muted-foreground/60 shrink-0">· #{order.id.slice(-6).toUpperCase()}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-4 px-3 sm:px-6">
          {order.items && order.items.length > 0 ? (
            <div className="rounded-lg border bg-background/50 overflow-hidden">
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-2 sm:px-3 py-2 text-sm ${idx < order.items.length - 1 ? "border-b" : ""}`}
                  data-testid={`order-item-${item.id}`}
                >
                  <span className="font-medium flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {item.quantity}
                    </span>
                    <span className="truncate">{item.itemName}</span>
                  </span>
                  <span className="text-muted-foreground text-xs shrink-0 ml-1">
                    {(item.totalCents / 100).toFixed(2)} ₼
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-2 sm:px-3 py-2 bg-muted/30 text-sm font-semibold border-t">
                <span>{t('restaurant.kdsTotal')}</span>
                <span className="text-primary">{(order.totalCents / 100).toFixed(2)} ₼</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{t('restaurant.kdsNoItems')}</p>
          )}

          {order.notes && (
            <p className="text-sm italic text-muted-foreground border-l-2 border-muted pl-2">{order.notes}</p>
          )}

          <div className="flex gap-2 flex-wrap pt-1">
            {order.kitchenStatus === "pending" && (
              <Button
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => updateStatus.mutate({ id: order.id, status: "cooking" })}
                disabled={updateStatus.isPending}
                data-testid={`button-start-cooking-${order.id}`}
              >
                <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                {t('restaurant.startCooking')}
              </Button>
            )}
            {order.kitchenStatus === "cooking" && (
              <Button
                size="lg"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-3"
                onClick={() => updateStatus.mutate({ id: order.id, status: "ready" })}
                disabled={updateStatus.isPending}
                data-testid={`button-mark-ready-${order.id}`}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {t('restaurant.markReady')}
              </Button>
            )}
            {order.kitchenStatus === "ready" && (
              <div className="w-full rounded-lg bg-emerald-600 text-white text-center py-3 font-bold text-base animate-pulse">
                {t('restaurant.waiterNotified')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mobileTabs = [
    { key: "pending" as const, label: `⏳ ${t('restaurant.statusPending')}`, count: pending.length, color: "text-amber-400 border-amber-500", activeColor: "bg-amber-500 text-white border-amber-500" },
    { key: "cooking" as const, label: `🔥 ${t('restaurant.statusCooking')}`, count: cooking.length, color: "text-blue-400 border-blue-500", activeColor: "bg-blue-500 text-white border-blue-500" },
    { key: "ready" as const, label: `✅ ${t('restaurant.statusReady')}`, count: ready.length, color: "text-emerald-400 border-emerald-500", activeColor: "bg-emerald-500 text-white border-emerald-500" },
  ];

  const mobileOrders = mobileTab === "pending" ? pending : mobileTab === "cooking" ? cooking : ready;

  return (
    <>
      <Helmet>
        <title>{t('restaurant.kitchenDisplay')} | O.S.S</title>
      </Helmet>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-3 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg shrink-0">
                  <ChefHat className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-2xl font-bold text-white truncate">{t('restaurant.kitchenDisplay')}</h1>
                  {!isMobile && <p className="text-xs sm:text-sm text-slate-400">{t('restaurant.orderDialogDesc')}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Stats — always visible */}
                <div className="flex gap-3 sm:gap-5 text-center">
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-amber-400 leading-none" data-testid="text-pending-count">{pending.length}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{t('restaurant.statusPending')}</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-400 leading-none" data-testid="text-cooking-count">{cooking.length}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{t('restaurant.statusCooking')}</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-400 leading-none" data-testid="text-ready-count">{ready.length}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{t('restaurant.statusReady')}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white px-2"
                  onClick={() => { refetch(); setLastRefresh(new Date()); }}
                  data-testid="button-refresh-orders"
                >
                  <RefreshCw className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">{t('common.refresh', 'Refresh')}</span>}
                </Button>
              </div>
            </div>

            {/* Mobile tab switcher */}
            {isMobile && (
              <div className="flex gap-2 mt-3" data-testid="tabs-kitchen-mobile">
                {mobileTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMobileTab(tab.key)}
                    data-testid={`tab-kitchen-${tab.key}`}
                    className={`flex-1 py-2 px-1 rounded-lg border text-xs font-bold transition-all ${
                      mobileTab === tab.key ? tab.activeColor : `bg-slate-800 ${tab.color}`
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1 opacity-80">({tab.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-3 sm:p-4 sm:pt-4">
          {isLoading ? (
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <ChefHat className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-xl font-medium">{t('restaurant.noMenuAvailable', 'No active orders')}</p>
              <p className="text-sm">{t('common.autoRefresh', 'New orders will appear automatically')}</p>
            </div>
          ) : isMobile ? (
            /* Mobile: single column, filtered by selected tab */
            <div className="space-y-3">
              {mobileOrders.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-slate-500 text-sm">—</div>
              ) : (
                mobileOrders.map(o => <OrderCard key={o.id} order={o} />)
              )}
            </div>
          ) : (
            /* Desktop: 3-column grid */
            <>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {[
                  { label: `⏳ ${t('restaurant.statusPending').toUpperCase()}`, count: pending.length, color: "text-amber-400 border-amber-600" },
                  { label: `🔥 ${t('restaurant.statusCooking').toUpperCase()}`, count: cooking.length, color: "text-blue-400 border-blue-600" },
                  { label: `✅ ${t('restaurant.statusReady').toUpperCase()}`, count: ready.length, color: "text-emerald-400 border-emerald-600" },
                ].map(col => (
                  <div key={col.label} className={`text-center py-2 rounded-lg border ${col.color} bg-slate-800/50`}>
                    <span className={`text-sm font-bold ${col.color.split(" ")[0]}`}>{col.label}</span>
                    <span className="ml-2 text-slate-400 text-xs">({col.count})</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-4">
                  {pending.map(o => <OrderCard key={o.id} order={o} />)}
                  {pending.length === 0 && <div className="flex items-center justify-center py-12 text-slate-600 text-sm">—</div>}
                </div>
                <div className="space-y-4">
                  {cooking.map(o => <OrderCard key={o.id} order={o} />)}
                  {cooking.length === 0 && <div className="flex items-center justify-center py-12 text-slate-600 text-sm">—</div>}
                </div>
                <div className="space-y-4">
                  {ready.map(o => <OrderCard key={o.id} order={o} />)}
                  {ready.length === 0 && <div className="flex items-center justify-center py-12 text-slate-600 text-sm">—</div>}
                </div>
              </div>
            </>
          )}

          <div className="mt-4 text-center text-xs text-slate-600 pb-4">
            {t('restaurant.kdsLastUpdated')}: {formatDistanceToNow(lastRefresh, { addSuffix: true, locale: dateFnsLocale })} · {t('restaurant.kdsAutoRefresh')}
          </div>
        </div>
      </div>
    </>
  );
}
