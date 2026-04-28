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
  Users,
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
  DoorOpen,
  CreditCard,
  Zap,
  Lock,
  Thermometer,
  Activity,
  Home,
  Star,
  SprayCan,
  ChefHat,
  UtensilsCrossed,
  Utensils,
  Sparkles,
} from "lucide-react";
import type { Notification } from "@shared/schema";
import { getRoleDisplayName } from "@/lib/permissions";
import { useNotificationAlert } from "@/hooks/use-notification-alert";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UpgradeModal } from "@/components/upgrade-modal";

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
  const { isFeatureEnabled, isDemoMode } = usePlanFeatures();

  useNotificationAlert(notifications as any);

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
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: LayoutDashboard, url: "/dashboard", view: undefined, testId: "nav-dashboard" },
              { title: t("nav.properties", "Properties"), icon: Building2, url: "/dashboard", view: "properties", testId: "nav-properties" },
              { title: t("nav.guests", "Guests"), icon: UserCheck, url: "/dashboard", view: "guests-overview", testId: "nav-guests-overview" },
              { title: t("nav.staff", "Staff"), icon: Users, url: "/dashboard", view: "staff-management", testId: "nav-staff-management", restricted: !isFeatureEnabled("staff_management") },
            ],
          },
          {
            label: t("nav.group.operations", "Operations"),
            items: [
              { title: t("nav.escalations", "Escalations"), icon: AlertTriangle, url: "/dashboard", view: "escalations", testId: "nav-escalations" },
              { title: t("nav.performance", "Performance"), icon: TrendingUp, url: "/dashboard", view: "performance", testId: "nav-performance", restricted: !isFeatureEnabled("advanced_analytics") },
              { title: t("nav.staffPerformance", "Staff Performance"), icon: Star, url: "/dashboard", view: "staff-performance", testId: "nav-staff-performance", restricted: !isFeatureEnabled("staff_management") },
              { title: t("nav.finance", "Finance"), icon: Wallet, url: "/dashboard", view: "finance", testId: "nav-finance" },
            ],
          },
          {
            label: t("nav.group.communication", "Communication"),
            items: [
              { title: t("nav.staffChat", "Staff Chat"), icon: MessageSquare, url: "/dashboard", view: "staff-chat", testId: "nav-staff-chat" },
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
      case "staff":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: Inbox, url: "/dashboard", testId: "nav-dashboard" },
              { title: t("nav.calendar", "Calendar"), icon: CalendarDays, url: "/dashboard?view=calendar", testId: "nav-calendar" },
              { title: t("nav.guests", "Guests"), icon: UserCheck, url: "/guests", testId: "nav-guests" },
            ],
          },
          {
            label: t("nav.group.operations", "Operations"),
            items: [
              { title: t("nav.serviceRequests", "Service Requests"), icon: Wrench, url: "/dashboard?view=requests", testId: "nav-requests" },
              { title: t("nav.tasks", "Tasks"), icon: ClipboardList, url: "/dashboard?view=tasks", testId: "nav-tasks" },
              { title: t("nav.housekeeping", "Housekeeping"), icon: SprayCan, url: "/dashboard?view=housekeeping", testId: "nav-housekeeping" },
              { title: t("nav.roomPrep", "Room Prep"), icon: DoorOpen, url: "/dashboard?view=room-prep", testId: "nav-room-prep" },
              { title: t("nav.roomStatus", "Room Status"), icon: BedDouble, url: "/dashboard?view=room-status", testId: "nav-room-status" },
              { title: t("staffPerformance.myRating", "My Rating"), icon: Star, url: "/dashboard?view=my-performance", testId: "nav-my-performance" },
            ],
          },
          {
            label: t("nav.group.communication", "Communication"),
            items: [
              { title: t("nav.guestMessages", "Guest Messages"), icon: MessageSquare, url: "/dashboard?view=messages", testId: "nav-messages" },
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

      case "admin":
      case "property_manager":
        return [
          {
            label: t("nav.group.core", "Core"),
            items: [
              { title: t("common.dashboard"), icon: BarChart3, url: "/dashboard", testId: "nav-dashboard" },
              { title: t("nav.calendar", "Calendar"), icon: CalendarDays, url: "/dashboard?view=calendar", testId: "nav-calendar" },
              { title: t("nav.guests", "Guests"), icon: UserCheck, url: "/guests", testId: "nav-guests" },
              { title: t("nav.staff", "Staff"), icon: Users, url: "/staff", testId: "nav-staff" },
            ],
          },
          {
            label: t("nav.group.operations", "Operations"),
            items: [
              { title: t("nav.serviceRequests", "Service Requests"), icon: Wrench, url: "/dashboard?view=requests", testId: "nav-requests" },
              { title: t("nav.tasks", "Tasks"), icon: ClipboardList, url: "/dashboard?view=tasks", testId: "nav-tasks" },
              { title: t("nav.housekeeping", "Housekeeping"), icon: SprayCan, url: "/dashboard?view=housekeeping", testId: "nav-housekeeping" },
              { title: t("nav.roomPrep", "Room Prep"), icon: DoorOpen, url: "/dashboard?view=room-prep", testId: "nav-room-prep" },
              { title: t("nav.roomStatus", "Room Status"), icon: BedDouble, url: "/dashboard?view=room-status", testId: "nav-room-status" },
              { title: t("nav.finance", "Finance"), icon: Wallet, url: "/dashboard?view=finance", testId: "nav-finance" },
              { title: t("staffPerformance.myRating", "My Rating"), icon: Star, url: "/dashboard?view=my-performance", testId: "nav-my-performance" },
            ],
          },
          {
            label: "Restaurant",
            items: [
              { title: "Restaurant Management", icon: UtensilsCrossed, url: "/restaurant/manager", testId: "nav-restaurant-manager" },
              { title: "Kitchen Display (KDS)", icon: ChefHat, url: "/restaurant/kitchen", testId: "nav-restaurant-kitchen" },
            ],
          },
          {
            label: t("nav.group.communication", "Communication"),
            items: [
              { title: t("nav.guestMessages", "Guest Messages"), icon: MessageSquare, url: "/dashboard?view=messages", testId: "nav-messages" },
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
            label: "Restaurant",
            items: [
              { title: "Restaurant Management", icon: UtensilsCrossed, url: "/restaurant/manager", testId: "nav-restaurant-manager" },
              { title: "Kitchen Display (KDS)", icon: ChefHat, url: "/restaurant/kitchen", testId: "nav-restaurant-kitchen" },
              { title: "Waiter View", icon: Utensils, url: "/restaurant/waiter", testId: "nav-restaurant-waiter" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "kitchen_staff":
        return [
          {
            label: "Kitchen",
            items: [
              { title: "Kitchen Display (KDS)", icon: ChefHat, url: "/restaurant/kitchen", testId: "nav-kitchen-display" },
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
            label: "Restaurant",
            items: [
              { title: "Sifarişlər", icon: Utensils, url: "/restaurant/waiter", testId: "nav-waiter-orders" },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
              { title: t("common.settings"), icon: Settings, url: "/settings", testId: "nav-settings" },
            ],
          },
        ];

      case "restaurant_cleaner":
        return [
          {
            label: "Temizlik",
            items: [
              { title: "Temizlik Tapşırıqları", icon: Sparkles, url: "/restaurant/cleaner", testId: "nav-restaurant-cleaner" },
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
              { title: t("nav.myBooking", "My Booking"), icon: BedDouble, url: "/dashboard", testId: "nav-dashboard" },
              { title: t("nav.services", "Services"), icon: Wrench, url: "/dashboard?view=services", testId: "nav-services" },
              { title: t("nav.messages", "Messages"), icon: MessageSquare, url: "/dashboard?view=messages", testId: "nav-messages" },
              { title: t("nav.smartRoom", "Smart Room"), icon: Zap, url: "/dashboard?view=room-controls", testId: "nav-room-controls", restricted: (user?.role === "guest" && !isDemoMode) || !isFeatureEnabled("smart_controls") },
            ],
          },
          {
            label: t("nav.group.system", "System"),
            items: [
              { title: t("common.notifications"), icon: Bell, url: "/notifications", badge: unreadCount, testId: "nav-notifications" },
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

  const handleNavClick = (item: MenuItem) => {
    if (item.url.includes("?view=")) {
      navigate(item.url);
    } else if ("view" in item && item.view !== undefined) {
      navigate(`/dashboard?view=${item.view}`);
    } else {
      navigate(item.url);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (<>
    <Sidebar collapsible="icon" side={document.documentElement.dir === "rtl" ? "right" : "left"}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-pointer"
              onClick={() => {
                navigate("/dashboard");
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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
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
                        className="cursor-pointer"
                        data-testid={item.testId}
                        onClick={() => handleNavClick(item)}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge variant="default" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
                      <span>{user?.role ? getRoleDisplayName(user.role as any, t) : ""}</span>
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
      if (user.role === "reception" || user.role === "staff") return t("dashboard.reception.title");
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

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full flex-col sm:flex-row">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:p-4 border-b">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
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
          <main className="flex-1 overflow-auto p-3 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
