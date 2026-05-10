import { useState } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Building2,
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  Inbox,
  User,
  UserCog,
  Crown,
  ChevronUp,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Wallet,
  AlertTriangle,
  BedDouble,
  Wrench,
  CreditCard,
  Zap,
  Lock,
  Thermometer,
  Activity,
  Home,
  ChefHat,
  UtensilsCrossed,
  Utensils,
  Sparkles,
  GlassWater,
} from "lucide-react";
import type { Notification } from "@shared/schema";
import { getRoleDisplayName } from "@/lib/permissions";
import { useNotificationAlert } from "@/hooks/use-notification-alert";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UpgradeModal } from "@/components/upgrade-modal";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  title: string;
  icon: any;
  url: string;
  view?: string;
  badge?: number;
  testId: string;
  restricted?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

function DashboardSidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const searchString = useSearch();
  const { user, logout } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
  });

  const { data: planData } = useQuery<{ planType: string }>({
    queryKey: ["/api/plan-type"],
    enabled: !!user,
  });
  const planType = planData?.planType || "starter";

  const { data: ownerProfile } = useQuery<{ tenantType?: string }>({
    queryKey: ["/api/owners/me"],
    enabled: !!user && user.role === "owner_admin",
  });
  const isRestaurantOnly = ownerProfile?.tenantType === "restaurant_only";
  const { isFeatureEnabled, isDemoMode } = usePlanFeatures();
  const { toast } = useToast();

  useNotificationAlert(notifications as any, (title, message) => {
    toast({ title, description: message, duration: 5000 });
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const getMenuGroups = (): MenuGroup[] => {
    if (planType === "apartment_lite") {
      if (user?.role === "owner_admin") {
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: Home, url: "/dashboard", view: undefined, testId: "nav-dashboard" },
              { title: t("nav.units", "Units"), icon: Building2, url: "/dashboard", view: "properties", testId: "nav-properties" },
              { title: t("nav.guests", "Guests"), icon: UserCheck, url: "/dashboard", view: "guests-overview", testId: "nav-guests-overview" },
            ],
          },
          {
            label: t("nav.group.controls", "Controls"),
            items: [
              { title: t("nav.lockControl", "Lock Control"), icon: Lock, url: "/dashboard", view: "lock-control", testId: "nav-lock-control" },
              { title: t("nav.temperature", "Temperature"), icon: Thermometer, url: "/dashboard", view: "temperature", testId: "nav-temperature" },
            ],
          },
          {
            label: t("nav.group.communication", "Communication"),
            items: [
              { title: t("nav.chat", "Chat"), icon: MessageSquare, url: "/dashboard", view: "staff-chat", testId: "nav-staff-chat" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("nav.activityLogs", "Activity Logs"), icon: Activity, url: "/dashboard", view: "activity-logs", testId: "nav-activity-logs" },
              { title: t("common.settings"), icon: Settings, url: "/settings", view: undefined, testId: "nav-settings" },
            ],
          },
        ];
      }
      return [
        {
          label: t("nav.group.core", "Core"),
          items: [
            { title: t("nav.lockControl", "Lock Control"), icon: Lock, url: "/dashboard", view: undefined, testId: "nav-dashboard" },
            { title: t("nav.temperature", "Temperature"), icon: Thermometer, url: "/dashboard", view: "temperature", testId: "nav-temperature" },
            { title: t("nav.chat", "Chat"), icon: MessageSquare, url: "/dashboard", view: "messages", testId: "nav-messages" },
          ],
        },
        {
          label: t("nav.group.system", "System"),
          items: [
            { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
          ],
        },
      ];
    }

    switch (user?.role) {
      case "owner_admin":
        if (isRestaurantOnly) {
          return [
            {
              label: t("nav.group.core", "Core"),
              items: [
                { title: t("common.dashboard"), icon: LayoutDashboard, url: "/dashboard", view: undefined, testId: "nav-dashboard" },
              ],
            },
            {
              label: t("nav.group.restaurant", "Restaurant"),
              items: [
                { title: t("nav.managerView", "Manager View"), icon: UtensilsCrossed, url: "/restaurant/manager", testId: "nav-rest-manager" },
                { title: t("nav.kitchenDisplay", "Kitchen Display"), icon: ChefHat, url: "/restaurant/kitchen", testId: "nav-rest-kitchen" },
                { title: t("nav.waiterView", "Waiter View"), icon: Utensils, url: "/restaurant/waiter", testId: "nav-rest-waiter" },
                { title: t("nav.cashierView", "Cashier View"), icon: Wallet, url: "/restaurant/cashier", testId: "nav-rest-cashier" },
                { title: t("nav.restaurantFinance", "Restoran Maliyyəsi"), icon: TrendingUp, url: "/dashboard", view: "restaurant-finance", testId: "nav-rest-finance" },
              ],
            },
            {
              label: t("nav.group.communication", "Communication"),
              items: [
                { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
              ],
            },
            {
              label: t("nav.group.system", "System"),
              items: [
                { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
              ],
            },
          ];
        }
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: LayoutDashboard, url: "/dashboard", view: undefined, testId: "nav-dashboard" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", view: undefined, testId: "nav-settings" },
            ],
          },
        ];

      case "reception":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: Inbox, url: "/dashboard", testId: "nav-dashboard" },
              { title: t("nav.guests", "Guests"), icon: UserCheck, url: "/guests", testId: "nav-guests" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "staff":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: BedDouble, url: "/dashboard", testId: "nav-hk-rooms" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-hk-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "admin":
      case "property_manager":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: BarChart3, url: "/dashboard", testId: "nav-dashboard" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "restaurant_manager":
        return [
          {
            label: t("nav.group.restaurant", "Restaurant"),
            items: [
              { title: t("nav.restaurantManagement", "Restaurant Management"), icon: UtensilsCrossed, url: "/restaurant/manager", testId: "nav-restaurant-manager" },
              { title: t("nav.kitchenDisplay", "Kitchen"), icon: ChefHat, url: "/restaurant/kitchen", testId: "nav-restaurant-kitchen" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "kitchen_staff":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("nav.kitchenDisplay", "Kitchen Display"), icon: ChefHat, url: "/restaurant/kitchen", testId: "nav-kitchen-display" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "waiter":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("nav.waiterOrders", "Orders"), icon: Utensils, url: "/restaurant/waiter", testId: "nav-waiter-orders" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "restaurant_cleaner":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("nav.cleaningTasks", "Cleaning Tasks"), icon: Sparkles, url: "/restaurant/cleaner", testId: "nav-restaurant-cleaner" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "restaurant_cashier":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("nav.cashierTables", "Tables & Bills"), icon: Wallet, url: "/restaurant/cashier", testId: "nav-cashier-tables" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-cashier-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "bar_staff":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("bar.title"), icon: GlassWater, url: "/restaurant/bar", testId: "nav-bar-panel" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-bar-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      default:
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: Home, url: "/dashboard", testId: "nav-dashboard" },
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case "reception":
      case "staff":
        return <UserCog className="h-3 w-3" />;
      case "admin":
      case "property_manager":
        return <Crown className="h-3 w-3" />;
      case "owner_admin":
        return <Building2 className="h-3 w-3" />;
      case "restaurant_manager":
        return <UtensilsCrossed className="h-3 w-3" />;
      case "kitchen_staff":
        return <ChefHat className="h-3 w-3" />;
      case "waiter":
        return <Utensils className="h-3 w-3" />;
      case "restaurant_cleaner":
        return <Sparkles className="h-3 w-3" />;
      case "restaurant_cashier":
        return <Wallet className="h-3 w-3" />;
      case "bar_staff":
        return <GlassWater className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const { isMobile, setOpenMobile } = useSidebar();

  const menuGroups = getMenuGroups();

  const currentSearchParams = new URLSearchParams(searchString);
  const currentView = currentSearchParams.get("view");

  const isItemActive = (item: MenuItem) => {
    if (item.url === "/settings") return location === "/settings";
    if (item.url === "/notifications") return location === "/notifications";
    if (item.url === "/guests") return location === "/guests";
    if (item.url === "/staff") return location === "/staff";

    if (item.url.includes("?view=")) {
      const viewParam = new URL(item.url, "http://x").searchParams.get("view");
      return location === "/dashboard" && currentView === viewParam;
    }

    if ("view" in item && item.view !== undefined) {
      return location === "/dashboard" && currentView === item.view;
    }

    if (item.url === "/dashboard" && !("view" in item && item.view !== undefined) && !item.url.includes("?view=")) {
      return location === "/dashboard" && !currentView;
    }

    return location === item.url;
  };

  const getItemHref = (item: MenuItem) => {
    if (item.url.includes("?view=")) return item.url;
    if ("view" in item && item.view !== undefined) return `/dashboard?view=${item.view}`;
    return item.url;
  };

  const handleNavClick = (item: MenuItem) => {
    navigate(getItemHref(item));
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (<>
    <Sidebar collapsible="icon" side={document.documentElement.dir === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a
                href="/"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                  e.preventDefault();
                  navigate("/");
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">O.S.S</span>
                  <span className="text-xs text-muted-foreground">{t("nav.smartHotel", "Smart Hotel")}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <div className="flex flex-col justify-center h-full py-2">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.testId}>
                    {item.restricted ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className="cursor-pointer opacity-50"
                            data-testid={item.testId}
                            onClick={() => {
                              if (user?.role === "guest") return;
                              setUpgradeFeature(item.title);
                              setUpgradeOpen(true);
                            }}
                          >
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                            <Lock className="size-3 ml-auto text-muted-foreground" />
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {user?.role === "guest"
                            ? t("upgrade.notAvailableGuest", "Not available")
                            : t("upgrade.notIncluded", "Not included in your plan")}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        isActive={isItemActive(item)}
                        data-testid={item.testId}
                        asChild
                      >
                        <a
                          href={getItemHref(item)}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                            e.preventDefault();
                            handleNavClick(item);
                          }}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge variant="default" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </a>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  data-testid="user-menu-trigger"
                >
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarFallback className="rounded-md text-xs">
                      {user?.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.fullName}</span>
                    <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                      {getRoleIcon()}
                      <span>{user?.role ? (isRestaurantOnly && user.role === "owner_admin" ? t("roles.restaurant_owner", "Restaurant Owner") : getRoleDisplayName(user.role as any, t)) : ""}</span>
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-md">
                      <AvatarFallback className="rounded-md text-xs">
                        {user?.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.fullName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        @{user?.username}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigate("/settings");
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t("common.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    logout();
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  data-testid="button-logout-menu"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    <UpgradeModal
      open={upgradeOpen}
      onClose={() => setUpgradeOpen(false)}
      featureName={upgradeFeature}
      currentPlan={planType}
    />
  </>);
}

function MobileBottomNav({ user, t }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; t: ReturnType<typeof useTranslation>["t"] }) {
  const [location] = useLocation();
  const searchString = useSearch();
  const currentView = new URLSearchParams(searchString).get("view");

  const isActive = (url: string, view?: string) => {
    if (url === "/settings") return location === "/settings";
    if (url === "/notifications") return location === "/notifications";
    if (url === "/guests") return location === "/guests";
    if (url === "/staff") return location === "/staff";
    if (view !== undefined) return location === "/dashboard" && currentView === view;
    if (url === "/dashboard" && view === undefined) return location === "/dashboard" && !currentView;
    return location === url;
  };

  type NavItem = { icon: React.ComponentType<{ className?: string }>; label: string; url: string; view?: string; badge?: number };

  const getItems = (): NavItem[] => {
    switch (user.role) {
      case "admin":
      case "property_manager":
        // On the main action dashboard (no ?view=), show only 2 utility items
        if (!currentView) {
          return [
            { icon: Bell, label: t("common.notifications"), url: "/notifications" },
            { icon: Settings, label: t("common.settings"), url: "/settings" },
          ];
        }
        // When a specific view is open, show relevant shortcuts
        return [
          { icon: LayoutDashboard, label: t("common.dashboard"), url: "/dashboard", view: undefined },
          { icon: CalendarDays, label: t("nav.calendar", "Calendar"), url: "/dashboard", view: "calendar" },
          { icon: Wrench, label: t("nav.serviceRequests", "Requests"), url: "/dashboard", view: "requests" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "owner_admin":
        if (!currentView) {
          return [
            { icon: Bell, label: t("common.notifications"), url: "/notifications" },
            { icon: Settings, label: t("common.settings"), url: "/settings" },
          ];
        }
        return [
          { icon: LayoutDashboard, label: t("common.dashboard"), url: "/dashboard", view: undefined },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "reception":
        return [
          { icon: LayoutDashboard, label: t("common.dashboard"), url: "/dashboard", view: undefined },
          { icon: ClipboardList, label: t("nav.tasks", "Tasks"), url: "/dashboard", view: "tasks" },
          { icon: MessageSquare, label: t("nav.messages", "Messages"), url: "/dashboard", view: "messages" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "staff":
        return [
          { icon: LayoutDashboard, label: t("common.dashboard"), url: "/dashboard", view: undefined },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "waiter":
        return [
          { icon: Utensils, label: t("nav.waiterOrders", "Orders"), url: "/restaurant/waiter" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "kitchen_staff":
        return [
          { icon: ChefHat, label: t("nav.kitchenDisplay", "Kitchen"), url: "/restaurant/kitchen" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "restaurant_manager":
        return [
          { icon: UtensilsCrossed, label: t("nav.restaurantManagement", "Orders"), url: "/restaurant/manager" },
          { icon: ChefHat, label: t("nav.kitchenDisplay", "Kitchen"), url: "/restaurant/kitchen" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "restaurant_cleaner":
        return [
          { icon: Sparkles, label: t("nav.cleaningTasks", "Tasks"), url: "/restaurant/cleaner" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "restaurant_cashier":
        return [
          { icon: Wallet, label: t("nav.cashierTables", "Tables"), url: "/restaurant/cashier" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      case "bar_staff":
        return [
          { icon: GlassWater, label: t("bar.title"), url: "/restaurant/bar" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
          { icon: Settings, label: t("common.settings"), url: "/settings" },
        ];
      default:
        return [
          { icon: BedDouble, label: t("nav.myBooking", "My Booking"), url: "/dashboard", view: undefined },
          { icon: Wrench, label: t("nav.services", "Services"), url: "/dashboard", view: "services" },
          { icon: MessageSquare, label: t("nav.messages", "Messages"), url: "/dashboard", view: "messages" },
          { icon: Bell, label: t("common.notifications"), url: "/notifications" },
        ];
    }
  };

  const items = getItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden bg-background border-t border-border shadow-lg">
      {items.map((item) => {
        const active = isActive(item.url, item.view);
        const Icon = item.icon;
        return (
          <button
            key={`${item.url}-${item.view ?? ""}`}
            onClick={() => {
              if (item.view !== undefined) {
                navigate(`/dashboard?view=${item.view}`);
              } else if (item.url === "/dashboard" && item.view === undefined) {
                navigate("/dashboard");
              } else {
                navigate(item.url);
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 gap-0.5 transition-colors ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`mobile-nav-${item.url.replace(/\//g, "-").replace(/\?.*/, "")}-${item.view ?? "home"}`}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] leading-tight truncate max-w-[56px] text-center">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isRtl = document.documentElement.dir === "rtl";
  const style = {
    "--sidebar-width": isRtl ? "18rem" : "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const getPageTitle = () => {
    if (location === "/dashboard") {
      const params = new URLSearchParams(searchString);
      const view = params.get("view");
      if (view) {
        const viewTitles: Record<string, string> = {
          calendar: t("nav.calendar", "Calendar"),
          tasks: t("nav.tasks", "Tasks"),
          messages: t("nav.messages", "Messages"),
          performance: t("nav.performance", "Performance"),
          finance: t("nav.finance", "Finance"),
          properties: t("nav.properties", "Properties"),
          "staff-chat": t("nav.staffChat", "Staff Chat"),
          escalations: t("nav.escalations", "Escalations"),
          "guests-overview": t("nav.guests", "Guests"),
          "staff-management": t("nav.staff", "Staff"),
          requests: t("nav.serviceRequests", "Service Requests"),
          "room-prep": t("nav.roomPrep", "Room Prep"),
          services: t("nav.services", "Services"),
          "room-controls": t("nav.smartRoom", "Smart Room"),
          "staff-performance": t("nav.staffPerformance", "Staff Performance"),
        };
        return viewTitles[view] || t("common.dashboard");
      }
      if (user.role === "guest") return t("dashboard.guest.title");
      if (user.role === "staff") return t("nav.housekeeping", "Housekeeping");
      if (user.role === "reception") return t("dashboard.reception.title");
      if (user.role === "owner_admin") return t("common.dashboard");
      return t("dashboard.admin.title");
    }
    switch (location) {
      case "/notifications":
        return t("common.notifications");
      case "/settings":
        return t("common.settings");
      case "/guests":
        return t("nav.guests", "Guests");
      case "/staff":
        return t("nav.staff", "Staff");
      default:
        return t("common.dashboard");
    }
  };

  if (user.role === "owner_admin" || user.role === "admin" || user.role === "property_manager" || user.role === "staff") {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b shrink-0">
          <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <span className="font-semibold text-sm">O.S.S</span>
          </a>
          <div className="flex items-center gap-2">
            <LanguageSwitcher user={user} />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors" data-testid="owner-topbar-user-menu">
                  <Avatar className="h-7 w-7 rounded-md">
                    <AvatarFallback className="rounded-md text-xs bg-primary/10 text-primary">
                      {user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm truncate">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer" data-testid="owner-menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("common.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/notifications")} className="cursor-pointer" data-testid="owner-menu-notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  {t("common.notifications")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer" data-testid="owner-menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-6 pb-6">
          {children}
        </main>
      </div>
    );
  }

  if (user.role === "guest") {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b shrink-0">
          <div className="flex items-center gap-2">
            <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <span className="font-semibold text-sm">O.S.S</span>
            </a>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher user={user} />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-6 pb-6">
          {children}
        </main>
      </div>
    );
  }

  const startOpen = typeof window !== "undefined" ? window.innerWidth >= 768 : true;

  return (
    <SidebarProvider defaultOpen={startOpen} style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full flex-col sm:flex-row">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:p-4 border-b">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger className="hidden sm:flex" data-testid="button-sidebar-toggle" />
              <h1 className="text-base sm:text-lg font-semibold truncate">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <LanguageSwitcher user={user} />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title={t("common.signOut")}
                data-testid="button-sign-out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-6 bg-background pb-20 sm:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav user={user} t={t} />
    </SidebarProvider>
  );
}
