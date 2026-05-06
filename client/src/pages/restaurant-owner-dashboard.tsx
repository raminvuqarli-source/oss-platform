import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import {
  UtensilsCrossed, TrendingUp, ShoppingBag, Users, CreditCard,
  BarChart3, Clock, CheckCircle, ChefHat, Wallet, LogOut,
  RefreshCw, Plus, Utensils, Settings, Package,
  PhoneCall, Mail, Copy, ExternalLink, UserPlus, Loader2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useAuth } from "@/lib/auth-context";

const CONTACT_EMAIL = "support@ossaiproapp.com";

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
            href={`https://wa.me/994502888402?text=${encodeURIComponent(subject)}`}
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

function fmt(cents: number) {
  return `${(cents / 100).toFixed(2)} ₼`;
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

export default function RestaurantOwnerDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [contactDialog, setContactDialog] = useState<{ open: boolean; subject: string }>({ open: false, subject: "" });
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: "", username: "", password: "", email: "", role: "waiter", baseSalary: "", employeeTaxRate: "", tablesAssigned: "" });

  const payNowMutation = useMutation({
    mutationFn: async (planCode: string) => {
      const res = await apiRequest("POST", "/api/epoint/create-order", { planCode });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({ title: t("billing.paymentInitiated", "Redirecting to payment...") });
      }
    },
    onError: (err: any) => showErrorToast(toast, err),
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("POST", "/api/admin/create-staff", data);
      return res.json();
    },
    onSuccess: async (newUser: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
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

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<Analytics>({
    queryKey: ["/api/restaurant/analytics"],
    refetchInterval: 30000,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 15000,
  });

  const { data: menuData, isLoading: menuLoading } = useQuery<MenuData>({
    queryKey: ["/api/restaurant/menu"],
  });

  const { data: staffData, isLoading: staffLoading } = useQuery<{ users: Array<{ id: string; fullName: string; role: string; email?: string }> }>({
    queryKey: ["/api/staff"],
  });

  const { data: subscriptionData } = useQuery<{ planType: string; planCode: string; status: string; trialEndsAt?: string; isTrial?: boolean; remainingDays?: number }>({
    queryKey: ["/api/subscription/status"],
  });

  const { data: ownerData } = useQuery<{ name: string; email: string; tenantType: string }>({
    queryKey: ["/api/owners/me"],
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.kitchenStatus) || o.settlementStatus === "pending");
  const menuItems = menuData?.items || [];
  const staffUsers = staffData?.users || (Array.isArray(staffData) ? staffData as any[] : []);
  const restaurantStaff = staffUsers.filter((u: any) => ["waiter", "kitchen_staff", "restaurant_manager", "restaurant_cashier", "restaurant_cleaner"].includes(u.role));

  const PLAN_NAMES: Record<string, string> = {
    REST_CAFE: "Cafe",
    REST_BISTRO: "Bistro",
    REST_CHAIN: "Chain",
  };
  const planName = PLAN_NAMES[subscriptionData?.planCode || ""] || subscriptionData?.planCode || "—";

  return (
    <div className="min-h-screen bg-background">
      <RestaurantContactDialog
        open={contactDialog.open}
        onClose={() => setContactDialog({ open: false, subject: "" })}
        subject={contactDialog.subject}
      />

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-owner-add-staff">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("rm.addStaffTitle", "Add Staff Member")}
            </DialogTitle>
            <DialogDescription>{t("rm.addStaffSubtitle", "Create a new login for your restaurant team")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("rm.fullName", "Full Name")}</Label>
              <Input placeholder="Ali Əliyev" value={staffForm.fullName} onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))} data-testid="input-owner-rs-fullname" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.username", "Username")}</Label>
              <Input placeholder="ali.aliyev" value={staffForm.username} onChange={e => setStaffForm(f => ({ ...f, username: e.target.value }))} data-testid="input-owner-rs-username" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.password", "Password")}</Label>
              <Input type="password" placeholder="••••••••" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} data-testid="input-owner-rs-password" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.email", "Email")}</Label>
              <Input type="email" placeholder="ali@restoran.az" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} data-testid="input-owner-rs-email" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rm.roleLabel", "Role")}</Label>
              <Select value={staffForm.role} onValueChange={v => setStaffForm(f => ({ ...f, role: v, tablesAssigned: "" }))}>
                <SelectTrigger data-testid="select-owner-rs-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">{t("rm.roleWaiter", "Waiter")}</SelectItem>
                  <SelectItem value="kitchen_staff">{t("rm.roleKitchen", "Kitchen Staff")}</SelectItem>
                  <SelectItem value="restaurant_cleaner">{t("rm.roleCleaner", "Cleaner")}</SelectItem>
                  <SelectItem value="restaurant_cashier">{t("rm.roleCashier", "Cashier")}</SelectItem>
                  <SelectItem value="restaurant_manager">{t("rm.roleManager", "Manager")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("rm.salarySection", "Salary Info")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.salaryLabel", "Base Salary (₼)")}</Label>
                  <Input type="number" min={0} step={0.01} placeholder="600" value={staffForm.baseSalary} onChange={e => setStaffForm(f => ({ ...f, baseSalary: e.target.value }))} data-testid="input-owner-rs-salary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.taxLabel", "Tax Rate (%)")}</Label>
                  <Input type="number" min={0} max={100} step={0.1} placeholder="14" value={staffForm.employeeTaxRate} onChange={e => setStaffForm(f => ({ ...f, employeeTaxRate: e.target.value }))} data-testid="input-owner-rs-tax" />
                </div>
              </div>
              {staffForm.baseSalary && (
                <p className="text-xs text-muted-foreground">
                  {t("rm.netSalary", "Net")}: ₼{(parseFloat(staffForm.baseSalary || "0") * (1 - parseFloat(staffForm.employeeTaxRate || "0") / 100)).toFixed(2)}
                  {" · "}{t("rm.taxAmount", "Tax")}: ₼{(parseFloat(staffForm.baseSalary || "0") * parseFloat(staffForm.employeeTaxRate || "0") / 100).toFixed(2)}
                </p>
              )}
            </div>
            {staffForm.role === "waiter" && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("rm.waiterTablesAssigned", "Table Assignment")}</p>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("rm.tablesLabel", "Tables")}</Label>
                  <Input
                    placeholder={t("rm.tablesPlaceholder", "e.g. 1,2,3,4")}
                    value={staffForm.tablesAssigned}
                    onChange={e => setStaffForm(f => ({ ...f, tablesAssigned: e.target.value }))}
                    data-testid="input-owner-rs-tables"
                  />
                  <p className="text-xs text-muted-foreground">{t("rm.tablesNote", "Comma-separated table numbers")}</p>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>{t("rm.cancel", "Cancel")}</Button>
            <Button
              onClick={() => createStaffMutation.mutate(staffForm)}
              disabled={createStaffMutation.isPending || !staffForm.fullName || !staffForm.username || !staffForm.password}
              data-testid="button-owner-create-staff"
            >
              {createStaffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("rm.create", "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">{ownerData?.name || user?.fullName}</h1>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs h-4 px-1.5">
                  O.S.S POS — {planName}
                </Badge>
                {subscriptionData?.isTrial && (
                  <Badge variant="secondary" className="text-xs h-4 px-1.5">
                    {t("restaurantOwner.trialDays", "Trial: {{days}} days left", { days: subscriptionData.remainingDays })}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetchOrders()} data-testid="button-refresh-orders">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs" data-testid="tab-overview">
              <BarChart3 className="h-3.5 w-3.5" /> {t("restaurantOwner.tabOverview", "Overview")}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1.5 text-xs" data-testid="tab-orders">
              <ShoppingBag className="h-3.5 w-3.5" /> {t("restaurantOwner.tabOrders", "Orders")}
              {activeOrders.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center">{activeOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-1.5 text-xs" data-testid="tab-menu">
              <Utensils className="h-3.5 w-3.5" /> {t("restaurantOwner.tabMenu", "Menu")}
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-1.5 text-xs" data-testid="tab-staff">
              <Users className="h-3.5 w-3.5" /> {t("restaurantOwner.tabStaff", "Staff")}
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1.5 text-xs" data-testid="tab-billing">
              <CreditCard className="h-3.5 w-3.5" /> {t("restaurantOwner.tabBilling", "Billing")}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: TrendingUp,
                    label: t("restaurantOwner.statTodayRevenue", "Today's Revenue"),
                    value: analyticsLoading ? "..." : fmt(analytics?.today?.revenueCents ?? 0),
                    sub: `${analytics?.today?.orderCount ?? 0} ${t("restaurantOwner.orders", "orders")}`,
                    color: "text-green-500",
                    bg: "bg-green-500/10",
                    testId: "stat-today-revenue",
                  },
                  {
                    icon: Wallet,
                    label: t("restaurantOwner.statMonthRevenue", "Month Revenue"),
                    value: analyticsLoading ? "..." : fmt(analytics?.month?.revenueCents ?? 0),
                    sub: `${analytics?.month?.orderCount ?? 0} ${t("restaurantOwner.orders", "orders")}`,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    testId: "stat-month-revenue",
                  },
                  {
                    icon: Clock,
                    label: t("restaurantOwner.statActiveOrders", "Active Orders"),
                    value: analyticsLoading ? "..." : String((analytics?.activeOrders?.pending ?? 0) + (analytics?.activeOrders?.cooking ?? 0) + (analytics?.activeOrders?.ready ?? 0)),
                    sub: t("restaurantOwner.pendingSettlement", "{{n}} pending payment", { n: analytics?.pendingSettlement ?? 0 }),
                    color: "text-orange-500",
                    bg: "bg-orange-500/10",
                    testId: "stat-active-orders",
                  },
                  {
                    icon: Package,
                    label: t("restaurantOwner.statMenuItems", "Menu Items"),
                    value: analyticsLoading ? "..." : String(menuItems.length),
                    sub: `${menuItems.filter(i => i.isAvailable).length} ${t("restaurantOwner.available", "available")}`,
                    color: "text-purple-500",
                    bg: "bg-purple-500/10",
                    testId: "stat-menu-items",
                  },
                ].map(stat => (
                  <Card key={stat.testId} data-testid={`card-${stat.testId}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${stat.bg} shrink-0`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold" data-testid={stat.testId}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active orders status */}
              {analytics && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t("restaurantOwner.kitchenStatus", "Kitchen Status")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { key: "pending", label: t("restaurantOwner.statusPending", "Pending"), color: "text-yellow-600", bg: "bg-yellow-500/10", count: analytics.activeOrders.pending },
                        { key: "cooking", label: t("restaurantOwner.statusCooking", "Cooking"), color: "text-orange-600", bg: "bg-orange-500/10", count: analytics.activeOrders.cooking },
                        { key: "ready", label: t("restaurantOwner.statusReady", "Ready"), color: "text-blue-600", bg: "bg-blue-500/10", count: analytics.activeOrders.ready },
                        { key: "delivered", label: t("restaurantOwner.statusDelivered", "Delivered"), color: "text-green-600", bg: "bg-green-500/10", count: analytics.activeOrders.delivered },
                      ].map(s => (
                        <div key={s.key} className={`rounded-lg p-3 text-center ${s.bg}`}>
                          <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick links to roles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("restaurantOwner.quickAccess", "Quick Access")}</CardTitle>
                  <CardDescription>{t("restaurantOwner.quickAccessDesc", "Direct links to role-based views")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { href: "/restaurant/manager", icon: Settings, label: t("restaurantOwner.managerView", "Manager View"), color: "text-primary" },
                      { href: "/restaurant/kitchen", icon: ChefHat, label: t("restaurantOwner.kitchenView", "Kitchen Display"), color: "text-orange-500" },
                      { href: "/restaurant/waiter", icon: Utensils, label: t("restaurantOwner.waiterView", "Waiter View"), color: "text-blue-500" },
                      { href: "/restaurant/cashier", icon: Wallet, label: t("restaurantOwner.cashierView", "Cashier View"), color: "text-green-500" },
                    ].map(link => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center"
                        data-testid={`link-${link.href.replace("/", "").replace("/", "-")}`}
                      >
                        <link.icon className={`h-6 w-6 ${link.color}`} />
                        <span className="text-xs font-medium">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{t("restaurantOwner.recentOrders", "Recent Orders")}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchOrders()} data-testid="button-refresh-orders-tab">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("restaurantOwner.refresh", "Refresh")}
                </Button>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{t("restaurantOwner.noOrders", "No orders yet")}</p>
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
                            <p className="text-sm font-medium">{t("restaurantOwner.table", "Table")} {order.tableNumber || "—"}</p>
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
          </TabsContent>

          {/* MENU TAB */}
          <TabsContent value="menu">
            <div className="space-y-4">
              {menuLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : !menuData?.categories?.length ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Utensils className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-muted-foreground">{t("restaurantOwner.noMenu", "No menu items yet")}</p>
                    <Button className="mt-4" size="sm" onClick={() => window.location.href = "/restaurant/manager"} data-testid="button-go-manager">
                      {t("restaurantOwner.manageMenu", "Manage Menu in Manager View")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                menuData.categories.map(cat => {
                  const catItems = menuItems.filter(i => i.categoryId === cat.id);
                  return (
                    <Card key={cat.id} data-testid={`card-menu-cat-${cat.id}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{cat.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {catItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">{t("restaurantOwner.noItemsInCategory", "No items in this category")}</p>
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
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => window.location.href = "/restaurant/manager"} data-testid="button-full-manager">
                  {t("restaurantOwner.openManagerView", "Open Full Manager View")} →
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* STAFF TAB */}
          <TabsContent value="staff">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">{t("restaurantOwner.staffTitle", "Restaurant Team")}</CardTitle>
                  <CardDescription>{t("restaurantOwner.staffDesc", "Manage your restaurant staff members")}</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddStaffDialog(true)} data-testid="button-manage-staff">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> {t("restaurantOwner.addStaff", "Add Staff")}
                </Button>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : restaurantStaff.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{t("restaurantOwner.noStaff", "No staff members yet")}</p>
                    <p className="text-xs mt-1">{t("restaurantOwner.addStaffHint", "Click \"Add Staff\" above to create your first team member")}</p>
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
                        <Badge variant="secondary" className="text-xs capitalize">{member.role.replace("_", " ")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {t("restaurantOwner.billingTitle", "Current Plan")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                    <div>
                      <p className="font-semibold text-lg">{planName}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {subscriptionData?.status === "trial"
                          ? t("restaurantOwner.trialActive", "Free trial — {{days}} days remaining", { days: subscriptionData.remainingDays })
                          : subscriptionData?.status === "active"
                          ? t("restaurantOwner.planActive", "Active subscription")
                          : subscriptionData?.status || "—"}
                      </p>
                    </div>
                    <Badge variant={subscriptionData?.status === "active" ? "default" : "secondary"} className="capitalize">
                      {subscriptionData?.status || "—"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { code: "REST_CAFE", name: "Standard", price: "$29 / mo", priceAzn: "49.30 ₼", desc: t("restaurantOwner.planCafeDesc", "Up to 10 staff") },
                      { code: "REST_BISTRO", name: "Professional", price: "$49 / mo", priceAzn: "83.30 ₼", desc: t("restaurantOwner.planBistroDesc", "Up to 30 staff + analytics"), popular: true },
                      { code: "REST_CHAIN", name: "Enterprise", price: null, priceAzn: null, desc: t("restaurantOwner.planChainDesc", "Unlimited + multi-location") },
                    ].map(plan => (
                      <div
                        key={plan.code}
                        className={`relative rounded-xl border-2 p-3 text-center ${subscriptionData?.planCode === plan.code ? "border-primary bg-primary/5" : "border-border"}`}
                        data-testid={`card-billing-plan-${plan.code.toLowerCase()}`}
                      >
                        {(plan as any).popular && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-1.5">Most Popular</Badge>}
                        <p className="font-semibold">{plan.name}</p>
                        {plan.price ? (
                          <>
                            <p className="text-lg font-bold mt-1">{plan.price}</p>
                            {plan.priceAzn && <p className="text-xs text-muted-foreground">{plan.priceAzn} / ay</p>}
                          </>
                        ) : (
                          <p className="text-base font-bold mt-1 text-primary">{t("restaurantOwner.contactUs", "Contact Us")}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                        {plan.code === "REST_CHAIN" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full text-xs"
                            onClick={() => setContactDialog({ open: true, subject: "Enterprise Plan — Restaurant Chain" })}
                            data-testid="button-contact-enterprise"
                          >
                            {t("restaurantOwner.contactUs", "Contact Us")}
                          </Button>
                        ) : subscriptionData?.planCode === plan.code ? (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" /> {t("restaurantOwner.currentPlan", "Current")}
                            </div>
                            <Button
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => payNowMutation.mutate(plan.code)}
                              disabled={payNowMutation.isPending}
                              data-testid={`button-pay-now-${plan.code.toLowerCase()}`}
                            >
                              {payNowMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("restaurantOwner.payNow", "Pay Now →")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full text-xs"
                            onClick={() => payNowMutation.mutate(plan.code)}
                            disabled={payNowMutation.isPending}
                            data-testid={`button-upgrade-${plan.code.toLowerCase()}`}
                          >
                            {payNowMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("restaurantOwner.upgradeTo", "Get Started →")}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {t("restaurantOwner.billingContact", "To change plans or get billing support, contact our team.")}
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setContactDialog({ open: true, subject: "Restaurant Billing Support" })} data-testid="button-billing-contact">
                    {t("restaurantOwner.contactSupport", "Contact Support")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
