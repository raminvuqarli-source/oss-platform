import { useState, type ElementType } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/lib/useCurrency";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import {
  UtensilsCrossed, TrendingUp, ShoppingBag, Users, CreditCard,
  BarChart3, Clock, CheckCircle, ChefHat, Wallet, LogOut,
  RefreshCw, Plus, Utensils, Settings, Package,
  PhoneCall, Mail, Copy, ExternalLink, UserPlus, Loader2, QrCode,
  MessageSquare, Send, ArrowLeft, DollarSign, Activity,
  Star, Warehouse,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useAuth } from "@/lib/auth-context";
import { InventoryPanel, InventoryExpenseWidget } from "@/components/inventory-panel";

const CONTACT_EMAIL = "Ramin.v@orange-studio.az";

function RestaurantContactDialog({ open, onClose, subject }: { open: boolean; onClose: () => void; subject: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t("common.copied", "Copied!"), description: CONTACT_EMAIL });
    }).catch(() => {
      toast({ title: CONTACT_EMAIL, description: t("billing.contact.copyManually", "Copy the email address above") });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-primary" />
            {t("billing.contact.dialogTitle", "Contact O.S.S Team")}
          </DialogTitle>
          <DialogDescription>
            {t("billing.contact.dialogDesc", "Send us a message and we'll activate your service within 24 hours.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">{t("billing.contact.subject", "Subject")}: <span className="font-medium text-foreground">{subject}</span></p>
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1 truncate">{CONTACT_EMAIL}</span>
            <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={copyEmail}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <a
            href={`https://wa.me/994504449292?text=${encodeURIComponent(subject)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border bg-green-500/5 border-green-500/30 hover:bg-green-500/10 transition-colors"
          >
            <SiWhatsapp className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{t("billing.contact.whatsapp", "Message us on WhatsApp")}</span>
            <ExternalLink className="h-3.5 w-3.5 text-green-500 ml-auto" />
          </a>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.close", "Close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: t("restaurantOwner.statusPending", "Pending"), className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
    cooking: { label: t("restaurantOwner.statusCooking", "Cooking"), className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
    ready: { label: t("restaurantOwner.statusReady", "Ready"), className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
    delivered: { label: t("restaurantOwner.statusDelivered", "Delivered"), className: "bg-green-500/10 text-green-600 border-green-500/30" },
    cash_paid: { label: t("restaurantOwner.statusPaid", "Paid"), className: "bg-green-500/10 text-green-600 border-green-500/30" },
    card_paid: { label: t("restaurantOwner.statusPaid", "Paid"), className: "bg-green-500/10 text-green-600 border-green-500/30" },
    posted_to_folio: { label: t("restaurantOwner.statusPaid", "Paid"), className: "bg-green-500/10 text-green-600 border-green-500/30" },
    cancelled: { label: t("restaurantOwner.statusCancelled", "Cancelled"), className: "bg-red-500/10 text-red-600 border-red-500/30" },
  };
  const s = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.className}`}>{s.label}</span>;
}

type Analytics = {
  today: { orderCount: number; revenueCents: number };
  month: { orderCount: number; revenueCents: number };
  activeOrders: { pending: number; cooking: number; ready: number; delivered: number };
  pendingSettlement: number;
  totalAllTime: number;
  byPaymentType: { cashCents: number; cardCents: number; roomChargeCents: number };
};

type Order = {
  id: string;
  tableNumber: string | null;
  kitchenStatus: string;
  settlementStatus: string;
  totalCents: number;
  createdAt: string;
  items?: Array<{ name: string; quantity: number }>;
};

type MenuItem = {
  id: string;
  name: string;
  priceCents: number;
  categoryId: string | null;
  isAvailable: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
};

type MenuData = {
  categories: MenuCategory[];
  items: MenuItem[];
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

export default function RestaurantOwnerDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { fmt } = useCurrency();

  const [currentView, setCurrentView] = useState("hub");
  const [contactDialog, setContactDialog] = useState<{ open: boolean; subject: string }>({ open: false, subject: "" });
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: "", username: "", password: "", email: "", role: "waiter", baseSalary: "", employeeTaxRate: "", tablesAssigned: "" });
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");

  const payNowMutation = useMutation({
    mutationFn: async (planCode: string) => {
      const res = await apiRequest("POST", "/api/epoint/create-order", { planCode });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.paymentUrl) window.location.href = data.paymentUrl;
      else showErrorToast(toast, new Error(data?.message || "Payment URL not received"));
    },
    onError: (err: any) => showErrorToast(toast, err),
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("POST", "/api/admin/create-staff", data);
      return res.json();
    },
    onSuccess: async (newUser: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] });
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
      toast({ title: t("rm.staffCreated", "Staff member created!") });
    },
    onError: (err: any) => showErrorToast(toast, err),
  });

  const broadcastMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", "/api/staff-messages/broadcast", { messageText });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-messages/hotel"] });
      setShowBroadcastDialog(false);
      setBroadcastText("");
      toast({ title: t("restaurantOwner.messageSent", "Message sent!"), description: t("restaurantOwner.messageSentDesc", "{{count}} staff members notified", { count: data?.recipientCount ?? 0 }) });
    },
    onError: (err: any) => showErrorToast(toast, err),
  });

  const { data: staffMessages = [] } = useQuery<any[]>({ queryKey: ["/api/staff-messages/hotel"], refetchInterval: 30000 });
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<Analytics>({ queryKey: ["/api/restaurant/analytics"], refetchInterval: 30000 });
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({ queryKey: ["/api/restaurant/orders"], refetchInterval: 15000 });
  const { data: menuData, isLoading: menuLoading } = useQuery<MenuData>({ queryKey: ["/api/restaurant/menu"] });
  const { data: staffData, isLoading: staffLoading } = useQuery<{ users: Array<{ id: string; fullName: string; role: string; email?: string }> }>({ queryKey: ["/api/users/staff"] });
  const { data: subscriptionData } = useQuery<{ planType: string; planCode: string; status: string; trialEndsAt?: string; isTrial?: boolean; remainingDays?: number }>({ queryKey: ["/api/subscription/status"] });
  const { data: ownerData } = useQuery<{ name: string; email: string; tenantType: string }>({ queryKey: ["/api/owners/me"] });

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.kitchenStatus) || o.settlementStatus === "pending");
  const menuItems = menuData?.items || [];
  const staffUsers = staffData?.users || (Array.isArray(staffData) ? staffData as any[] : []);
  const restaurantStaff = staffUsers.filter((u: any) => ["waiter", "kitchen_staff", "restaurant_manager", "restaurant_cashier", "restaurant_cleaner"].includes(u.role));

  const PLAN_NAMES: Record<string, string> = { REST_CAFE: "Cafe", REST_BISTRO: "Bistro", REST_CHAIN: "Chain" };
  const planName = PLAN_NAMES[subscriptionData?.planCode || ""] || subscriptionData?.planCode || "—";

  const isTrial = subscriptionData?.isTrial;
  const trialDays = subscriptionData?.remainingDays ?? 0;

  const navigate = (view: string) => setCurrentView(view);

  const groups: HubGroup[] = [
    {
      label: t("restaurantOwner.hubOps", "Əməliyyatlar"),
      desc: t("restaurantOwner.hubOpsDesc", "Sifarişlər, mətbəx vəziyyəti"),
      headerIcon: Activity,
      headerColor: "text-blue-500",
      items: [
        { icon: ShoppingBag, label: t("restaurantOwner.tabOrders", "Sifarişlər"), badge: activeOrders.length > 0 ? activeOrders.length : undefined, iconBg: "bg-blue-500/10", iconColor: "text-blue-500", action: () => navigate("orders"), testId: "hub-orders" },
        { icon: ChefHat, label: t("restaurantOwner.kitchenStatus", "Mətbəx Vəziyyəti"), iconBg: "bg-orange-500/10", iconColor: "text-orange-500", action: () => navigate("kitchen-status"), testId: "hub-kitchen-status" },
        { icon: RefreshCw, label: t("restaurantOwner.refresh", "Yenilə"), iconBg: "bg-slate-500/10", iconColor: "text-slate-500", action: () => { refetchOrders(); refetchAnalytics(); toast({ title: t("restaurantOwner.refresh", "Yenilə"), description: "Məlumatlar yeniləndi" }); }, testId: "hub-refresh" },
        { icon: QrCode, label: t("restaurantOwner.guestView", "Müştəri Görünüşü"), iconBg: "bg-pink-500/10", iconColor: "text-pink-500", action: () => { if (user?.propertyId) window.open(`/restaurant/guest/${user.propertyId}/table/3`, "_blank"); }, testId: "hub-guest-qr" },
      ],
    },
    {
      label: t("ownerHub.restaurant", "Restoran"),
      desc: t("ownerHub.restaurantDesc", "İdarəetmə, mətbəx, qarson, kassa"),
      headerIcon: UtensilsCrossed,
      headerColor: "text-rose-500",
      items: [
        { icon: Settings, label: t("restaurantOwner.managerView", "Menecer Paneli"), iconBg: "bg-rose-500/10", iconColor: "text-rose-500", action: () => { window.location.href = "/restaurant/manager"; }, testId: "hub-rest-manager" },
        { icon: ChefHat, label: t("restaurantOwner.kitchenView", "Mətbəx (KDS)"), iconBg: "bg-orange-500/10", iconColor: "text-orange-500", action: () => { window.location.href = "/restaurant/kitchen"; }, testId: "hub-rest-kitchen" },
        { icon: Utensils, label: t("restaurantOwner.waiterView", "Qarson Görünüşü"), iconBg: "bg-amber-500/10", iconColor: "text-amber-500", action: () => { window.location.href = "/restaurant/waiter"; }, testId: "hub-rest-waiter" },
        { icon: Wallet, label: t("nav.cashierTables", "Kassa"), iconBg: "bg-green-500/10", iconColor: "text-green-500", action: () => { window.location.href = "/restaurant/cashier"; }, testId: "hub-rest-cashier" },
      ],
    },
    {
      label: t("ownerHub.finance", "Maliyyə"),
      desc: t("restaurantOwner.hubFinanceDesc", "Gəlir, abunəlik, xərclər"),
      headerIcon: DollarSign,
      headerColor: "text-emerald-500",
      items: [
        { icon: TrendingUp, label: t("restaurantOwner.statTodayRevenue", "Bu günün gəliri"), badge: analyticsLoading ? undefined : fmt(analytics?.today?.revenueCents ?? 0), iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", action: () => navigate("finance"), testId: "hub-today-revenue" },
        { icon: BarChart3, label: t("restaurantOwner.statMonthRevenue", "Aylıq Gəlir"), iconBg: "bg-blue-500/10", iconColor: "text-blue-500", action: () => navigate("finance"), testId: "hub-month-revenue" },
        { icon: CreditCard, label: t("restaurantOwner.tabBilling", "Abunəlik"), badge: isTrial ? `${trialDays}g` : undefined, iconBg: "bg-violet-500/10", iconColor: "text-violet-500", action: () => navigate("billing"), testId: "hub-billing" },
        { icon: Warehouse, label: t("inventory.financeTitle", "Anbar Xərcləri"), iconBg: "bg-red-500/10", iconColor: "text-red-500", action: () => navigate("inventory"), testId: "hub-inv-expenses" },
      ],
    },
    {
      label: t("ownerHub.hr", "Komanda"),
      desc: t("restaurantOwner.hubStaffDesc", "Heyət, mesaj, əlavə et"),
      headerIcon: Users,
      headerColor: "text-indigo-500",
      items: [
        { icon: Users, label: t("restaurantOwner.tabStaff", "Heyət"), badge: restaurantStaff.length > 0 ? restaurantStaff.length : undefined, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500", action: () => navigate("staff"), testId: "hub-staff" },
        { icon: UserPlus, label: t("restaurantOwner.addStaff", "Heyət Əlavə Et"), iconBg: "bg-cyan-500/10", iconColor: "text-cyan-500", action: () => setShowAddStaffDialog(true), testId: "hub-add-staff" },
        { icon: MessageSquare, label: t("restaurantOwner.sendMessage", "Mesaj Göndər"), iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", action: () => setShowBroadcastDialog(true), testId: "hub-broadcast" },
        { icon: Star, label: t("restaurantOwner.sentMessages", "Göndərilmiş Mesajlar"), badge: staffMessages.length > 0 ? staffMessages.length : undefined, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", action: () => navigate("staff"), testId: "hub-messages-hist" },
      ],
    },
    {
      label: t("restaurantOwner.tabMenu", "Menyu"),
      desc: t("restaurantOwner.hubMenuDesc", "Məhsullar, kateqoriyalar"),
      headerIcon: Utensils,
      headerColor: "text-amber-500",
      items: [
        { icon: Package, label: t("restaurantOwner.statMenuItems", "Menyu Məhsulları"), badge: menuItems.length > 0 ? menuItems.length : undefined, iconBg: "bg-amber-500/10", iconColor: "text-amber-500", action: () => navigate("menu"), testId: "hub-menu-items" },
        { icon: CheckCircle, label: t("restaurantOwner.available", "Aktiv Məhsullar"), badge: menuItems.filter(i => i.isAvailable).length > 0 ? menuItems.filter(i => i.isAvailable).length : undefined, iconBg: "bg-green-500/10", iconColor: "text-green-500", action: () => navigate("menu"), testId: "hub-menu-available" },
        { icon: Settings, label: t("restaurantOwner.manageMenu", "Menyu İdarəsi"), iconBg: "bg-rose-500/10", iconColor: "text-rose-500", action: () => { window.location.href = "/restaurant/manager"; }, testId: "hub-menu-manage" },
        { icon: Plus, label: t("rm.addTableTitle", "Masa Əlavə Et"), iconBg: "bg-purple-500/10", iconColor: "text-purple-500", action: () => { window.location.href = "/restaurant/manager"; }, testId: "hub-menu-add" },
      ],
    },
    {
      label: t("inventory.title", "Anbar"),
      desc: t("inventory.subtitle", "Stok idarəetmə sistemi"),
      headerIcon: Warehouse,
      headerColor: "text-cyan-500",
      items: [
        { icon: Warehouse, label: t("inventory.title", "Anbar"), iconBg: "bg-cyan-500/10", iconColor: "text-cyan-500", action: () => navigate("inventory"), testId: "hub-inventory" },
        { icon: Package, label: t("inventory.tabStandaloneRestaurant", "Restoran Anbarı"), iconBg: "bg-orange-500/10", iconColor: "text-orange-500", action: () => navigate("inventory"), testId: "hub-inventory-rest" },
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
              { label: t("restaurantOwner.statTodayRevenue", "Bu günün gəliri"), value: analyticsLoading ? "—" : fmt(analytics?.today?.revenueCents ?? 0), color: "text-emerald-500" },
              { label: t("restaurantOwner.statActiveOrders", "Aktiv Sifariş"), value: analyticsLoading ? "—" : String((analytics?.activeOrders?.pending ?? 0) + (analytics?.activeOrders?.cooking ?? 0) + (analytics?.activeOrders?.ready ?? 0)), color: "text-orange-500" },
              { label: t("ownerHub.stats", "Status"), value: isTrial ? `${trialDays}g` : "✓", color: isTrial ? "text-amber-500" : "text-emerald-500" },
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
                    className="relative flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors group"
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

    if (currentView === "orders") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-orders">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
            </Button>
            <h2 className="font-semibold">{t("restaurantOwner.tabOrders", "Sifarişlər")}</h2>
          </div>
          {analytics && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "pending", label: t("restaurantOwner.statusPending", "Gözləyir"), color: "text-yellow-600", bg: "bg-yellow-500/10", count: analytics.activeOrders.pending },
                { key: "cooking", label: t("restaurantOwner.statusCooking", "Bişirilir"), color: "text-orange-600", bg: "bg-orange-500/10", count: analytics.activeOrders.cooking },
                { key: "ready", label: t("restaurantOwner.statusReady", "Hazırdır"), color: "text-blue-600", bg: "bg-blue-500/10", count: analytics.activeOrders.ready },
                { key: "delivered", label: t("restaurantOwner.statusDelivered", "Çatdırıldı"), color: "text-green-600", bg: "bg-green-500/10", count: analytics.activeOrders.delivered },
              ].map(s => (
                <div key={s.key} className={`rounded-xl p-3 text-center ${s.bg} border`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{t("restaurantOwner.recentOrders", "Son Sifarişlər")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetchOrders()} data-testid="button-refresh-orders-tab">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("restaurantOwner.refresh", "Yenilə")}
              </Button>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{t("restaurantOwner.noOrders", "Hələ sifariş yoxdur")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`row-order-${order.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                          {order.tableNumber || "—"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t("restaurantOwner.table", "Masa")} {order.tableNumber || "—"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.kitchenStatus} />
                        <StatusBadge status={order.settlementStatus} />
                        <p className="text-sm font-semibold tabular-nums">{fmt(order.totalCents)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === "kitchen-status") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-kitchen">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
            </Button>
            <h2 className="font-semibold">{t("restaurantOwner.kitchenStatus", "Mətbəx Vəziyyəti")}</h2>
          </div>
          {analytics ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "pending", label: t("restaurantOwner.statusPending", "Gözləyir"), color: "text-yellow-600", bg: "bg-yellow-500/10", count: analytics.activeOrders.pending },
                { key: "cooking", label: t("restaurantOwner.statusCooking", "Bişirilir"), color: "text-orange-600", bg: "bg-orange-500/10", count: analytics.activeOrders.cooking },
                { key: "ready", label: t("restaurantOwner.statusReady", "Hazırdır"), color: "text-blue-600", bg: "bg-blue-500/10", count: analytics.activeOrders.ready },
                { key: "delivered", label: t("restaurantOwner.statusDelivered", "Çatdırıldı"), color: "text-green-600", bg: "bg-green-500/10", count: analytics.activeOrders.delivered },
              ].map(s => (
                <div key={s.key} className={`rounded-2xl p-6 text-center ${s.bg} border`}>
                  <p className={`text-4xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          )}
        </div>
      );
    }

    if (currentView === "finance") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-finance">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
            </Button>
            <h2 className="font-semibold">{t("ownerHub.finance", "Maliyyə")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, label: t("restaurantOwner.statTodayRevenue", "Bu günün gəliri"), value: fmt(analytics?.today?.revenueCents ?? 0), sub: `${analytics?.today?.orderCount ?? 0} sifariş`, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { icon: Wallet, label: t("restaurantOwner.statMonthRevenue", "Aylıq Gəlir"), value: fmt(analytics?.month?.revenueCents ?? 0), sub: `${analytics?.month?.orderCount ?? 0} sifariş`, color: "text-blue-600", bg: "bg-blue-500/10" },
              { icon: Clock, label: t("restaurantOwner.statActiveOrders", "Aktiv Sifarişlər"), value: String((analytics?.activeOrders?.pending ?? 0) + (analytics?.activeOrders?.cooking ?? 0) + (analytics?.activeOrders?.ready ?? 0)), sub: `${analytics?.pendingSettlement ?? 0} ödəniş gözləyir`, color: "text-orange-600", bg: "bg-orange-500/10" },
              { icon: DollarSign, label: t("restaurantOwner.allTimeRevenue", "Ümumi Gəlir"), value: fmt(analytics?.totalAllTime ?? 0), sub: "Bütün vaxtlar", color: "text-violet-600", bg: "bg-violet-500/10" },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg} shrink-0`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <InventoryExpenseWidget scope="standalone-restaurant" accentColor="red" />
        </div>
      );
    }

    if (currentView === "billing") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-billing">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
            </Button>
            <h2 className="font-semibold">{t("restaurantOwner.tabBilling", "Abunəlik")}</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {t("restaurantOwner.billingTitle", "Cari Plan")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                <div>
                  <p className="font-semibold text-lg">{planName}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {subscriptionData?.status === "trial"
                      ? t("restaurantOwner.trialActive", "Pulsuz sınaq — {{days}} gün qalıb", { days: subscriptionData.remainingDays })
                      : subscriptionData?.status === "active"
                      ? t("restaurantOwner.planActive", "Aktiv abunəlik")
                      : subscriptionData?.status || "—"}
                  </p>
                </div>
                <Badge variant={subscriptionData?.status === "active" ? "default" : "secondary"} className="capitalize">
                  {subscriptionData?.status || "—"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: "REST_CAFE", name: "Standard", price: "$29 / mo", priceAzn: "49.30 ₼", desc: t("restaurantOwner.planCafeDesc", "10 işçiyə qədər") },
                  { code: "REST_BISTRO", name: "Professional", price: "$49 / mo", priceAzn: "83.30 ₼", desc: t("restaurantOwner.planBistroDesc", "30 işçi + analitika"), popular: true },
                  { code: "REST_CHAIN", name: "Enterprise", price: null, priceAzn: null, desc: t("restaurantOwner.planChainDesc", "Limitsiz + çox lokasiya") },
                ].map(plan => (
                  <div key={plan.code} className={`relative rounded-xl border-2 p-3 text-center ${subscriptionData?.planCode === plan.code ? "border-primary bg-primary/5" : "border-border"}`} data-testid={`card-billing-plan-${plan.code.toLowerCase()}`}>
                    {(plan as any).popular && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-1.5">Ən Populyar</Badge>}
                    <p className="font-semibold">{plan.name}</p>
                    {plan.price ? (
                      <>
                        <p className="text-lg font-bold mt-1">{plan.price}</p>
                        {plan.priceAzn && <p className="text-xs text-muted-foreground">{plan.priceAzn} / ay</p>}
                      </>
                    ) : (
                      <p className="text-base font-bold mt-1 text-primary">{t("restaurantOwner.contactUs", "Əlaqə")}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                    {plan.code === "REST_CHAIN" ? (
                      <Button size="sm" variant="outline" className="mt-2 w-full text-xs" onClick={() => setContactDialog({ open: true, subject: "Enterprise Plan — Restaurant Chain" })} data-testid="button-contact-enterprise">
                        {t("restaurantOwner.contactUs", "Əlaqə")}
                      </Button>
                    ) : subscriptionData?.planCode === plan.code ? (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> {t("restaurantOwner.currentPlan", "Aktiv")}</div>
                        <Button size="sm" className="w-full text-xs" onClick={() => payNowMutation.mutate(plan.code)} disabled={payNowMutation.isPending} data-testid={`button-pay-now-${plan.code.toLowerCase()}`}>
                          {payNowMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("restaurantOwner.payNow", "Ödə →")}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-2 w-full text-xs" onClick={() => payNowMutation.mutate(plan.code)} disabled={payNowMutation.isPending} data-testid={`button-upgrade-${plan.code.toLowerCase()}`}>
                        {payNowMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("restaurantOwner.payNow", "Ödə →")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setContactDialog({ open: true, subject: "Restaurant Billing Support" })} data-testid="button-billing-contact">
                {t("restaurantOwner.contactSupport", "Dəstək ilə Əlaqə")}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentView === "staff") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-staff">
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
              </Button>
              <h2 className="font-semibold">{t("restaurantOwner.tabStaff", "Heyət")}</h2>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBroadcastDialog(true)} data-testid="button-send-staff-message">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> {t("restaurantOwner.sendMessage", "Mesaj")}
              </Button>
              <Button size="sm" onClick={() => setShowAddStaffDialog(true)} data-testid="button-manage-staff">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> {t("restaurantOwner.addStaff", "Əlavə Et")}
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-4">
              {staffLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : restaurantStaff.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{t("restaurantOwner.noStaff", "Heyət yoxdur")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {restaurantStaff.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`row-staff-${member.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {member.fullName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.fullName}</p>
                          <p className="text-xs text-muted-foreground">{member.email || "—"}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">{member.role.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {staffMessages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {t("restaurantOwner.sentMessages", "Göndərilmiş Mesajlar")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staffMessages.slice(0, 10).map((msg: any) => (
                    <div key={msg.id} className="p-3 rounded-lg border bg-muted/20" data-testid={`row-staff-message-${msg.id}`}>
                      <p className="text-sm">{msg.messageText}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-green-600">{msg.readCount ?? 0} {t("restaurantOwner.read", "oxundu")}</span>
                          <span>·</span>
                          <span>{msg.unreadCount ?? 0} {t("restaurantOwner.unread", "oxunmadı")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (currentView === "menu") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-menu">
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
              </Button>
              <h2 className="font-semibold">{t("restaurantOwner.tabMenu", "Menyu")}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => { window.location.href = "/restaurant/manager"; }} data-testid="button-full-manager">
              {t("restaurantOwner.openManagerView", "Menecer Paneli")} →
            </Button>
          </div>
          {menuLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : !menuData?.categories?.length ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Utensils className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground">{t("restaurantOwner.noMenu", "Hələ menyu yoxdur")}</p>
                <Button className="mt-4" size="sm" onClick={() => { window.location.href = "/restaurant/manager"; }} data-testid="button-go-manager">
                  {t("restaurantOwner.manageMenu", "Menecer Panelində Menyu İdarə Et")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            menuData.categories.map(cat => {
              const catItems = menuItems.filter(i => i.categoryId === cat.id);
              return (
                <Card key={cat.id} data-testid={`card-menu-cat-${cat.id}`}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{cat.name}</CardTitle></CardHeader>
                  <CardContent>
                    {catItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">{t("restaurantOwner.noItemsInCategory", "Bu kateqoriyada məhsul yoxdur")}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20" data-testid={`row-menu-item-${item.id}`}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${item.isAvailable ? "bg-green-500" : "bg-red-400"}`} />
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <span className="text-sm font-semibold">{(item.priceCents / 100).toFixed(2)} ₼</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      );
    }

    if (currentView === "inventory") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("hub")} data-testid="btn-back-inventory">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back", "Geri")}
            </Button>
          </div>
          <InventoryPanel mode="standalone-restaurant" />
        </div>
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <RestaurantContactDialog
        open={contactDialog.open}
        onClose={() => setContactDialog({ open: false, subject: "" })}
        subject={contactDialog.subject}
      />

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]" data-testid="dialog-owner-add-staff">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("rm.addStaffTitle", "Heyət Əlavə Et")}
            </DialogTitle>
            <DialogDescription>{t("rm.addStaffSubtitle", "Restoran komandasına yeni giriş yarat")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            <div className="space-y-1.5">
              <Label>{t("rm.fullName", "Ad Soyad")}</Label>
              <Input placeholder="Ali Əliyev" value={staffForm.fullName} onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))} data-testid="input-owner-rs-fullname" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.username", "İstifadəçi adı")}</Label>
              <Input placeholder="ali.aliyev" value={staffForm.username} onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))} data-testid="input-owner-rs-username" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.password", "Şifrə")}</Label>
              <Input type="password" placeholder="••••••••" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} data-testid="input-owner-rs-password" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.email", "E-poçt")}</Label>
              <Input type="email" placeholder="ali@restoran.az" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} data-testid="input-owner-rs-email" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.roleLabel", "Rol")}</Label>
              <Select value={staffForm.role} onValueChange={v => setStaffForm(f => ({ ...f, role: v, tablesAssigned: "" }))}>
                <SelectTrigger data-testid="select-owner-rs-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">{t("rm.roleWaiter", "Qarson")}</SelectItem>
                  <SelectItem value="kitchen_staff">{t("rm.roleKitchen", "Mətbəx İşçisi")}</SelectItem>
                  <SelectItem value="restaurant_cleaner">{t("rm.roleCleaner", "Təmizlikçi")}</SelectItem>
                  <SelectItem value="restaurant_cashier">{t("rm.roleCashier", "Kassir")}</SelectItem>
                  <SelectItem value="restaurant_manager">{t("rm.roleManager", "Menecer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("rm.salarySection", "Maaş Məlumatı")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.salaryLabel", "Əsas Maaş (₼)")}</Label>
                  <Input type="number" min={0} step={0.01} placeholder="600" value={staffForm.baseSalary} onChange={e => setStaffForm(f => ({ ...f, baseSalary: e.target.value }))} data-testid="input-owner-rs-salary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.taxLabel", "Vergi (%)")}</Label>
                  <Input type="number" min={0} max={100} step={0.1} placeholder="14" value={staffForm.employeeTaxRate} onChange={e => setStaffForm(f => ({ ...f, employeeTaxRate: e.target.value }))} data-testid="input-owner-rs-tax" />
                </div>
              </div>
              {staffForm.baseSalary && (
                <p className="text-xs text-muted-foreground">
                  {t("rm.netSalary", "Xalis")}: ₼{(parseFloat(staffForm.baseSalary || "0") * (1 - parseFloat(staffForm.employeeTaxRate || "0") / 100)).toFixed(2)}
                  {" · "}{t("rm.taxAmount", "Vergi")}: ₼{(parseFloat(staffForm.baseSalary || "0") * parseFloat(staffForm.employeeTaxRate || "0") / 100).toFixed(2)}
                </p>
              )}
            </div>
            {staffForm.role === "waiter" && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("rm.waiterTablesAssigned", "Masa Təyinatı")}</p>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.tablesLabel", "Masalar")}</Label>
                  <Input placeholder={t("rm.tablesPlaceholder", "məs. 1,2,3,4")} value={staffForm.tablesAssigned} onChange={e => setStaffForm(f => ({ ...f, tablesAssigned: e.target.value }))} data-testid="input-owner-rs-tables" />
                  <p className="text-xs text-muted-foreground">{t("rm.tablesNote", "Vergüllə ayrılmış masa nömrələri")}</p>
                </div>
                {staffForm.tablesAssigned && (
                  <div className="flex gap-1 flex-wrap">
                    {staffForm.tablesAssigned.split(",").map(tbl => tbl.trim()).filter(Boolean).map(tbl => (
                      <Badge key={tbl} variant="secondary" className="text-xs">{tbl}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowAddStaffDialog(false)} data-testid="button-owner-cancel-staff">{t("rm.cancel", "Ləğv et")}</Button>
            <Button onClick={() => createStaffMutation.mutate(staffForm)} disabled={createStaffMutation.isPending || !staffForm.fullName || !staffForm.username || !staffForm.password} data-testid="button-owner-create-staff">
              {createStaffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {t("restaurantOwner.addStaff", "Əlavə Et")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Message Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-broadcast-message">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("restaurantOwner.broadcastTitle", "Bütün Heyətə Mesaj Göndər")}
            </DialogTitle>
            <DialogDescription>
              {t("restaurantOwner.broadcastDesc", "Bu mesaj bütün restoran işçilərinə göndəriləcək.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder={t("restaurantOwner.broadcastPlaceholder", "Mesajınızı yazın...")}
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-broadcast-message"
            />
            <p className="text-xs text-muted-foreground">{broadcastText.length}/500 {t("restaurantOwner.characters", "simvol")}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowBroadcastDialog(false); setBroadcastText(""); }} data-testid="button-cancel-broadcast">
              {t("rm.cancel", "Ləğv et")}
            </Button>
            <Button onClick={() => { if (broadcastText.trim()) broadcastMutation.mutate(broadcastText.trim()); }} disabled={!broadcastText.trim() || broadcastMutation.isPending} data-testid="button-confirm-broadcast">
              {broadcastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
              {t("restaurantOwner.sendToAll", "Hamısına Göndər")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView !== "hub" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => navigate("hub")} data-testid="btn-header-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="p-1.5 rounded-lg bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">{ownerData?.name || user?.fullName}</h1>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs h-4 px-1.5">O.S.S POS — {planName}</Badge>
                {subscriptionData?.isTrial && (
                  <Badge variant="secondary" className="text-xs h-4 px-1.5">
                    {t("restaurantOwner.trialDays", "Sınaq: {{days}} gün", { days: subscriptionData.remainingDays })}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { refetchOrders(); refetchAnalytics(); }} data-testid="button-refresh-orders">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
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
    </div>
  );
}
