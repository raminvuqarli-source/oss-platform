import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  Utensils, TrendingUp, TableProperties, RefreshCw,
  MessageSquare, ClipboardList, Plus, MapPin, Users,
  Hourglass, Loader2, CheckCheck
} from "lucide-react";
import { StaffDmChat } from "@/components/staff-dm-chat";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { az as azLocale, tr as trLocale, ru as ruLocale, ar as arLocale, fr as frLocale, de as deLocale, es as esLocale, nl as nlLocale } from "date-fns/locale";
import { faIR } from "date-fns/locale/fa-IR";

const dateFnsLocaleMap: Record<string, Locale> = {
  az: azLocale, tr: trLocale, ru: ruLocale, ar: arLocale,
  fr: frLocale, de: deLocale, es: esLocale, nl: nlLocale, fa: faIR,
};

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

type CleaningStaff = { id: string; fullName: string; role: string };
type CleaningTask = {
  id: string;
  description: string;
  location: string | null;
  status: string;
  createdAt: string;
  assignedTo?: { fullName: string } | null;
  photos?: string[];
};

export default function RestaurantCashierDashboard() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settleDialog, setSettleDialog] = useState<PosOrder | null>(null);
  const [settleType, setSettleType] = useState("cash");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("__none__");

  const { data: orders = [], isLoading: ordersLoading } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 15000,
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/restaurant/analytics"],
    refetchInterval: 30000,
  });

  const { data: staffUsers = [] } = useQuery<CleaningStaff[]>({
    queryKey: ["/api/users/staff"],
  });
  const cleaners = staffUsers.filter(u => u.role === "restaurant_cleaner");

  const { data: cleaningTasks = [], isLoading: tasksLoading } = useQuery<CleaningTask[]>({
    queryKey: ["/api/restaurant/cleaning-tasks"],
    refetchInterval: 20000,
  });

  const createTask = useMutation({
    mutationFn: ({ description, location, assignedToId }: { description: string; location: string; assignedToId?: string }) =>
      apiRequest("POST", "/api/restaurant/cleaning-tasks", { description, location, assignedToId: assignedToId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] });
      setTaskDesc("");
      setTaskLocation("");
      setTaskAssignee("__none__");
      toast({ title: t("cashier.taskSent") });
    },
    onError: () => toast({ title: t("errors.somethingWentWrong"), variant: "destructive" }),
  });

  const settleOrder = useMutation({
    mutationFn: ({ id, paymentType }: { id: string; paymentType: string }) =>
      apiRequest("POST", `/api/restaurant/orders/${id}/settle`, { paymentType }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/analytics"] });
      setSettleDialog(null);
      const msg = vars.paymentType === "room_charge"
        ? t("cashier.roomChargePosted", "Otaq hesabına borc yazıldı")
        : t("cashier.confirmed");
      toast({ title: msg });
    },
    onError: () => toast({ title: t("errors.somethingWentWrong"), variant: "destructive" }),
  });

  const openSettle = (order: PosOrder, defaultType?: string) => {
    setSettleType(defaultType ?? (order.roomNumber ? "room_charge" : "cash"));
    setSettleDialog(order);
  };

  const pendingOrders = orders.filter(o => o.settlementStatus === "pending");
  const settledOrders = orders.filter(o => o.settlementStatus !== "pending");

  const groupedByTable: Record<string, PosOrder[]> = {};
  pendingOrders.forEach(o => {
    const key = o.tableNumber ? `${t("cashier.table")} ${o.tableNumber}` : o.roomNumber ? `${t("cashier.room")} ${o.roomNumber}` : t("cashier.unknown");
    if (!groupedByTable[key]) groupedByTable[key] = [];
    groupedByTable[key].push(o);
  });

  const handlePrint = (order: PosOrder) => {
    const items = order.items?.map(i =>
      `  ${i.quantity}x ${i.itemName}  ${fmt(i.unitPriceCents * i.quantity)}`
    ).join("\n") ?? "";

    const location = order.tableNumber
      ? `${t("cashier.table")}: ${order.tableNumber}`
      : order.roomNumber
        ? `${t("cashier.room")}: ${order.roomNumber}`
        : "—";

    const receipt = [
      "═══════════════════════════════",
      "     GRAND RIVIERA RESORT",
      `    ${t("cashier.receiptTitle")}`,
      "═══════════════════════════════",
      location,
      `${t("cashier.receiptGuest")}: ${order.guestName || "—"}`,
      `${t("cashier.receiptDate")}: ${new Date(order.createdAt).toLocaleString()}`,
      "───────────────────────────────",
      items,
      "───────────────────────────────",
      `${t("cashier.receiptTotal")}:   ${fmt(order.totalCents)}`,
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
      <Helmet><title>{t("cashier.settleTitle")} | O.S.S</title></Helmet>

      <div className="space-y-5" data-testid="cashier-dashboard">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card data-testid="stat-today-revenue">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("cashier.todayRevenue")}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fmt(analytics?.today.revenueCents ?? 0)}</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-today-orders">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("cashier.todayOrders")}</p>
              <p className="text-2xl font-bold mt-1">{analytics?.today.orderCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-pending-settlement">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("cashier.pendingPayment")}</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{pendingOrders.length}</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-cash-revenue">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t("cashier.cashCard")}</p>
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
              {t("cashier.tabPending")}
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-xs">{pendingOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tables" data-testid="tab-cashier-tables">
              <TableProperties className="h-4 w-4 mr-1.5" />
              {t("cashier.tabTables")}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-cashier-history">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              {t("cashier.tabHistory")}
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-cashier-tasks">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              {t("cashier.tabTasks")}
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-cashier-messages">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              {t("cashier.tabMessages")}
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
                  <p className="font-medium">{t("cashier.allPaid")}</p>
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
                                <Utensils className="h-3 w-3 mr-1" />{t("cashier.table")} {order.tableNumber}
                              </Badge>
                            )}
                            {order.roomNumber && (
                              <Badge variant="outline">
                                <BedDouble className="h-3 w-3 mr-1" />{t("cashier.room")} {order.roomNumber}
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
                              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-2">
                          <p className="text-xl font-bold text-rose-600">{fmt(order.totalCents)}</p>
                          <div className="flex gap-2 justify-end flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrint(order)}
                              data-testid={`btn-print-${order.id}`}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />{t("cashier.print")}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openSettle(order)}
                              data-testid={`btn-settle-${order.id}`}
                            >
                              <Wallet className="h-3.5 w-3.5 mr-1" />{t("cashier.pay")}
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
                  <p>{t("cashier.noActiveTables")}</p>
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
                            {tableOrders.length} {t("cashier.ordersCount")}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tableOrders.map(o => (
                          <div key={o.id} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true, locale: dateFnsLocale })}</span>
                              <span className="font-medium">{fmt(o.totalCents)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                          <span className="font-bold text-lg">{fmt(total)}</span>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => tableOrders.forEach(o => handlePrint(o))} data-testid={`btn-table-print-${tableLabel}`}>
                              <Printer className="h-3.5 w-3.5 mr-1" />{t("cashier.print")}
                            </Button>
                            {tableOrders.map(o => (
                              <Button key={o.id} size="sm" onClick={() => openSettle(o)} data-testid={`btn-table-settle-${o.id}`}>
                                <Wallet className="h-3.5 w-3.5 mr-1" />{t("cashier.pay")}
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
                  <p>{t("cashier.noHistory")}</p>
                </CardContent>
              </Card>
            ) : (
              settledOrders.slice().reverse().map(order => (
                <Card key={order.id} data-testid={`cashier-history-${order.id}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.tableNumber && <Badge variant="outline" className="text-xs">{t("cashier.table")} {order.tableNumber}</Badge>}
                        {order.roomNumber && <Badge variant="outline" className="text-xs">{t("cashier.room")} {order.roomNumber}</Badge>}
                        {order.settlementStatus === "cash_paid" && <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><Banknote className="h-3 w-3 mr-1" />{t("cashier.paidCash")}</Badge>}
                        {order.settlementStatus === "card_paid" && <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><CreditCard className="h-3 w-3 mr-1" />{t("cashier.paidCard")}</Badge>}
                        {order.settlementStatus === "posted_to_folio" && <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><BedDouble className="h-3 w-3 mr-1" />{t("cashier.debtPosted", "Borc yazıldı")}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{fmt(order.totalCents)}</p>
                      <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />{t("cashier.settled")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TASK CREATION + STATUS */}
          <TabsContent value="tasks" className="mt-4 space-y-4">
            {/* Create new task */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{t("cashier.cleaningTaskTitle")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="task-desc">{t("cashier.taskDesc")}</Label>
                    <Textarea
                      id="task-desc"
                      placeholder={t("cashier.taskDescPlaceholder")}
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      className="resize-none"
                      rows={2}
                      data-testid="input-task-desc"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="task-location">{t("cashier.location")}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="task-location"
                        placeholder="Məs: Restoran salonunun solunda"
                        value={taskLocation}
                        onChange={e => setTaskLocation(e.target.value)}
                        className="pl-9"
                        data-testid="input-task-location"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cashier.assignTo")}</Label>
                    <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                      <SelectTrigger data-testid="select-task-assignee">
                        <SelectValue placeholder={t("cashier.selectCleaner")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t("cashier.noCleaner")}</SelectItem>
                        {cleaners.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!taskDesc.trim() || createTask.isPending}
                    onClick={() => createTask.mutate({
                      description: taskDesc.trim(),
                      location: taskLocation.trim(),
                      assignedToId: taskAssignee === "__none__" ? undefined : taskAssignee,
                    })}
                    data-testid="btn-create-task"
                  >
                    {createTask.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {t("cashier.sendTask")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Task status list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  {t("cashier.taskStatusTitle")}
                  {cleaningTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">{cleaningTasks.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {tasksLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : cleaningTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("cashier.noTasks")}</p>
                ) : (
                  <div className="space-y-2">
                    {cleaningTasks.slice().reverse().map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card" data-testid={`task-status-${task.id}`}>
                        <div className="mt-0.5 shrink-0">
                          {task.status === "done" ? (
                            <CheckCheck className="h-4 w-4 text-green-500" />
                          ) : task.status === "in_progress" ? (
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          ) : (
                            <Hourglass className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{task.description}</p>
                          {task.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{task.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                            {task.assignedTo?.fullName ? ` · ${task.assignedTo.fullName}` : ""}
                          </p>
                        </div>
                        <Badge className={
                          task.status === "done"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shrink-0"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shrink-0"
                        }>
                          {task.status === "done" ? t("cashier.taskStatusDone") : task.status === "in_progress" ? t("cashier.taskStatusInProgress") : t("cashier.taskStatusPending")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MESSAGES */}
          <TabsContent value="messages" className="mt-4">
            <StaffDmChat
              peerRoles={["restaurant_manager", "admin", "owner_admin", "property_manager", "waiter", "kitchen_staff", "restaurant_cleaner"]}
              panelLabel={t("cashier.teamMessages")}
              emptyLabel={t("cashier.noTeam")}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Settle Dialog */}
      {settleDialog && (
        <Dialog open onOpenChange={() => setSettleDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("cashier.settleTitle")}</DialogTitle>
              <DialogDescription>
                {settleDialog.tableNumber ? `${t("cashier.table")} ${settleDialog.tableNumber}` : settleDialog.roomNumber ? `${t("cashier.room")} ${settleDialog.roomNumber}` : ""} — <strong>{fmt(settleDialog.totalCents)}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("cashier.paymentType")}</p>
                <Select value={settleType} onValueChange={setSettleType}>
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash"><div className="flex items-center gap-2"><Banknote className="h-4 w-4" />{t("cashier.cash")}</div></SelectItem>
                    <SelectItem value="card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />{t("cashier.card")}</div></SelectItem>
                    {settleDialog?.roomNumber && (
                      <SelectItem value="room_charge"><div className="flex items-center gap-2"><span className="text-base">🏨</span>{t("cashier.roomCharge", "Borc Yaz")}</div></SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {(settleType === "cash" || settleType === "card") && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{settleType === "cash" ? t("cashier.cashNote", "Nağd ödəniş qəbul edildi. Maliyyə sisteminə daxil olunacaq.") : t("cashier.cardNote", "Kart ödənişi qəbul edildi. Maliyyə sisteminə daxil olunacaq.")}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettleDialog(null)}>{t("rm.cancel")}</Button>
              <Button
                onClick={() => settleOrder.mutate({ id: settleDialog.id, paymentType: settleType })}
                disabled={settleOrder.isPending}
                data-testid="btn-confirm-settle"
              >
                {settleOrder.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {`${t("cashier.confirmBtn")} — ${fmt(settleDialog.totalCents)}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
