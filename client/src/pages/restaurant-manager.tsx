import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat, UtensilsCrossed, Plus, Edit2, Trash2,
  DollarSign, ShoppingBag, Clock, CheckCircle2, CreditCard,
  Users, UserPlus, Loader2, Shield, Utensils, LayoutGrid,
  Sparkles, TrendingUp, Banknote, Wallet, CreditCard as CardIcon,
  ClipboardList, CheckSquare, Camera, MapPin, BarChart2, Trophy, Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { az as azLocale, tr as trLocale, ru as ruLocale, ar as arLocale, fr as frLocale, de as deLocale, es as esLocale, nl as nlLocale } from "date-fns/locale";
import { faIR } from "date-fns/locale/fa-IR";

const dateFnsLocaleMap: Record<string, Locale> = {
  az: azLocale, tr: trLocale, ru: ruLocale, ar: arLocale,
  fr: frLocale, de: deLocale, es: esLocale, nl: nlLocale, fa: faIR,
};

type Category = { id: string; name: string; sortOrder: number; isActive: boolean };
type MenuItem = { id: string; name: string; description: string | null; priceCents: number; categoryId: string | null; isAvailable: boolean };
type PosOrder = {
  id: string; tableNumber: string | null; roomNumber: string | null; guestName: string | null;
  notes: string | null; totalCents: number; kitchenStatus: string; waiterId: string | null;
  settlementStatus: string; createdAt: string; bookingId: string | null;
  items?: { itemName: string; quantity: number; unitPriceCents: number }[];
};
type DailyEntry = { date: string; orderCount: number; revenueCents: number };
type Analytics = {
  today: { orderCount: number; revenueCents: number };
  month?: { orderCount: number; revenueCents: number };
  activeOrders: { pending: number; cooking: number; ready: number; delivered: number };
  pendingSettlement: number;
  totalAllTime?: number;
  byPaymentType?: { cashCents: number; cardCents: number; roomChargeCents: number };
  dailyHistory?: DailyEntry[];
};
type StaffProfile = { id: string; userId: string; salaryAmount: string; taxRate: string; tablesAssigned: string | null; notes: string | null };
type CleaningTask = { id: string; description: string; location: string | null; assignedToId: string | null; status: string; createdAt: string; photoUrl: string | null; completedAt: string | null };
type RoomGroup = { roomNumber: string; orders: PosOrder[]; totalCents: number };
type RestaurantTable = { id: string; tableNumber: string; capacity: number | null; status: "empty" | "occupied"; activeOrders: PosOrder[] };

const fmt = (cents: number) => `₼${(cents / 100).toFixed(2)}`;

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cooking: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  delivered: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
const taskStatusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export default function RestaurantManager() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("orders");

  // ── dialog state ──
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState<PosOrder | null>(null);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showWaiterEditDialog, setShowWaiterEditDialog] = useState<any | null>(null);
  const [showCleaningTaskDialog, setShowCleaningTaskDialog] = useState(false);
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // ── form state ──
  const [categoryForm, setCategoryForm] = useState({ name: "", sortOrder: "0" });
  const [itemForm, setItemForm] = useState({ name: "", description: "", priceCents: "", categoryId: "" });
  const [settleType, setSettleType] = useState("cash");
  const [staffForm, setStaffForm] = useState({ fullName: "", username: "", password: "", email: "", role: "waiter", baseSalary: "", employeeTaxRate: "", tablesAssigned: "" });
  const [waiterProfileForm, setWaiterProfileForm] = useState({ salaryAmount: "", taxRate: "", tablesAssigned: "", notes: "" });
  const [cleaningForm, setCleaningForm] = useState({ description: "", location: "", assignedToId: "" });
  const [tableForm, setTableForm] = useState({ tableNumber: "", capacity: "" });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [qrTableNumber, setQrTableNumber] = useState<string | null>(null);

  // ── WebSocket for real-time updates ──
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard`);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "RESTAURANT_CLEANING_TASK_UPDATED") {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] });
          const task = msg.task;
          if (task?.status === "done") {
            toast({ title: t("restaurant.cleaningDone"), description: task.description + (task.location ? ` — ${task.location}` : "") });
          } else if (task?.status === "in_progress") {
            toast({ title: t("restaurant.cleaningStarted"), description: task.description + (task.location ? ` — ${task.location}` : "") });
          }
        }
        if (msg.type === "RESTAURANT_CLEANING_TASK_CREATED") {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] });
        }
        if (msg.type === "RESTAURANT_NEW_ORDER" || msg.type === "RESTAURANT_ORDER_UPDATED" || msg.type === "RESTAURANT_GUEST_ORDER") {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/analytics"] });
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/room-orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/tables"] });
          if (msg.type === "RESTAURANT_GUEST_ORDER") {
            toast({ title: `🍽️ ${t("rm.pendingConfirm")} — ${t("restaurant.table")} ${msg.tableNumber}` });
          }
        }
        if (msg.type === "RESTAURANT_GUEST_MESSAGE") {
          toast({ title: `💬 ${msg.senderName} — ${t("restaurant.table")} ${msg.tableNumber}`, description: msg.message });
        }
      } catch {}
    };
    return () => ws.close();
  }, [queryClient, toast]);

  // ── queries ──
  const { data: currentUser } = useQuery<{ propertyId?: string | null }>({ queryKey: ["/api/auth/me"] });
  const { data: menu } = useQuery<{ categories: Category[]; items: MenuItem[] }>({ queryKey: ["/api/restaurant/menu"] });
  const { data: orders = [] } = useQuery<PosOrder[]>({ queryKey: ["/api/restaurant/orders"], refetchInterval: 15000 });
  const { data: analytics } = useQuery<Analytics>({ queryKey: ["/api/restaurant/analytics"], refetchInterval: 30000 });
  const { data: restaurantStaff = [] } = useQuery<any[]>({ queryKey: ["/api/users/staff"] });
  const { data: staffProfiles = [] } = useQuery<StaffProfile[]>({ queryKey: ["/api/restaurant/staff-profiles"] });
  const { data: cleaningTasks = [] } = useQuery<CleaningTask[]>({ queryKey: ["/api/restaurant/cleaning-tasks"] });
  const { data: roomOrders = [] } = useQuery<RoomGroup[]>({ queryKey: ["/api/restaurant/room-orders"], refetchInterval: 20000 });
  const { data: restaurantTables = [] } = useQuery<RestaurantTable[]>({ queryKey: ["/api/restaurant/tables"], refetchInterval: 20000 });

  const categories = menu?.categories || [];
  const items = menu?.items || [];

  const restaurantRoles = ["waiter", "kitchen_staff", "restaurant_manager", "restaurant_cleaner", "restaurant_cashier"];
  const myRestaurantStaff = restaurantStaff.filter((s: any) => restaurantRoles.includes(s.role));
  const waiters = myRestaurantStaff.filter((s: any) => s.role === "waiter");
  const cleaners = myRestaurantStaff.filter((s: any) => s.role === "restaurant_cleaner");

  // ── mutations ──
  const createStaff = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("POST", "/api/admin/create-staff", data);
      return res.json();
    },
    onSuccess: async (newUser: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] });
      // If waiter with table assignment, auto-save profile
      if (staffForm.role === "waiter" && staffForm.tablesAssigned && newUser?.id) {
        try {
          await apiRequest("PUT", `/api/restaurant/staff-profiles/${newUser.id}`, {
            salaryAmount: staffForm.baseSalary || "0",
            taxRate: staffForm.employeeTaxRate || "0",
            tablesAssigned: staffForm.tablesAssigned,
            notes: "",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/staff-profiles"] });
        } catch {}
      }
      setShowAddStaffDialog(false);
      setStaffForm({ fullName: "", username: "", password: "", email: "", role: "waiter", baseSalary: "", employeeTaxRate: "", tablesAssigned: "" });
      toast({ title: t("rm.staffCreated") });
    },
    onError: (err: any) => toast({ title: err?.message || t("errors.somethingWentWrong"), variant: "destructive" }),
  });

  const saveWaiterProfile = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: object }) => apiRequest("PUT", `/api/restaurant/staff-profiles/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/staff-profiles"] });
      setShowWaiterEditDialog(null);
      toast({ title: t("rm.waiterProfileUpdated") });
    },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });

  const createCategory = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/restaurant/menu/categories", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] }); setShowCategoryDialog(false); setCategoryForm({ name: "", sortOrder: "0" }); toast({ title: t("rm.categoryCreated") }); },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => apiRequest("PATCH", `/api/restaurant/menu/categories/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] }); setShowCategoryDialog(false); setEditingCategory(null); toast({ title: t("rm.updated") }); },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/restaurant/menu/categories/${id}`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] }); toast({ title: t("rm.deleted") }); },
  });
  const createItem = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/restaurant/menu/items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] }); setShowItemDialog(false); setItemForm({ name: "", description: "", priceCents: "", categoryId: "" }); toast({ title: t("rm.itemCreated") }); },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => apiRequest("PATCH", `/api/restaurant/menu/items/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] }); setShowItemDialog(false); setEditingItem(null); toast({ title: t("rm.updated") }); },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const deleteItem = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/restaurant/menu/items/${id}`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] }); toast({ title: t("rm.deleted") }); },
  });
  const settleOrder = useMutation({
    mutationFn: ({ id, paymentType }: { id: string; paymentType: string }) => apiRequest("POST", `/api/restaurant/orders/${id}/settle`, { paymentType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/room-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/tables"] });
      setShowSettleDialog(null);
      toast({ title: t("rm.paymentCompleted") });
    },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const createCleaningTask = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/restaurant/cleaning-tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] });
      setShowCleaningTaskDialog(false);
      setCleaningForm({ description: "", location: "", assignedToId: "" });
      toast({ title: t("rm.taskCreated") });
    },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const updateCleaningTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => apiRequest("PATCH", `/api/restaurant/cleaning-tasks/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] }); toast({ title: t("rm.taskUpdated") }); },
  });
  const createTable = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/restaurant/tables", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/tables"] });
      setShowAddTableDialog(false);
      setTableForm({ tableNumber: "", capacity: "" });
      toast({ title: t("rm.tableCreated") });
    },
    onError: () => toast({ title: t("errors.unexpected", "Error"), variant: "destructive" }),
  });
  const deleteTable = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/restaurant/tables/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/tables"] });
      toast({ title: t("rm.tableDeleted") });
    },
  });

  const pendingSettlementOrders = orders.filter(o => o.kitchenStatus === "delivered" && o.settlementStatus === "pending");
  const activeOrders = orders.filter(o => o.kitchenStatus !== "delivered");

  function openCategoryEdit(cat: Category) { setEditingCategory(cat); setCategoryForm({ name: cat.name, sortOrder: String(cat.sortOrder) }); setShowCategoryDialog(true); }
  function openItemEdit(item: MenuItem) { setEditingItem(item); setItemForm({ name: item.name, description: item.description || "", priceCents: String(item.priceCents / 100), categoryId: item.categoryId || "" }); setShowItemDialog(true); }
  function openWaiterEdit(waiter: any) {
    const profile = staffProfiles.find(p => p.userId === waiter.id);
    setWaiterProfileForm({ salaryAmount: profile?.salaryAmount || "", taxRate: profile?.taxRate || "", tablesAssigned: profile?.tablesAssigned || "", notes: profile?.notes || "" });
    setShowWaiterEditDialog(waiter);
  }
  function handleCategorySubmit() {
    const data = { name: categoryForm.name, sortOrder: parseInt(categoryForm.sortOrder) || 0 };
    if (editingCategory) { updateCategory.mutate({ id: editingCategory.id, data }); } else { createCategory.mutate(data); }
  }
  function handleItemSubmit() {
    const priceCents = Math.round(parseFloat(itemForm.priceCents || "0") * 100);
    const data = { name: itemForm.name, description: itemForm.description || null, priceCents, categoryId: (itemForm.categoryId && itemForm.categoryId !== "none") ? itemForm.categoryId : null };
    if (editingItem) { updateItem.mutate({ id: editingItem.id, data }); } else { createItem.mutate(data); }
  }

  // ── Performance computations ──
  const waiterPerf = waiters.map((w: any) => {
    const myOrders = orders.filter(o => o.waiterId === w.id);
    const delivered = myOrders.filter(o => o.kitchenStatus === "delivered").length;
    const revenue = myOrders.filter(o => o.settlementStatus === "settled").reduce((s, o) => s + o.totalCents, 0);
    return { ...w, delivered, revenue };
  }).sort((a, b) => b.delivered - a.delivered);

  const cleanerPerf = cleaners.map((c: any) => {
    const completed = cleaningTasks.filter(t => t.assignedToId === c.id && t.status === "done").length;
    const total = cleaningTasks.filter(t => t.assignedToId === c.id).length;
    return { ...c, completed, total };
  }).sort((a, b) => b.completed - a.completed);

  const tabs = [
    { value: "orders", label: t("rm.tabOrders"), icon: <ShoppingBag className="h-4 w-4" />, badge: pendingSettlementOrders.length },
    { value: "tables", label: t("rm.tabTables"), icon: <LayoutGrid className="h-4 w-4" />, badge: restaurantTables.filter(t => t.status === "occupied").length },
    { value: "settlement", label: t("rm.tabSettlement"), icon: <CreditCard className="h-4 w-4" />, badge: pendingSettlementOrders.length },
    { value: "kabinetler", label: t("rm.tabRooms"), icon: <UtensilsCrossed className="h-4 w-4" />, badge: roomOrders.length },
    { value: "menu", label: t("rm.tabMenu"), icon: <ChefHat className="h-4 w-4" />, badge: 0 },
    { value: "waiters", label: t("rm.tabWaiters"), icon: <Utensils className="h-4 w-4" />, badge: waiters.length },
    { value: "cleaning", label: t("rm.tabCleaning"), icon: <Sparkles className="h-4 w-4" />, badge: cleaningTasks.filter(c => c.status !== "done").length },
    { value: "staff", label: t("rm.tabStaff"), icon: <Users className="h-4 w-4" />, badge: myRestaurantStaff.length },
    { value: "performance", label: t("rm.tabPerformance"), icon: <BarChart2 className="h-4 w-4" />, badge: 0 },
    { value: "finance", label: t("rm.tabFinance"), icon: <TrendingUp className="h-4 w-4" />, badge: 0 },
  ];

  return (
    <>
      <Helmet>
        <title>{t("rm.pageTitle")} | O.S.S</title>
      </Helmet>
      <div className="space-y-4 pb-8" data-testid="restaurant-manager-dashboard">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("rm.pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("rm.subtitle")}</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card data-testid="card-today-revenue">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /><span className="text-sm text-muted-foreground">{t("rm.todayRevenue")}</span></div>
              <p className="text-2xl font-bold mt-1 text-emerald-600" data-testid="text-today-revenue">{fmt(analytics?.today?.revenueCents ?? 0)}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-today-orders">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">{t("rm.todayOrders")}</span></div>
              <p className="text-2xl font-bold mt-1" data-testid="text-today-orders">{analytics?.today?.orderCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-active-orders">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /><span className="text-sm text-muted-foreground">{t("rm.active")}</span></div>
              <p className="text-2xl font-bold mt-1" data-testid="text-active-orders">{activeOrders.length}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-pending-settlement">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-rose-600" /><span className="text-sm text-muted-foreground">{t("rm.pendingPayment")}</span></div>
              <p className="text-2xl font-bold mt-1 text-rose-600" data-testid="text-pending-settlement">{analytics?.pendingSettlement ?? pendingSettlementOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full mb-3" data-testid="select-manager-tab">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tabs.map(tab => (
                  <SelectItem key={tab.value} value={tab.value}>
                    <div className="flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                      {tab.badge > 0 ? ` (${tab.badge})` : ""}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <TabsList className="flex flex-wrap h-auto gap-1 w-full" data-testid="tabs-manager">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} data-testid={`tab-manager-${tab.value}`}>
                  {tab.icon}
                  <span className="ml-1">{tab.label}</span>
                  {tab.badge > 0 && <span className="ml-1">({tab.badge})</span>}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {/* ── Orders Tab ── */}
          <TabsContent value="orders" className="mt-4 space-y-2">
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                <p>{t("rm.noActiveOrders")}</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`row-manager-order-${order.id}`}>
                  <div className="flex-1">
                    <p className="font-medium">
                      {order.tableNumber ? `${t("rm.table")} ${order.tableNumber}` : order.roomNumber ? `${t("rm.room")} ${order.roomNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: dateFnsLocale })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{fmt(order.totalCents)}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColor[order.kitchenStatus]}`}>
                      {order.kitchenStatus === "pending" ? t("rm.statusPending") : order.kitchenStatus === "cooking" ? t("rm.statusCooking") : order.kitchenStatus === "ready" ? t("rm.statusReady") : t("rm.statusDelivered")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* ── Tables (Masalar) Tab ── */}
          <TabsContent value="tables" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t("rm.tableStatusHeader")}</h3>
                <p className="text-sm text-muted-foreground">{t("rm.tablesTabNote")}</p>
              </div>
              <Button size="sm" onClick={() => setShowAddTableDialog(true)} data-testid="button-add-table">
                <Plus className="h-4 w-4 mr-1.5" />{t("rm.add")}
              </Button>
            </div>
            {restaurantTables.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-3 opacity-30" />
                <p>{t("rm.noTables")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {restaurantTables.map((table) => (
                  <Card
                    key={table.id}
                    className={`relative border-2 transition-all ${table.status === "occupied" ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30" : "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"}`}
                    data-testid={`card-table-${table.tableNumber}`}
                  >
                    <CardContent className="pt-3 pb-3 px-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg">{table.tableNumber}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => setQrTableNumber(table.tableNumber)}
                            data-testid={`button-qr-table-${table.tableNumber}`}
                            title={t("rm.qrScanTitle")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h1v1h-1zm3 0h1v1h-1zm-3 3h1v1h-1zm3 0h1v1h-1zm0 3h1v1h-1zm-3 0h1v1h-1zm3-6h1v1h-1z"/></svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteTable.mutate(table.id)}
                            data-testid={`button-delete-table-${table.tableNumber}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {table.capacity && (
                        <p className="text-xs text-muted-foreground mb-1.5">{table.capacity} nəfər</p>
                      )}
                      <Badge
                        className={`text-xs w-full justify-center ${table.status === "occupied" ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"}`}
                        data-testid={`badge-table-status-${table.tableNumber}`}
                      >
                        {table.status === "occupied" ? t("rm.tableOccupied") : t("rm.tableEmpty")}
                      </Badge>
                      {table.status === "occupied" && table.activeOrders.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {table.activeOrders.slice(0, 2).map(o => (
                            <div key={o.id} className="flex items-center justify-between text-xs">
                              <span className={`px-1.5 py-0.5 rounded-full ${statusColor[o.kitchenStatus]}`}>
                                {o.kitchenStatus === "pending" ? t("rm.statusPending") : o.kitchenStatus === "cooking" ? t("rm.statusCooking") : o.kitchenStatus === "ready" ? t("rm.statusReady") : t("rm.statusDelivered")}
                              </span>
                              <span className="font-medium">{fmt(o.totalCents)}</span>
                            </div>
                          ))}
                          {table.activeOrders.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center">+{table.activeOrders.length - 2} {t("rm.ordersCount")}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Summary row */}
            {restaurantTables.length > 0 && (
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  {t("rm.tableEmpty")}: {restaurantTables.filter(t => t.status === "empty").length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  {t("rm.tableOccupied")}: {restaurantTables.filter(t => t.status === "occupied").length}
                </span>
              </div>
            )}
          </TabsContent>

          {/* ── Settlement Tab ── */}
          <TabsContent value="settlement" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("rm.pendingSettlementNote")}</p>
            {pendingSettlementOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" /><p>{t("rm.allPaid")}</p>
              </div>
            ) : (
              pendingSettlementOrders.map(order => (
                <Card key={order.id} className="border-2 border-rose-200 dark:border-rose-800" data-testid={`card-settle-order-${order.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{order.tableNumber ? `${t("rm.table")} ${order.tableNumber}` : order.roomNumber ? `${t("rm.room")} ${order.roomNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}</p>
                        <p className="text-sm font-medium text-primary mt-1">{fmt(order.totalCents)}</p>
                      </div>
                      <Button size="sm" onClick={() => { setShowSettleDialog(order); setSettleType("cash"); }} data-testid={`button-settle-${order.id}`}>
                        <CreditCard className="h-3 w-3 mr-1" />{t("rm.pay")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Kabinetlər Tab ── */}
          <TabsContent value="kabinetler" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("rm.roomsTabNote")}</p>
            {roomOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <UtensilsCrossed className="h-12 w-12 mb-3 opacity-30" /><p>{t("rm.noRoomOrders")}</p>
              </div>
            ) : (
              roomOrders.map(group => (
                <Card key={group.roomNumber} className="border-2 border-violet-200 dark:border-violet-800" data-testid={`card-room-${group.roomNumber}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-violet-600" />{t("rm.room")} {group.roomNumber}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{group.orders.length} {t("rm.ordersCount")}</span>
                        <span className="font-bold text-primary">{fmt(group.totalCents)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    {group.orders.map(o => (
                      <div key={o.id} className="flex items-center justify-between text-sm py-1 border-t">
                        <span className="text-muted-foreground">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true, locale: dateFnsLocale })}</span>
                        <div className="flex items-center gap-2">
                          <span>{fmt(o.totalCents)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[o.kitchenStatus]}`}>
                            {o.kitchenStatus === "pending" ? t("rm.statusPending") : o.kitchenStatus === "cooking" ? t("rm.statusCooking") : o.kitchenStatus === "ready" ? t("rm.statusReady") : t("rm.statusDelivered")}
                          </span>
                          {o.kitchenStatus === "delivered" && (
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { setShowSettleDialog(o); setSettleType("cash"); }}>{t("rm.pay")}</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ── Menu Tab ── */}
          <TabsContent value="menu" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{t("rm.categories")}</h3>
                  <Button size="sm" variant="outline" onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", sortOrder: "0" }); setShowCategoryDialog(true); }} data-testid="button-add-category">
                    <Plus className="h-3 w-3 mr-1" /> {t("rm.add")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`row-category-${cat.id}`}>
                      <span className="font-medium">{cat.name}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openCategoryEdit(cat)} data-testid={`button-edit-cat-${cat.id}`}><Edit2 className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteCategory.mutate(cat.id)} data-testid={`button-delete-cat-${cat.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">{t("rm.noCategories")}</p>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{t("rm.menuItems")}</h3>
                  <Button size="sm" variant="outline" onClick={() => { setEditingItem(null); setItemForm({ name: "", description: "", priceCents: "", categoryId: "" }); setShowItemDialog(true); }} data-testid="button-add-item">
                    <Plus className="h-3 w-3 mr-1" /> {t("rm.add")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`row-item-${item.id}`}>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{fmt(item.priceCents)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!item.isAvailable && <Badge variant="secondary">{t("rm.itemUnavailable")}</Badge>}
                        <Button size="sm" variant="ghost" onClick={() => openItemEdit(item)} data-testid={`button-edit-item-${item.id}`}><Edit2 className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteItem.mutate(item.id)} data-testid={`button-delete-item-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">{t("rm.noMenuItems")}</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Waiters (Qarsonlar) Tab ── */}
          <TabsContent value="waiters" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t("rm.waitersTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("rm.waitersSubtitle")}</p>
              </div>
              <Button size="sm" onClick={() => { setStaffForm(f => ({ ...f, role: "waiter" })); setShowAddStaffDialog(true); }} data-testid="button-add-waiter">
                <UserPlus className="h-4 w-4 mr-1.5" />{t("rm.addWaiter")}
              </Button>
            </div>
            {waiters.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Utensils className="h-12 w-12 mb-3 opacity-30" /><p>{t("rm.noWaiters")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {waiters.map((waiter: any) => {
                  const profile = staffProfiles.find(p => p.userId === waiter.id);
                  const assignedTables = profile?.tablesAssigned ? profile.tablesAssigned.split(",").map(s => s.trim()).filter(Boolean) : [];
                  return (
                    <Card key={waiter.id} data-testid={`card-waiter-${waiter.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {waiter.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{waiter.fullName}</p>
                            <p className="text-xs text-muted-foreground">{waiter.username}</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                              {profile?.salaryAmount && profile.salaryAmount !== "0" && <span>💰 {t("rm.salary")}: {profile.salaryAmount} ₼</span>}
                              {profile?.taxRate && profile.taxRate !== "0" && <span>🧾 {t("rm.tax")}: {profile.taxRate}%</span>}
                              {assignedTables.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-muted-foreground">{t("rm.waiterTablesAssigned")}:</span>
                                  {assignedTables.map(tbl => (
                                    <Badge key={tbl} variant="outline" className="text-xs px-1.5 py-0 h-5">
                                      {tbl}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openWaiterEdit(waiter)} data-testid={`button-edit-waiter-${waiter.id}`}>
                            <Edit2 className="h-3 w-3 mr-1" />{t("rm.edit")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Cleaning Tab ── */}
          <TabsContent value="cleaning" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t("rm.cleaningTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("rm.cleaningSubtitle")}</p>
              </div>
              <Button size="sm" onClick={() => setShowCleaningTaskDialog(true)} data-testid="button-add-cleaning-task">
                <Plus className="h-4 w-4 mr-1.5" />{t("rm.addCleaningTask")}
              </Button>
            </div>
            {cleaningTasks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-3 opacity-30" /><p>{t("rm.noCleaningTasks")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cleaningTasks.map(task => {
                  const assignedWorker = cleaners.find((c: any) => c.id === task.assignedToId);
                  return (
                    <Card key={task.id} data-testid={`card-cleaning-task-${task.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{task.description}</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                              {task.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.location}</span>}
                              {assignedWorker && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{assignedWorker.fullName}</span>}
                              <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: dateFnsLocale })}</span>
                            </div>
                            {task.photoUrl && (
                              <div className="mt-2">
                                <img
                                  src={task.photoUrl}
                                  alt={t("rm.cleaningPhoto")}
                                  className="h-20 w-20 rounded object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setLightboxUrl(task.photoUrl)}
                                  data-testid={`img-cleaning-photo-${task.id}`}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${taskStatusColor[task.status]}`}>
                              {task.status === "pending" ? t("rm.taskStatusPending") : task.status === "in_progress" ? t("rm.taskStatusInProgress") : t("rm.taskStatusDone")}
                            </span>
                            {task.status !== "done" && (
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => updateCleaningTask.mutate({ id: task.id, data: { status: "done" } })}>
                                <CheckSquare className="h-3 w-3 mr-1" />{t("rm.markDone")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Staff (Heyat) Tab ── */}
          <TabsContent value="staff" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t("rm.staffTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("rm.staffSubtitle")}</p>
              </div>
              <Button size="sm" onClick={() => setShowAddStaffDialog(true)} data-testid="button-add-restaurant-staff">
                <UserPlus className="h-4 w-4 mr-1.5" />{t("rm.addStaff")}
              </Button>
            </div>
            {myRestaurantStaff.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-30" /><p>{t("rm.noStaff")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myRestaurantStaff.map((member: any) => {
                  const profile = staffProfiles.find(p => p.userId === member.id);
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-xl" data-testid={`row-restaurant-staff-${member.id}`}>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground">{member.email || member.username}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          {profile?.salaryAmount && profile.salaryAmount !== "0" && <span>💰 {profile.salaryAmount} ₼</span>}
                          {profile?.tablesAssigned && member.role === "waiter" && <span>🍽 {profile.tablesAssigned}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          <Shield className="h-3 w-3 mr-1" />
                          {member.role === "waiter" ? t("rm.roleWaiter") :
                           member.role === "kitchen_staff" ? t("rm.roleKitchen") :
                           member.role === "restaurant_manager" ? t("rm.roleManager") :
                           member.role === "restaurant_cleaner" ? t("rm.roleCleaner") :
                           member.role === "restaurant_cashier" ? t("rm.roleCashier") : member.role}
                        </Badge>
                        {member.role === "waiter" && (
                          <Button size="sm" variant="ghost" onClick={() => openWaiterEdit(member)} data-testid={`button-edit-staff-${member.id}`}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Performance Tab ── */}
          <TabsContent value="performance" className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold">{t("rm.performanceTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("rm.performanceSubtitle")}</p>
            </div>

            {/* Waiter performance */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <Utensils className="h-4 w-4" />{t("rm.waiterPerformance")}
              </h4>
              {waiterPerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("rm.noPerformanceData")}</p>
              ) : (
                <div className="space-y-2">
                  {waiterPerf.map((w, idx) => {
                    const profile = staffProfiles.find(p => p.userId === w.id);
                    const assignedTables = profile?.tablesAssigned ? profile.tablesAssigned.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                    return (
                      <Card key={w.id} className={idx === 0 && w.delivered > 0 ? "border-amber-300 dark:border-amber-700" : ""} data-testid={`card-perf-waiter-${w.id}`}>
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {w.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              {idx === 0 && w.delivered > 0 && (
                                <Trophy className="h-3.5 w-3.5 text-amber-500 absolute -top-1 -right-1" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{w.fullName}</p>
                              {assignedTables.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-0.5">
                                  {assignedTables.map((tbl: string) => (
                                    <Badge key={tbl} variant="outline" className="text-xs px-1.5 py-0 h-4">{tbl}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right space-y-0.5">
                              <p className="text-sm font-semibold">{w.delivered} <span className="text-xs font-normal text-muted-foreground">{t("rm.ordersDelivered")}</span></p>
                              {w.revenue > 0 && <p className="text-xs text-emerald-600 font-medium">{fmt(w.revenue)}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cleaner performance */}
            {cleaners.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />{t("rm.cleanerPerformance")}
                </h4>
                <div className="space-y-2">
                  {cleanerPerf.map((c, idx) => (
                    <Card key={c.id} className={idx === 0 && c.completed > 0 ? "border-blue-300 dark:border-blue-700" : ""} data-testid={`card-perf-cleaner-${c.id}`}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {c.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{c.fullName}</p>
                            <p className="text-xs text-muted-foreground">{c.total} tapşırıq verildi</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-600">{c.completed}</p>
                            <p className="text-xs text-muted-foreground">{t("rm.tasksCompleted")}</p>
                          </div>
                        </div>
                        {c.total > 0 && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.round((c.completed / c.total) * 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-right mt-0.5">{Math.round((c.completed / c.total) * 100)}%</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Finance Tab ── */}
          <TabsContent value="finance" className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">{t("rm.financeTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("rm.financeSubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-emerald-600" /><span className="text-sm text-muted-foreground">{t("rm.monthRevenue")}</span></div>
                  <p className="text-2xl font-bold text-emerald-600">{fmt(analytics?.month?.revenueCents ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{analytics?.month?.orderCount ?? 0} {t("rm.ordersCount")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1"><Banknote className="h-4 w-4 text-blue-600" /><span className="text-sm text-muted-foreground">{t("rm.allTimeRevenue")}</span></div>
                  <p className="text-2xl font-bold text-blue-600">{fmt(analytics?.totalAllTime ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1"><ShoppingBag className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">{t("rm.todayOrders")}</span></div>
                  <p className="text-2xl font-bold">{analytics?.today.orderCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{fmt(analytics?.today.revenueCents ?? 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment type breakdown */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("rm.byPaymentType")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-600" /><span>{t("rm.cash")}</span></div>
                  <span className="font-semibold">{fmt(analytics?.byPaymentType?.cashCents ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><CardIcon className="h-4 w-4 text-blue-600" /><span>{t("rm.card")}</span></div>
                  <span className="font-semibold">{fmt(analytics?.byPaymentType?.cardCents ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><UtensilsCrossed className="h-4 w-4 text-violet-600" /><span>{t("rm.roomCharge")}</span></div>
                  <span className="font-semibold">{fmt(analytics?.byPaymentType?.roomChargeCents ?? 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order status breakdown */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("rm.orderStatusTitle")}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { labelKey: "rm.pending", key: "pending", color: "text-amber-600" },
                    { labelKey: "rm.cooking", key: "cooking", color: "text-blue-600" },
                    { labelKey: "rm.ready", key: "ready", color: "text-emerald-600" },
                    { labelKey: "rm.delivered", key: "delivered", color: "text-slate-500" },
                  ].map(s => (
                    <div key={s.key} className="text-center p-3 border rounded-lg">
                      <p className={`text-2xl font-bold ${s.color}`}>{(analytics?.activeOrders as any)?.[s.key] ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t(s.labelKey)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily history table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("rm.financeHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                {(!analytics?.dailyHistory || analytics.dailyHistory.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("rm.noFinanceHistory")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-start pb-2 font-medium text-muted-foreground">{t("rm.financeDate")}</th>
                          <th className="text-center pb-2 font-medium text-muted-foreground">{t("rm.financeOrders")}</th>
                          <th className="text-end pb-2 font-medium text-muted-foreground">{t("rm.financeRevenue")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.dailyHistory.map((entry) => (
                          <tr key={entry.date} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-2 font-medium">{entry.date}</td>
                            <td className="py-2 text-center text-muted-foreground">{entry.orderCount}</td>
                            <td className="py-2 text-end font-semibold text-emerald-600">{fmt(entry.revenueCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add Table Dialog ── */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent className="sm:max-w-sm" data-testid="dialog-add-table">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" />{t("rm.addTableTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("rm.tableNumber")} *</Label>
              <Input
                placeholder="məs. 1, 2, A1, VIP"
                value={tableForm.tableNumber}
                onChange={e => setTableForm(f => ({ ...f, tableNumber: e.target.value }))}
                data-testid="input-table-number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.tableCapacity")}</Label>
              <Input
                type="number"
                min={1}
                placeholder="məs. 4"
                value={tableForm.capacity}
                onChange={e => setTableForm(f => ({ ...f, capacity: e.target.value }))}
                data-testid="input-table-capacity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTableDialog(false)}>{t("rm.cancel")}</Button>
            <Button
              onClick={() => createTable.mutate({ tableNumber: tableForm.tableNumber, capacity: tableForm.capacity ? parseInt(tableForm.capacity) : null })}
              disabled={createTable.isPending || !tableForm.tableNumber.trim()}
              data-testid="button-save-table"
            >
              {createTable.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rm.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Dialog ── */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent data-testid="dialog-category">
          <DialogHeader><DialogTitle>{editingCategory ? t("rm.editCategoryTitle") : t("rm.addCategoryTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="cat-name">{t("rm.name")}</Label><Input id="cat-name" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} placeholder="məs. Başlanğıclar" data-testid="input-category-name" /></div>
            <div><Label htmlFor="cat-order">{t("rm.sortOrder")}</Label><Input id="cat-order" type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm(f => ({ ...f, sortOrder: e.target.value }))} data-testid="input-category-order" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>{t("rm.cancel")}</Button>
            <Button onClick={handleCategorySubmit} disabled={createCategory.isPending || updateCategory.isPending} data-testid="button-save-category">{editingCategory ? t("rm.update") : t("rm.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Item Dialog ── */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent data-testid="dialog-item">
          <DialogHeader><DialogTitle>{editingItem ? t("rm.editItemTitle") : t("rm.addItemTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="item-name">{t("rm.name")}</Label><Input id="item-name" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="məs. Sezar salatı" data-testid="input-item-name" /></div>
            <div><Label htmlFor="item-desc">{t("rm.description")}</Label><Input id="item-desc" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} placeholder="İstəyə görə" data-testid="input-item-description" /></div>
            <div><Label htmlFor="item-price">Qiymət (₼)</Label><Input id="item-price" type="number" min="0" step="0.01" value={itemForm.priceCents} onChange={e => setItemForm(f => ({ ...f, priceCents: e.target.value }))} placeholder="məs. 15.00" data-testid="input-item-price" /></div>
            <div>
              <Label>{t("rm.categoryLabel")}</Label>
              <Select value={itemForm.categoryId} onValueChange={v => setItemForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger data-testid="select-item-category"><SelectValue placeholder="Kateqoriya seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("rm.categoryNone")}</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>{t("rm.cancel")}</Button>
            <Button onClick={handleItemSubmit} disabled={createItem.isPending || updateItem.isPending} data-testid="button-save-item">{editingItem ? t("rm.update") : t("rm.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settle Dialog ── */}
      <Dialog open={!!showSettleDialog} onOpenChange={() => setShowSettleDialog(null)}>
        <DialogContent data-testid="dialog-settle">
          <DialogHeader><DialogTitle>{t("rm.settleOrder")}</DialogTitle><DialogDescription>{showSettleDialog ? fmt(showSettleDialog.totalCents) : ""}</DialogDescription></DialogHeader>
          <div>
            <Label>{t("rm.paymentType")}</Label>
            <Select value={settleType} onValueChange={setSettleType}>
              <SelectTrigger data-testid="select-settle-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t("rm.cash")}</SelectItem>
                <SelectItem value="card">{t("rm.card")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettleDialog(null)}>{t("rm.cancel")}</Button>
            <Button onClick={() => showSettleDialog && settleOrder.mutate({ id: showSettleDialog.id, paymentType: settleType })} disabled={settleOrder.isPending} data-testid="button-confirm-settle">
              {settleOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rm.pay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Staff Dialog ── */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-add-restaurant-staff">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />{t("rm.addStaffTitle")}</DialogTitle>
            <DialogDescription>{t("rm.addStaffSubtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>{t("rm.fullName")}</Label><Input placeholder="Ali Əliyev" value={staffForm.fullName} onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))} data-testid="input-rs-fullname" /></div>
            <div className="space-y-1.5"><Label>{t("rm.username")}</Label><Input placeholder="ali.aliyev" value={staffForm.username} onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))} data-testid="input-rs-username" /></div>
            <div className="space-y-1.5"><Label>{t("rm.password")}</Label><Input type="password" placeholder="••••••••" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} data-testid="input-rs-password" /></div>
            <div className="space-y-1.5"><Label>{t("rm.email")}</Label><Input type="email" placeholder="ali@restoran.az" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} data-testid="input-rs-email" /></div>
            <div className="space-y-1.5">
              <Label>{t("rm.roleLabel")}</Label>
              <Select value={staffForm.role} onValueChange={v => setStaffForm(f => ({ ...f, role: v, tablesAssigned: "" }))}>
                <SelectTrigger data-testid="select-rs-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">{t("rm.roleWaiter")}</SelectItem>
                  <SelectItem value="kitchen_staff">{t("rm.roleKitchen")}</SelectItem>
                  <SelectItem value="restaurant_cleaner">{t("rm.roleCleaner")}</SelectItem>
                  <SelectItem value="restaurant_cashier">{t("rm.roleCashier")}</SelectItem>
                  <SelectItem value="restaurant_manager">{t("rm.roleManager")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Salary section */}
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Əmək haqqı məlumatları</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.salaryLabel")}</Label>
                  <Input type="number" min={0} step={0.01} placeholder="məs. 600" value={staffForm.baseSalary} onChange={e => setStaffForm(f => ({ ...f, baseSalary: e.target.value }))} data-testid="input-rs-salary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.taxLabel")}</Label>
                  <Input type="number" min={0} max={100} step={0.1} placeholder="məs. 14" value={staffForm.employeeTaxRate} onChange={e => setStaffForm(f => ({ ...f, employeeTaxRate: e.target.value }))} data-testid="input-rs-tax" />
                </div>
              </div>
              {staffForm.baseSalary && (
                <p className="text-xs text-muted-foreground">
                  Xalis maaş: ₼{(parseFloat(staffForm.baseSalary || "0") * (1 - parseFloat(staffForm.employeeTaxRate || "0") / 100)).toFixed(2)}
                  {" "}· Vergi: ₼{(parseFloat(staffForm.baseSalary || "0") * parseFloat(staffForm.employeeTaxRate || "0") / 100).toFixed(2)}
                </p>
              )}
            </div>
            {/* Waiter table assignment */}
            {staffForm.role === "waiter" && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("rm.waiterTablesAssigned")}</p>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.tablesLabel")}</Label>
                  <Input
                    placeholder={t("rm.tablesPlaceholder", "məs. 1,2,3,4")}
                    value={staffForm.tablesAssigned}
                    onChange={e => setStaffForm(f => ({ ...f, tablesAssigned: e.target.value }))}
                    data-testid="input-rs-tables"
                  />
                  <p className="text-xs text-muted-foreground">{t("rm.tablesNote")}</p>
                </div>
                {staffForm.tablesAssigned && (
                  <div className="flex gap-1 flex-wrap">
                    {staffForm.tablesAssigned.split(",").map(t => t.trim()).filter(Boolean).map(tbl => (
                      <Badge key={tbl} variant="secondary" className="text-xs">{tbl}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>{t("rm.cancel")}</Button>
            <Button onClick={() => createStaff.mutate(staffForm)} disabled={createStaff.isPending} data-testid="button-create-restaurant-staff">
              {createStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rm.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Waiter Edit Dialog ── */}
      <Dialog open={!!showWaiterEditDialog} onOpenChange={() => setShowWaiterEditDialog(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-edit-waiter">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 className="h-5 w-5" />{t("rm.editWaiterTitle")}</DialogTitle>
            <DialogDescription>{showWaiterEditDialog?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("rm.salaryLabel")}</Label><Input type="number" placeholder="0" value={waiterProfileForm.salaryAmount} onChange={e => setWaiterProfileForm(f => ({ ...f, salaryAmount: e.target.value }))} data-testid="input-waiter-salary" /></div>
              <div className="space-y-1.5"><Label>{t("rm.taxLabel")}</Label><Input type="number" placeholder="0" value={waiterProfileForm.taxRate} onChange={e => setWaiterProfileForm(f => ({ ...f, taxRate: e.target.value }))} data-testid="input-waiter-tax" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.tablesLabel")}</Label>
              <Input placeholder={t("rm.tablesPlaceholder", "məs. 1, 2, 5, 6")} value={waiterProfileForm.tablesAssigned} onChange={e => setWaiterProfileForm(f => ({ ...f, tablesAssigned: e.target.value }))} data-testid="input-waiter-tables" />
              <p className="text-xs text-muted-foreground">{t("rm.tablesNote")}</p>
            </div>
            {waiterProfileForm.tablesAssigned && (
              <div className="flex gap-1 flex-wrap">
                {waiterProfileForm.tablesAssigned.split(",").map(t => t.trim()).filter(Boolean).map(tbl => (
                  <Badge key={tbl} variant="secondary" className="text-xs">{tbl}</Badge>
                ))}
              </div>
            )}
            <div className="space-y-1.5"><Label>{t("rm.notes")}</Label><Textarea placeholder="İstəyə görə..." value={waiterProfileForm.notes} onChange={e => setWaiterProfileForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="input-waiter-notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaiterEditDialog(null)}>{t("rm.cancel")}</Button>
            <Button onClick={() => showWaiterEditDialog && saveWaiterProfile.mutate({ userId: showWaiterEditDialog.id, data: waiterProfileForm })} disabled={saveWaiterProfile.isPending} data-testid="button-save-waiter-profile">
              {saveWaiterProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rm.update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cleaning Task Dialog ── */}
      <Dialog open={showCleaningTaskDialog} onOpenChange={setShowCleaningTaskDialog}>
        <DialogContent data-testid="dialog-add-cleaning-task">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />{t("rm.addCleaningTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>{t("rm.taskDescLabel")}</Label><Textarea placeholder="məs. Mətbəx döşəməsini sil" value={cleaningForm.description} onChange={e => setCleaningForm(f => ({ ...f, description: e.target.value }))} rows={2} data-testid="input-cleaning-desc" /></div>
            <div className="space-y-1.5"><Label>{t("rm.locationLabel")}</Label><Input placeholder="məs. Mətbəx, Masa 3" value={cleaningForm.location} onChange={e => setCleaningForm(f => ({ ...f, location: e.target.value }))} data-testid="input-cleaning-location" /></div>
            {cleaners.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("rm.assignToLabel")}</Label>
                <Select value={cleaningForm.assignedToId} onValueChange={v => setCleaningForm(f => ({ ...f, assignedToId: v }))}>
                  <SelectTrigger data-testid="select-cleaning-worker"><SelectValue placeholder="İşçi seçin (istəyə görə)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("rm.noCleaner")}</SelectItem>
                    {cleaners.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleaningTaskDialog(false)}>{t("rm.cancel")}</Button>
            <Button onClick={() => createCleaningTask.mutate({ description: cleaningForm.description, location: cleaningForm.location || null, assignedToId: (cleaningForm.assignedToId && cleaningForm.assignedToId !== "none") ? cleaningForm.assignedToId : null })} disabled={createCleaningTask.isPending || !cleaningForm.description} data-testid="button-save-cleaning-task">
              {createCleaningTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rm.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR Code Dialog ── */}
      {qrTableNumber && (
        <Dialog open onOpenChange={() => setQrTableNumber(null)}>
          <DialogContent className="max-w-sm" data-testid="dialog-qr-code">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                {t("rm.qrDialogTitle")} — {t("restaurant.table")} {qrTableNumber}
              </DialogTitle>
              <DialogDescription>{t("rm.qrDialogDesc")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {(() => {
                const guestUrl = `${window.location.origin}/restaurant/guest/${currentUser?.propertyId || "demo"}/table/${qrTableNumber}`;
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(guestUrl)}&color=000000&bgcolor=ffffff&margin=10`;
                return (
                  <>
                    <div className="p-3 bg-white rounded-xl border shadow-sm">
                      <img src={qrApiUrl} alt="QR Code" className="w-[220px] h-[220px] rounded" data-testid="qr-code-image" />
                    </div>
                    <div className="w-full space-y-2">
                      <p className="text-xs text-muted-foreground text-center break-all">{guestUrl}</p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => { navigator.clipboard.writeText(guestUrl); toast({ title: "✓ Link kopyalandı" }); }} data-testid="btn-copy-qr-link">
                        Link Kopyala
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Photo Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxUrl}
              alt={t("restaurant.cleaningPhoto")}
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              data-testid="lightbox-image"
            />
            <button
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black/80 transition-colors"
              onClick={() => setLightboxUrl(null)}
              data-testid="button-close-lightbox"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
