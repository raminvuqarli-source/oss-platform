import { useState, useEffect, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Wallet, CreditCard, Banknote, BedDouble, CheckCircle2,
  Clock, ShoppingBag, Printer, AlertCircle,
  Utensils, TrendingUp, TableProperties, RefreshCw,
  MessageSquare, ClipboardList, Plus, MapPin,
  Hourglass, Loader2, CheckCheck, Mail,
  ArrowLeft, DollarSign, CheckSquare,
  Users, Package, Zap, HandCoins, RotateCcw, Receipt, Building2, Home,
  PieChart, ListChecks,
} from "lucide-react";
import { StaffDmChat } from "@/components/staff-dm-chat";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { az as azLocale, tr as trLocale, ru as ruLocale, ar as arLocale, fr as frLocale, de as deLocale, es as esLocale, nl as nlLocale } from "date-fns/locale";
import { faIR } from "date-fns/locale/fa-IR";
import { initOneSignal, requestNotificationPermission } from "@/lib/onesignal";

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

type HubItem = {
  icon: ElementType;
  label: string;
  badge?: string | number;
  iconBg: string;
  iconColor: string;
  action: () => void;
  testId: string;
};

type HubGroup = {
  label: string;
  desc: string;
  headerIcon: ElementType;
  headerColor: string;
  items: HubItem[];
};

const fmtCents = (cents: number) => `₼${(cents / 100).toFixed(2)}`;

export default function RestaurantCashierDashboard() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? undefined;
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState("hub");

  useEffect(() => {
    initOneSignal().then(() => requestNotificationPermission());
  }, []);

  const [settleDialog, setSettleDialog] = useState<PosOrder | null>(null);
  const [settleType, setSettleType] = useState("cash");
  const [chargeRoomNumber, setChargeRoomNumber] = useState("");
  const [receiptEmail, setReceiptEmail] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("__none__");

  // Cashier Payment form state
  const [payType, setPayType] = useState<string>("");
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [payRecipient, setPayRecipient] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const { data: currentUser } = useQuery<{ tenantType?: string | null }>({ queryKey: ["/api/auth/me"] });
  const isHotelTenant = currentUser?.tenantType === "hotel";

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 15000,
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery<Analytics>({
    queryKey: ["/api/restaurant/analytics"],
    refetchInterval: 30000,
  });

  const { data: staffUsers = [] } = useQuery<CleaningStaff[]>({ queryKey: ["/api/users/staff"] });
  const cleaners = staffUsers.filter(u => u.role === "restaurant_cleaner" || u.role === "waiter");

  const { data: cleaningTasks = [], isLoading: tasksLoading } = useQuery<CleaningTask[]>({
    queryKey: ["/api/restaurant/cleaning-tasks"],
    refetchInterval: 20000,
  });

  // Cashier payment type config (icon + i18n key)
  const PAYMENT_TYPES = [
    { value: "salary",    icon: Users,       labelKey: "cashier.typeSalary",    color: "text-blue-500",   bg: "bg-blue-500/10" },
    { value: "warehouse", icon: Package,     labelKey: "cashier.typeWarehouse",  color: "text-amber-500",  bg: "bg-amber-500/10" },
    { value: "utilities", icon: Zap,         labelKey: "cashier.typeUtilities",  color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { value: "cash_out",  icon: HandCoins,   labelKey: "cashier.typeCashOut",    color: "text-orange-500", bg: "bg-orange-500/10" },
    { value: "refund",    icon: RotateCcw,   labelKey: "cashier.typeRefund",     color: "text-rose-500",   bg: "bg-rose-500/10" },
    { value: "tax",       icon: Receipt,     labelKey: "cashier.typeTax",        color: "text-purple-500", bg: "bg-purple-500/10" },
    { value: "transfer",  icon: Building2,   labelKey: "cashier.typeTransfer",   color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { value: "rent",      icon: Home,        labelKey: "cashier.typeRent",       color: "text-teal-500",   bg: "bg-teal-500/10" },
  ] as const;

  type CashierPayment = {
    id: string;
    paymentType: string;
    amountCents: number;
    description: string;
    recipientName: string | null;
    cashierName: string | null;
    notes: string | null;
    createdAt: string;
  };

  const { data: cashierPaymentsList = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery<CashierPayment[]>({
    queryKey: ["/api/cashier/payments"],
    refetchInterval: 30000,
  });

  const { data: paymentSummary = {} as Record<string, number> } = useQuery<Record<string, number>>({
    queryKey: ["/api/cashier/payments/summary"],
    refetchInterval: 60000,
  });

  const createPayment = useMutation({
    mutationFn: (data: { paymentType: string; amountCents: number; description: string; recipientName?: string; notes?: string }) =>
      apiRequest("POST", "/api/cashier/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cashier/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashier/payments/summary"] });
      setPayType("");
      setPayAmount("");
      setPayDesc("");
      setPayRecipient("");
      setPayNotes("");
      toast({ title: t("cashier.paymentCreated") });
    },
    onError: () => toast({ title: t("cashier.paymentError"), variant: "destructive" }),
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
    mutationFn: ({ id, paymentType, roomNumber, customerEmail }: { id: string; paymentType: string; roomNumber?: string; customerEmail?: string }) =>
      apiRequest("POST", `/api/restaurant/orders/${id}/settle`, { paymentType, roomNumber: roomNumber || undefined, customerEmail: customerEmail || undefined }),
    onSuccess: (_data, vars) => {
      if (settleDialog && vars.paymentType !== "room_charge") handlePrint(settleDialog);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/analytics"] });
      setSettleDialog(null);
      setChargeRoomNumber("");
      setReceiptEmail("");
      toast({ title: vars.paymentType === "room_charge" ? t("cashier.roomChargePosted", "Otaq hesabına borc yazıldı") : t("cashier.confirmed") });
    },
    onError: () => toast({ title: t("errors.somethingWentWrong"), variant: "destructive" }),
  });

  const openSettle = (order: PosOrder, defaultType?: string) => {
    setChargeRoomNumber(order.roomNumber || "");
    setSettleType(defaultType ?? (order.roomNumber ? "room_charge" : "cash"));
    setSettleDialog(order);
  };

  const pendingOrders = orders.filter(o => o.settlementStatus === "pending");
  const settledOrders = orders.filter(o => o.settlementStatus !== "pending");

  const groupedByTable: Record<string, PosOrder[]> = {};
  pendingOrders.forEach(o => {
    const key = o.tableNumber
      ? `${t("cashier.table")} ${o.tableNumber}`
      : o.roomNumber ? `${t("cashier.room")} ${o.roomNumber}` : t("cashier.unknown");
    if (!groupedByTable[key]) groupedByTable[key] = [];
    groupedByTable[key].push(o);
  });

  const handlePrint = (order: PosOrder) => {
    const items = order.items?.map(i =>
      `  ${i.quantity}x ${i.itemName}  ${fmtCents(i.unitPriceCents * i.quantity)}`
    ).join("\n") ?? "";
    const location = order.tableNumber
      ? `${t("cashier.table")}: ${order.tableNumber}`
      : order.roomNumber ? `${t("cashier.room")}: ${order.roomNumber}` : "—";
    const receipt = [
      "═══════════════════════════════",
      `    ${t("cashier.receiptTitle", "RESTORAN ÇEKİ")}`,
      "═══════════════════════════════",
      location,
      `${t("cashier.receiptGuest", "Qonaq")}: ${order.guestName || "—"}`,
      `${t("cashier.receiptDate", "Tarix")}: ${new Date(order.createdAt).toLocaleString("az-AZ")}`,
      "───────────────────────────────",
      items || `  —`,
      "───────────────────────────────",
      `${t("cashier.receiptTotal", "Cəmi")}:   ${fmtCents(order.totalCents)}`,
      "═══════════════════════════════",
    ].join("\n");
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px;">${receipt}</pre>`);
      win.document.close();
      win.print();
    }
  };

  const navigate = (view: string) => setCurrentView(view);

  const pendingTaskCount = cleaningTasks.filter(t => t.status !== "done").length;

  const groups: HubGroup[] = [
    {
      label: t("cashier.tabPending", "Ödəniş Gözləyənlər"),
      desc: t("cashier.pendingDesc", "Açıq hesablar, masalar"),
      headerIcon: AlertCircle,
      headerColor: "text-rose-500",
      items: [
        {
          icon: AlertCircle,
          label: t("cashier.tabPending", "Ödəniş Gözləyənlər"),
          badge: pendingOrders.length > 0 ? pendingOrders.length : undefined,
          iconBg: "bg-rose-500/10", iconColor: "text-rose-500",
          action: () => navigate("pending"),
          testId: "hub-pending",
        },
        {
          icon: TableProperties,
          label: t("cashier.tabTables", "Masalar"),
          badge: Object.keys(groupedByTable).length > 0 ? Object.keys(groupedByTable).length : undefined,
          iconBg: "bg-amber-500/10", iconColor: "text-amber-500",
          action: () => navigate("tables"),
          testId: "hub-tables",
        },
        {
          icon: RefreshCw,
          label: t("cashier.refresh", "Yenilə"),
          iconBg: "bg-slate-500/10", iconColor: "text-slate-500",
          action: () => { refetchOrders(); refetchAnalytics(); toast({ title: "Yeniləndi" }); },
          testId: "hub-refresh",
        },
        {
          icon: Printer,
          label: t("cashier.print", "Çek Çap"),
          iconBg: "bg-blue-500/10", iconColor: "text-blue-500",
          action: () => navigate("pending"),
          testId: "hub-print",
        },
      ],
    },
    {
      label: t("cashier.tabHistory", "Tarixçə"),
      desc: t("cashier.historyDesc", "Tamamlanmış ödənişlər"),
      headerIcon: TrendingUp,
      headerColor: "text-emerald-500",
      items: [
        {
          icon: TrendingUp,
          label: t("cashier.tabHistory", "Tarixçə"),
          badge: settledOrders.length > 0 ? settledOrders.length : undefined,
          iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500",
          action: () => navigate("history"),
          testId: "hub-history",
        },
        {
          icon: DollarSign,
          label: t("cashier.todayRevenue", "Bu günün gəliri"),
          badge: fmtCents(analytics?.today.revenueCents ?? 0),
          iconBg: "bg-green-500/10", iconColor: "text-green-500",
          action: () => navigate("history"),
          testId: "hub-revenue",
        },
        {
          icon: Banknote,
          label: t("cashier.paidCash", "Nağd"),
          badge: fmtCents(analytics?.byPaymentType?.cashCents ?? 0),
          iconBg: "bg-teal-500/10", iconColor: "text-teal-500",
          action: () => navigate("history"),
          testId: "hub-cash",
        },
        {
          icon: CreditCard,
          label: t("cashier.paidCard", "Kart"),
          badge: fmtCents(analytics?.byPaymentType?.cardCents ?? 0),
          iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500",
          action: () => navigate("history"),
          testId: "hub-card",
        },
      ],
    },
    {
      label: t("cashier.tabTasks", "Tapşırıqlar"),
      desc: t("cashier.tasksDesc", "Təmizlik tapşırıqları"),
      headerIcon: ClipboardList,
      headerColor: "text-violet-500",
      items: [
        {
          icon: Plus,
          label: t("cashier.cleaningTaskTitle", "Tapşırıq Yarat"),
          iconBg: "bg-violet-500/10", iconColor: "text-violet-500",
          action: () => navigate("tasks"),
          testId: "hub-create-task",
        },
        {
          icon: CheckSquare,
          label: t("cashier.taskStatusTitle", "Tapşırıq Statusu"),
          badge: pendingTaskCount > 0 ? pendingTaskCount : undefined,
          iconBg: "bg-orange-500/10", iconColor: "text-orange-500",
          action: () => navigate("tasks"),
          testId: "hub-task-status",
        },
      ],
    },
    {
      label: t("cashier.tabPayments", "Xərclər & Ödənişlər"),
      desc: t("cashier.paymentsDesc", "Maaş, arenda, vergi və s."),
      headerIcon: DollarSign,
      headerColor: "text-fuchsia-500",
      items: [
        {
          icon: Plus,
          label: t("cashier.newPayment", "Yeni Ödəniş"),
          iconBg: "bg-fuchsia-500/10", iconColor: "text-fuchsia-500",
          action: () => navigate("new_payment"),
          testId: "hub-new-payment",
        },
        {
          icon: ListChecks,
          label: t("cashier.paymentHistory", "Ödəniş Tarixçəsi"),
          badge: cashierPaymentsList.length > 0 ? cashierPaymentsList.length : undefined,
          iconBg: "bg-violet-500/10", iconColor: "text-violet-500",
          action: () => navigate("payment_history"),
          testId: "hub-payment-history",
        },
        {
          icon: PieChart,
          label: t("cashier.paymentSummary", "Xərc Xülasəsi"),
          iconBg: "bg-sky-500/10", iconColor: "text-sky-500",
          action: () => navigate("payment_summary"),
          testId: "hub-payment-summary",
        },
        {
          icon: RefreshCw,
          label: t("cashier.refresh", "Yenilə"),
          iconBg: "bg-slate-500/10", iconColor: "text-slate-500",
          action: () => { refetchPayments(); toast({ title: "Yeniləndi" }); },
          testId: "hub-payment-refresh",
        },
      ],
    },
    {
      label: t("cashier.tabMessages", "Mesajlar"),
      desc: t("cashier.messagesDesc", "Komanda ilə əlaqə"),
      headerIcon: MessageSquare,
      headerColor: "text-cyan-500",
      items: [
        {
          icon: MessageSquare,
          label: t("cashier.teamMessages", "Komanda Mesajları"),
          iconBg: "bg-cyan-500/10", iconColor: "text-cyan-500",
          action: () => navigate("messages"),
          testId: "hub-messages",
        },
      ],
    },
  ];

  function renderView() {
    if (currentView === "hub") {
      return (
        <div className="space-y-2 pb-4">
          {/* KPI Strip */}
          <motion.div
            className="grid grid-cols-3 gap-2 mb-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { label: t("cashier.todayRevenue", "Bu günün gəliri"), value: fmtCents(analytics?.today.revenueCents ?? 0), color: "text-emerald-500" },
              { label: t("cashier.pendingPayment", "Ödəniş gözləyir"), value: String(pendingOrders.length), color: pendingOrders.length > 0 ? "text-rose-500" : "text-emerald-500" },
              { label: t("cashier.todayOrders", "Sifarişlər"), value: String(analytics?.today.orderCount ?? 0), color: "text-blue-500" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-border/50 bg-card px-3 py-2.5 text-center">
                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Hub Groups */}
          {groups.map((group, gi) => (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: gi * 0.06 }}
              className="rounded-2xl border border-border/50 bg-card overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-muted/30">
                <group.headerIcon className={`h-4 w-4 ${group.headerColor} shrink-0`} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-none">{group.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{group.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-border/30">
                {group.items.map(item => (
                  <button
                    key={item.testId}
                    onClick={item.action}
                    data-testid={item.testId}
                    className="relative flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors"
                  >
                    <div className={`${item.iconBg} p-2 rounded-lg shrink-0`}>
                      <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    <span className="text-[12.5px] font-medium text-foreground leading-tight line-clamp-2 flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {typeof item.badge === "number" && item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    if (currentView === "pending") {
      return (
        <div className="space-y-3">
          {ordersLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-70" />
                <p className="font-medium">{t("cashier.allPaid", "Bütün ödənişlər tamamlandı")}</p>
              </CardContent>
            </Card>
          ) : (
            pendingOrders.map(order => (
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
                            <div key={idx}>{it.quantity}× {it.itemName} — {fmtCents(it.unitPriceCents * it.quantity)}</div>
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
                      <p className="text-xl font-bold text-rose-600">{fmtCents(order.totalCents)}</p>
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => handlePrint(order)} data-testid={`btn-print-${order.id}`}>
                          <Printer className="h-3.5 w-3.5 mr-1" />{t("cashier.print")}
                        </Button>
                        <Button size="sm" onClick={() => openSettle(order)} data-testid={`btn-settle-${order.id}`}>
                          <Wallet className="h-3.5 w-3.5 mr-1" />{t("cashier.pay")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      );
    }

    if (currentView === "tables") {
      return (
        <div>
          {Object.keys(groupedByTable).length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <TableProperties className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{t("cashier.noActiveTables", "Aktiv masa yoxdur")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(groupedByTable).map(([tableLabel, tableOrders]) => {
                const total = tableOrders.reduce((s, o) => s + o.totalCents, 0);
                return (
                  <Card key={tableLabel} className="border-2 border-amber-200 dark:border-amber-800" data-testid={`cashier-table-${tableLabel}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-primary" />{tableLabel}
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
                            <span className="font-medium">{fmtCents(o.totalCents)}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <span className="font-bold text-lg">{fmtCents(total)}</span>
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
        </div>
      );
    }

    if (currentView === "history") {
      return (
        <div className="space-y-2">
          {ordersLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : settledOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{t("cashier.noHistory", "Tarixçə boşdur")}</p>
              </CardContent>
            </Card>
          ) : (
            settledOrders.slice().reverse().map(order => (
              <Card key={order.id} data-testid={`cashier-history-${order.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.tableNumber && <Badge variant="outline" className="text-xs">{t("cashier.table")} {order.tableNumber}</Badge>}
                      {order.roomNumber && <Badge variant="outline" className="text-xs">{t("cashier.room")} {order.roomNumber}</Badge>}
                      {order.settlementStatus === "cash_paid" && <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><Banknote className="h-3 w-3 mr-1" />{t("cashier.paidCash")}</Badge>}
                      {order.settlementStatus === "card_paid" && <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><CreditCard className="h-3 w-3 mr-1" />{t("cashier.paidCard")}</Badge>}
                      {order.settlementStatus === "posted_to_folio" && <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><BedDouble className="h-3 w-3 mr-1" />{t("cashier.debtPosted", "Borc yazıldı")}</Badge>}
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                        {order.items.map((it, idx) => (
                          <div key={idx}>{it.quantity}× {it.itemName} — {fmtCents(it.unitPriceCents * it.quantity)}</div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-lg">{fmtCents(order.totalCents)}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlePrint(order)} data-testid={`btn-history-print-${order.id}`}>
                        <Printer className="h-3.5 w-3.5 mr-1" />{t("cashier.print", "Çek")}
                      </Button>
                      <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />{t("cashier.settled")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      );
    }

    if (currentView === "tasks") {
      return (
        <div className="space-y-4">
          {/* Create new task */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{t("cashier.cleaningTaskTitle", "Tapşırıq Yarat")}</h3>
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
                    <SelectTrigger data-testid="select-task-assignee"><SelectValue placeholder={t("cashier.selectAssignee", "İşçi seçin")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("cashier.noAssignee", "Təyin edilməsin")}</SelectItem>
                      {cleaners.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName}
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({c.role === "waiter" ? t("cashier.roleWaiter", "Qarson") : t("cashier.roleCleaner", "Təmizlikçi")})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!taskDesc.trim() || createTask.isPending}
                  onClick={() => createTask.mutate({ description: taskDesc.trim(), location: taskLocation.trim(), assignedToId: taskAssignee === "__none__" ? undefined : taskAssignee })}
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
                {cleaningTasks.length > 0 && <Badge variant="secondary" className="ml-auto">{cleaningTasks.length}</Badge>}
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
                        {task.status === "done" ? <CheckCheck className="h-4 w-4 text-green-500" />
                          : task.status === "in_progress" ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          : <Hourglass className="h-4 w-4 text-amber-500" />}
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
                        task.status === "done" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0"
                          : task.status === "in_progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shrink-0"
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
        </div>
      );
    }

    if (currentView === "new_payment") {
      const canSubmit = payType && payAmount && parseFloat(payAmount) > 0 && payDesc.trim();
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-fuchsia-500" />
                <h3 className="font-semibold">{t("cashier.newPayment", "Yeni Ödəniş")}</h3>
              </div>

              {/* Payment type grid */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">{t("cashier.paymentTypeLabel")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_TYPES.map(pt => {
                    const Icon = pt.icon;
                    const isSelected = payType === pt.value;
                    return (
                      <button
                        key={pt.value}
                        onClick={() => setPayType(pt.value)}
                        data-testid={`btn-paytype-${pt.value}`}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30 shadow-sm"
                            : "border-border/60 hover:bg-muted/50"
                        }`}
                      >
                        <div className={`${pt.bg} p-1.5 rounded-lg shrink-0`}>
                          <Icon className={`h-3.5 w-3.5 ${pt.color}`} />
                        </div>
                        <span className="text-xs font-medium leading-tight">{t(pt.labelKey)}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-500 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">{t("cashier.amount", "Məbləğ (AZN)")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">₼</span>
                  <Input
                    id="pay-amount"
                    data-testid="input-pay-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("cashier.amountPlaceholder", "Məs: 150.00")}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-desc">{t("cashier.descriptionLabel", "Təsvir")}</Label>
                <Textarea
                  id="pay-desc"
                  data-testid="input-pay-desc"
                  placeholder={t("cashier.descriptionPlaceholder")}
                  value={payDesc}
                  onChange={e => setPayDesc(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Recipient */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-recipient">{t("cashier.recipientLabel", "Alan şəxs (ixtiyari)")}</Label>
                <Input
                  id="pay-recipient"
                  data-testid="input-pay-recipient"
                  placeholder={t("cashier.recipientPlaceholder")}
                  value={payRecipient}
                  onChange={e => setPayRecipient(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="pay-notes">{t("cashier.notesLabel", "Qeydlər (ixtiyari)")}</Label>
                <Input
                  id="pay-notes"
                  data-testid="input-pay-notes"
                  placeholder={t("cashier.notesPlaceholder")}
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={!canSubmit || createPayment.isPending}
                onClick={() => {
                  if (!canSubmit) return;
                  const amountCents = Math.round(parseFloat(payAmount) * 100);
                  createPayment.mutate({
                    paymentType: payType,
                    amountCents,
                    description: payDesc.trim(),
                    recipientName: payRecipient.trim() || undefined,
                    notes: payNotes.trim() || undefined,
                  });
                }}
                data-testid="btn-submit-payment"
              >
                {createPayment.isPending
                  ? <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {t("cashier.submitPayment", "Ödənişi Qeydə Al")}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === "payment_history") {
      const getTypeConfig = (value: string) => PAYMENT_TYPES.find(pt => pt.value === value);
      return (
        <div className="space-y-2">
          {paymentsLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : cashierPaymentsList.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("cashier.noPayments", "Ödəniş yoxdur")}</p>
              </CardContent>
            </Card>
          ) : (
            cashierPaymentsList.map(payment => {
              const cfg = getTypeConfig(payment.paymentType);
              const Icon = cfg?.icon ?? DollarSign;
              return (
                <Card key={payment.id} data-testid={`cashier-payment-${payment.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`${cfg?.bg ?? "bg-muted"} p-2 rounded-xl shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${cfg?.color ?? "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate">{payment.description}</p>
                          {payment.recipientName && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Users className="h-3 w-3" />{payment.recipientName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true, locale: dateFnsLocale })}
                            {payment.cashierName ? ` · ${payment.cashierName}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-rose-600">-{fmtCents(payment.amountCents)}</p>
                          <Badge variant="outline" className="text-[10px] mt-1">
                            {t(`cashier.type${payment.paymentType.charAt(0).toUpperCase() + payment.paymentType.slice(1).replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())}`, payment.paymentType)}
                          </Badge>
                        </div>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{payment.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      );
    }

    if (currentView === "payment_summary") {
      const totalCents = Object.values(paymentSummary).reduce((a, b) => a + b, 0);
      return (
        <div className="space-y-4">
          {/* Total card */}
          <Card className="bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10 border-fuchsia-200 dark:border-fuchsia-800">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("cashier.totalExpenses", "Ümumi xərc")}</p>
              <p className="text-3xl font-bold text-fuchsia-600">{fmtCents(totalCents)}</p>
              <p className="text-xs text-muted-foreground mt-1">{cashierPaymentsList.length} {t("cashier.ordersCount", "qeyd")}</p>
            </CardContent>
          </Card>

          {/* Per-type breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-sky-500" />
                {t("cashier.summaryTitle", "Növlərə görə xərc")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {PAYMENT_TYPES.map(pt => {
                const cents = paymentSummary[pt.value] ?? 0;
                const Icon = pt.icon;
                const pct = totalCents > 0 ? Math.round((cents / totalCents) * 100) : 0;
                return (
                  <div key={pt.value} className="space-y-1" data-testid={`summary-row-${pt.value}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`${pt.bg} p-1.5 rounded-lg`}>
                          <Icon className={`h-3 w-3 ${pt.color}`} />
                        </div>
                        <span className="text-sm font-medium">{t(pt.labelKey)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{fmtCents(cents)}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">{pct}%</span>
                      </div>
                    </div>
                    {cents > 0 && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pt.color.replace("text-", "bg-")}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === "messages") {
      return (
        <StaffDmChat
          peerRoles={["restaurant_manager", "admin", "owner_admin", "property_manager", "waiter", "kitchen_staff", "restaurant_cleaner"]}
          panelLabel={t("cashier.teamMessages")}
          emptyLabel={t("cashier.noTeam")}
        />
      );
    }

    return null;
  }

  const VIEW_TITLES: Record<string, string> = {
    pending: t("cashier.tabPending", "Ödəniş Gözləyənlər"),
    tables: t("cashier.tabTables", "Masalar"),
    history: t("cashier.tabHistory", "Tarixçə"),
    tasks: t("cashier.tabTasks", "Tapşırıqlar"),
    messages: t("cashier.tabMessages", "Mesajlar"),
    new_payment: t("cashier.newPayment", "Yeni Ödəniş"),
    payment_history: t("cashier.paymentHistory", "Ödəniş Tarixçəsi"),
    payment_summary: t("cashier.paymentSummary", "Xərc Xülasəsi"),
  };

  return (
    <>
      <Helmet><title>{t("cashier.settleTitle")} | O.S.S</title></Helmet>

      <div className="min-h-screen bg-background" data-testid="cashier-dashboard">
        {/* In-content top bar — back button + view title */}
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-1 flex items-center gap-3">
          {currentView !== "hub" ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("hub")} data-testid="btn-header-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold text-sm truncate">
              {currentView !== "hub" ? VIEW_TITLES[currentView] : (user?.fullName || t("cashier.title", "Kassa"))}
            </span>
            {pendingOrders.length > 0 && currentView === "hub" && (
              <Badge variant="destructive" className="text-xs h-5 px-1.5 shrink-0">{pendingOrders.length} {t("cashier.pending", "gözləyir")}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { refetchOrders(); refetchAnalytics(); }} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Settle Dialog */}
        {settleDialog && (
          <Dialog open onOpenChange={() => setSettleDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("cashier.settleTitle")}</DialogTitle>
                <DialogDescription>
                  {settleDialog.tableNumber ? `${t("cashier.table")} ${settleDialog.tableNumber}` : settleDialog.roomNumber ? `${t("cashier.room")} ${settleDialog.roomNumber}` : ""} — <strong>{fmtCents(settleDialog.totalCents)}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("cashier.paymentType")}</p>
                  <Select value={settleType} onValueChange={setSettleType}>
                    <SelectTrigger data-testid="select-payment-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash"><div className="flex items-center gap-2"><Banknote className="h-4 w-4" />{t("cashier.cash")}</div></SelectItem>
                      <SelectItem value="card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />{t("cashier.card")}</div></SelectItem>
                      {isHotelTenant && (
                        <SelectItem value="room_charge"><div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-violet-600" />{t("cashier.roomCharge", "Otağın hesabına əlavə et")}</div></SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {settleType === "room_charge" && (
                  <div className="space-y-2">
                    <Label htmlFor="charge-room-number">{t("cashier.roomNumber", "Otaq nömrəsi")}</Label>
                    <Input id="charge-room-number" data-testid="input-charge-room-number" placeholder="məs. 202" value={chargeRoomNumber} onChange={e => setChargeRoomNumber(e.target.value)} className="font-mono" />
                    <p className="text-xs text-muted-foreground">{t("cashier.roomChargeNote", "Qonağın açıq foliosuna borc kimi yazılacaq.")}</p>
                  </div>
                )}
                {(settleType === "cash" || settleType === "card") && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{settleType === "cash" ? t("cashier.cashNote", "Nağd ödəniş qəbul edildi.") : t("cashier.cardNote", "Kart ödənişi qəbul edildi.")}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="receipt-email" className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {t("cashier.receiptEmailLabel", "Çek emaili (ixtiyari)")}
                  </Label>
                  <Input id="receipt-email" data-testid="input-receipt-email" type="email" placeholder="müştəri@email.com" value={receiptEmail} onChange={e => setReceiptEmail(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t("cashier.receiptEmailNote", "Doldurulsa, müştəriyə çek emaili göndəriləcək.")}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSettleDialog(null); setChargeRoomNumber(""); setReceiptEmail(""); }}>{t("rm.cancel")}</Button>
                <Button
                  onClick={() => settleOrder.mutate({ id: settleDialog.id, paymentType: settleType, roomNumber: chargeRoomNumber || undefined, customerEmail: receiptEmail.trim() || undefined })}
                  disabled={settleOrder.isPending || (settleType === "room_charge" && !chargeRoomNumber.trim())}
                  data-testid="btn-confirm-settle"
                >
                  {settleOrder.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {`${t("cashier.confirmBtn")} — ${fmtCents(settleDialog.totalCents)}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
