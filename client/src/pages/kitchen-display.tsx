import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Bell, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
  cooking: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  ready: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
  delivered: "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700",
};

const BADGE_VARIANTS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cooking: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  delivered: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export default function KitchenDisplay() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const wsRef = useRef<WebSocket | null>(null);

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
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard`);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "RESTAURANT_NEW_ORDER") {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
          setLastRefresh(new Date());
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        }
      } catch {}
    };
    return () => ws.close();
  }, [queryClient]);

  const active = orders.filter(o => o.kitchenStatus !== "delivered");
  const pending = active.filter(o => o.kitchenStatus === "pending");
  const cooking = active.filter(o => o.kitchenStatus === "cooking");
  const ready = active.filter(o => o.kitchenStatus === "ready");

  function OrderCard({ order }: { order: PosOrder }) {
    return (
      <Card
        key={order.id}
        className={`border-2 ${STATUS_COLORS[order.kitchenStatus] || ""} transition-all`}
        data-testid={`card-order-${order.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">
              {order.tableNumber ? `Table ${order.tableNumber}` : order.guestName || "Order"}
            </CardTitle>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${BADGE_VARIANTS[order.kitchenStatus]}`}>
              {order.kitchenStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.notes && (
            <p className="text-sm italic text-muted-foreground border-l-2 border-muted pl-2">{order.notes}</p>
          )}
          <p className="text-xs text-muted-foreground">Order #{order.id.slice(-6).toUpperCase()}</p>
          <div className="flex gap-2 flex-wrap">
            {order.kitchenStatus === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                onClick={() => updateStatus.mutate({ id: order.id, status: "cooking" })}
                disabled={updateStatus.isPending}
                data-testid={`button-start-cooking-${order.id}`}
              >
                <ChefHat className="h-3 w-3 mr-1" />
                Start Cooking
              </Button>
            )}
            {order.kitchenStatus === "cooking" && (
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => updateStatus.mutate({ id: order.id, status: "ready" })}
                disabled={updateStatus.isPending}
                data-testid={`button-mark-ready-${order.id}`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mark Ready
              </Button>
            )}
            {order.kitchenStatus === "ready" && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 w-full justify-center py-1">
                Awaiting Pickup
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Kitchen Display | O.S.S</title>
      </Helmet>
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
                <p className="text-sm text-slate-400">Live order management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-amber-400" data-testid="text-pending-count">{pending.length}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400" data-testid="text-cooking-count">{cooking.length}</p>
                  <p className="text-xs text-slate-400">Cooking</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400" data-testid="text-ready-count">{ready.length}</p>
                  <p className="text-xs text-slate-400">Ready</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
                onClick={() => { refetch(); setLastRefresh(new Date()); }}
                data-testid="button-refresh-orders"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-48 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <ChefHat className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-xl font-medium">No active orders</p>
              <p className="text-sm">New orders will appear here automatically</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map(o => <OrderCard key={o.id} order={o} />)}
              {cooking.map(o => <OrderCard key={o.id} order={o} />)}
              {ready.map(o => <OrderCard key={o.id} order={o} />)}
            </div>
          )}

          <div className="mt-4 text-center text-xs text-slate-600">
            Last updated {formatDistanceToNow(lastRefresh, { addSuffix: true })} · Auto-refresh every 15s
          </div>
        </div>
      </div>
    </>
  );
}
