import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, CreditCard, Banknote, BedDouble, CheckCircle2,
  Clock, ShoppingBag, Printer, Building2, AlertCircle,
  Utensils, TrendingUp, TableProperties, RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type PosOrder = {
  id: string;
  tableNumber: string | null;
  roomNumber: string | null;
  guestName: string | null;
  notes: string | null;
  totalCents: number;
  kitchenStatus: string;
  settlementStatus: string;
  paymentType?: string | null;
  createdAt: string;
  items?: { itemName: string; quantity: number; unitPriceCents: number }[];
};

type Analytics = {
  today: { orderCount: number; revenueCents: number };
  month?: { orderCount: number; revenueCents: number };
  pendingSettlement: number;
  byPaymentType?: { cashCents: number; cardCents: number; roomChargeCents: number };
};

const fmt = (cents: number) => `₼${(cents / 100).toFixed(2)}`;

const SETTLEMENT_COLORS: Record<string, string> = {
  pending: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  settled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  room_charge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export default function RestaurantCashierDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settleDialog, setSettleDialog] = useState<PosOrder | null>(null);
  const [settleType, setSettleType] = useState("cash");

  const { data: orders = [], isLoading: ordersLoading } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 15000,
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/restaurant/analytics"],
    refetchInterval: 30000,
  });

  const settleOrder = useMutation({
    mutationFn: ({ id, paymentType }: { id: string; paymentType: string }) =>
      apiRequest("POST", `/api/restaurant/orders/${id}/settle`, { paymentType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/analytics"] });
      setSettleDialog(null);
      toast({ title: "Hesab uğurla bağlandı" });
    },
    onError: () => toast({ title: "Xəta baş verdi", variant: "destructive" }),
  });

  const pendingOrders = orders.filter(o => o.settlementStatus === "pending");
  const settledOrders = orders.filter(o => o.settlementStatus !== "pending");

  const groupedByTable: Record<string, PosOrder[]> = {};
  pendingOrders.forEach(o => {
    const key = o.tableNumber ? `Masa ${o.tableNumber}` : o.roomNumber ? `Otaq ${o.roomNumber}` : "Göstərilməyib";
    if (!groupedByTable[key]) groupedByTable[key] = [];
    groupedByTable[key].push(o);
  });

  const handlePrint = (order: PosOrder) => {
    const items = order.items?.map(i =>
      `  ${i.quantity}x ${i.itemName}  ${fmt(i.unitPriceCents * i.quantity)}`
    ).join("\n") ?? "";

    const receipt = [
      "═══════════════════════════════",
      "     GRAND RIVIERA RESORT",
      "       Restaurant Receipt",
      "═══════════════════════════════",
      `Masa: ${order.tableNumber || order.roomNumber || "—"}`,
      `Qonaq: ${order.guestName || "—"}`,
      `Tarix: ${new Date(order.createdAt).toLocaleString()}`,
      "───────────────────────────────",
      items,
      "───────────────────────────────",
      `CƏMİ:    ${fmt(order.totalCents)}`,
      "═══════════════════════════════",
    ].join("\n");

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px;">${receipt}</pre>`);
      win.document.close();
      win.print();
    }
  };

  return (
    <>
      <Helmet><title>Restoran Kassası | O.S.S</title></Helmet>

      <div className="space-y-5" data-testid="cashier-dashboard">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card data-testid="stat-today-revenue">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Bu günün gəliri</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(analytics?.today.revenueCents ?? 0)}</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-today-orders">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Bu günün sifarişi</p>
              <p className="text-2xl font-bold mt-1">{analytics?.today.orderCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-pending-settlement">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ödəniş gözləyir</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{pendingOrders.length}</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-cash-revenue">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Nağd / Kart</p>
              <p className="text-sm font-bold mt-1">
                {fmt(analytics?.byPaymentType?.cashCents ?? 0)} / {fmt(analytics?.byPaymentType?.cardCents ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" data-testid="tab-cashier-pending">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              Gözləyən Hesablar
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-xs">{pendingOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tables" data-testid="tab-cashier-tables">
              <TableProperties className="h-4 w-4 mr-1.5" />
              Masalar
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-cashier-history">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Tarixçə
            </TabsTrigger>
          </TabsList>

          {/* PENDING SETTLEMENTS */}
          <TabsContent value="pending" className="mt-4">
            {ordersLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
              </div>
            ) : pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-70" />
                  <p className="font-medium">Bütün hesablar ödənilib</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <Card key={order.id} className="border-2 border-rose-200 dark:border-rose-800" data-testid={`cashier-order-${order.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {order.tableNumber && (
                              <Badge variant="outline" className="font-bold">
                                <Utensils className="h-3 w-3 mr-1" />Masa {order.tableNumber}
                              </Badge>
                            )}
                            {order.roomNumber && (
                              <Badge variant="outline">
                                <BedDouble className="h-3 w-3 mr-1" />Otaq {order.roomNumber}
                              </Badge>
                            )}
                            {order.guestName && <span className="text-sm text-muted-foreground">{order.guestName}</span>}
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              {order.items.map((it, idx) => (
                                <div key={idx}>{it.quantity}× {it.itemName} — {fmt(it.unitPriceCents * it.quantity)}</div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-2">
                          <p className="text-xl font-bold text-rose-600">{fmt(order.totalCents)}</p>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrint(order)}
                              data-testid={`btn-print-${order.id}`}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />Çap
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => { setSettleDialog(order); setSettleType("cash"); }}
                              data-testid={`btn-settle-${order.id}`}
                            >
                              <Wallet className="h-3.5 w-3.5 mr-1" />Ödə
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TABLES VIEW */}
          <TabsContent value="tables" className="mt-4">
            {Object.keys(groupedByTable).length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  <TableProperties className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Aktiv masa yoxdur</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedByTable).map(([tableLabel, tableOrders]) => {
                  const total = tableOrders.reduce((s, o) => s + o.totalCents, 0);
                  return (
                    <Card key={tableLabel} className="border-2 border-amber-200 dark:border-amber-800" data-testid={`cashier-table-${tableLabel}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-primary" />
                            {tableLabel}
                          </span>
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                            {tableOrders.length} sifariş
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tableOrders.map(o => (
                          <div key={o.id} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</span>
                              <span className="font-medium">{fmt(o.totalCents)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-bold text-lg">{fmt(total)}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => tableOrders.forEach(o => handlePrint(o))} data-testid={`btn-table-print-${tableLabel}`}>
                              <Printer className="h-3.5 w-3.5 mr-1" />Çap
                            </Button>
                            {tableOrders.map(o => (
                              <Button key={o.id} size="sm" onClick={() => { setSettleDialog(o); setSettleType("cash"); }} data-testid={`btn-table-settle-${o.id}`}>
                                <Wallet className="h-3.5 w-3.5 mr-1" />Ödə
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="mt-4 space-y-2">
            {ordersLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : settledOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Tarixçə yoxdur</p>
                </CardContent>
              </Card>
            ) : (
              settledOrders.slice().reverse().map(order => (
                <Card key={order.id} data-testid={`cashier-history-${order.id}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.tableNumber && <Badge variant="outline" className="text-xs">Masa {order.tableNumber}</Badge>}
                        {order.roomNumber && <Badge variant="outline" className="text-xs">Otaq {order.roomNumber}</Badge>}
                        {order.paymentType === "cash" && <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><Banknote className="h-3 w-3 mr-1" />Nağd</Badge>}
                        {order.paymentType === "card" && <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><CreditCard className="h-3 w-3 mr-1" />Kart</Badge>}
                        {order.paymentType === "room_charge" && <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><BedDouble className="h-3 w-3 mr-1" />Otaq hesabı</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{fmt(order.totalCents)}</p>
                      <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Ödənilib
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Settle Dialog */}
      {settleDialog && (
        <Dialog open onOpenChange={() => setSettleDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hesabı Bağla</DialogTitle>
              <DialogDescription>
                {settleDialog.tableNumber ? `Masa ${settleDialog.tableNumber}` : settleDialog.roomNumber ? `Otaq ${settleDialog.roomNumber}` : ""} — <strong>{fmt(settleDialog.totalCents)}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Ödəniş növü</p>
                <Select value={settleType} onValueChange={setSettleType}>
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash"><div className="flex items-center gap-2"><Banknote className="h-4 w-4" />Nağd</div></SelectItem>
                    <SelectItem value="card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Kart</div></SelectItem>
                    <SelectItem value="room_charge"><div className="flex items-center gap-2"><BedDouble className="h-4 w-4" />Otaq hesabına əlavə et</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settleType === "room_charge" && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Bu məbləğ qonağın otaq hesabına əlavə ediləcək və hotel maliyyə hesabatında görünəcək.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettleDialog(null)}>Ləğv et</Button>
              <Button
                onClick={() => settleOrder.mutate({ id: settleDialog.id, paymentType: settleType })}
                disabled={settleOrder.isPending}
                data-testid="btn-confirm-settle"
              >
                {settleOrder.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Təsdiqlə — {fmt(settleDialog.totalCents)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
