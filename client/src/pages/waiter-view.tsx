import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { Bell, Package, CheckCircle2, Clock, Utensils, MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
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

export default function WaiterView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 10000,
  });

  const { data: calls = [], isLoading: callsLoading } = useQuery<WaiterCall[]>({
    queryKey: ["/api/restaurant/waiter-calls"],
    refetchInterval: 8000,
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

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard`);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
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
      } catch {}
    };
    return () => ws.close();
  }, [queryClient, toast]);

  const readyOrders = orders.filter(o => o.kitchenStatus === "ready");
  const pendingCalls = (calls as WaiterCall[]).filter(c => c.status === "pending");

  return (
    <>
      <Helmet>
        <title>{t('restaurant.waiter', 'Waiter')} | O.S.S</title>
      </Helmet>
      <div className="space-y-4" data-testid="waiter-dashboard">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Utensils className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('restaurant.waiter')}</h1>
            <p className="text-sm text-muted-foreground">{t('restaurant.markReady')}</p>
          </div>
          <div className="ml-auto flex gap-2">
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

        <Tabs defaultValue="orders">
          <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-waiter">
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="h-4 w-4 mr-1" />
              {t("restaurant.tabOrders")}
              {readyOrders.length > 0 && <Badge variant="destructive" className="ml-1.5 text-xs">{readyOrders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="calls" data-testid="tab-calls">
              <Bell className="h-4 w-4 mr-1" />
              {t('restaurant.callWaiter')}
              {pendingCalls.length > 0 && <Badge variant="destructive" className="ml-1.5 text-xs">{pendingCalls.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-waiter-messages">
              <MessageSquare className="h-4 w-4 mr-1" />
              {t("restaurant.tabMessages")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t('restaurant.statusReady')}</h2>
            </div>
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
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
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

            {/* All active orders list */}
            <div className="mt-4">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">{t("restaurant.allActiveOrders")}</h2>
              {orders.filter(o => o.kitchenStatus !== "delivered").map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border mb-2" data-testid={`row-order-${order.id}`}>
                  <div>
                    <p className="font-medium text-sm">
                      {order.tableNumber ? `${t('restaurant.table')} ${order.tableNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{order.kitchenStatus}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calls" className="space-y-3 mt-3">
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
                          {formatDistanceToNow(new Date(call.calledAt), { addSuffix: true })}
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
          </TabsContent>

          <TabsContent value="messages" className="mt-3">
            <StaffDmChat
              peerRoles={["restaurant_manager", "admin", "owner_admin", "property_manager", "kitchen_staff", "restaurant_cashier"]}
              panelLabel={t("restaurant.teamLabel")}
              emptyLabel={t("restaurant.noTeamMembers")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
