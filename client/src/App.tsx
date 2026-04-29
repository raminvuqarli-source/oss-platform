import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { useTranslation } from "react-i18next";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock as LockIcon } from "lucide-react";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import { AIChatWidget } from "@/components/ai-chat-widget";
import '@/lib/i18n';

const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const HotelRegister = lazy(() => import("@/pages/hotel-register"));
const GuestDashboard = lazy(() => import("@/pages/guest-dashboard"));
const ReceptionDashboard = lazy(() => import("@/pages/reception-dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const OwnerDashboard = lazy(() => import("@/pages/owner-dashboard"));
const OssAdminDashboard = lazy(() => import("@/pages/oss-admin-dashboard"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Settings = lazy(() => import("@/pages/settings"));
const StaffList = lazy(() => import("@/pages/staff-list"));
const GuestsPage = lazy(() => import("@/pages/guests"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const OnboardingWizard = lazy(() => import("@/pages/onboarding-wizard"));
const BillingPage = lazy(() => import("@/pages/billing"));
const KitchenDisplay = lazy(() => import("@/pages/kitchen-display"));
const WaiterView = lazy(() => import("@/pages/waiter-view"));
const RestaurantManager = lazy(() => import("@/pages/restaurant-manager"));
const RestaurantCleaner = lazy(() => import("@/pages/restaurant-cleaner"));
const MarketingDashboard = lazy(() => import("@/pages/marketing-dashboard"));
const HousekeepingDashboard = lazy(() => import("@/pages/housekeeping-dashboard"));
const RestaurantCashier = lazy(() => import("@/pages/restaurant-cashier-dashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

function TrialExpiredGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { data: trialStatus } = useQuery<{
    planType: string;
    isTrial: boolean;
    remainingDays: number;
    isExpired: boolean;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  if (trialStatus?.isTrial && trialStatus.isExpired) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4" data-testid="trial-expired-guard">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <LockIcon className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">{t("trial.expired")}</h2>
            <p className="text-muted-foreground text-sm">{t("trial.upgradePrompt")}</p>
            <Button onClick={() => { window.location.href = "/owner/billing"; }} data-testid="button-trial-upgrade-guard">
              {t("trial.upgradeNow")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function OwnerDashboardWithOnboarding() {
  const { data: onboarding, isLoading } = useQuery<{ isComplete?: boolean; currentStep?: number }>({
    queryKey: ["/api/onboarding"],
  });

  if (isLoading) return <PageLoader />;

  if (!onboarding?.isComplete) {
    return <OnboardingWizard />;
  }

  return <OwnerDashboard />;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "reception":
      return <ReceptionDashboard />;
    case "staff":
      return <HousekeepingDashboard />;
    case "admin":
    case "property_manager":
      return <AdminDashboard />;
    case "owner_admin":
      return <OwnerDashboardWithOnboarding />;
    case "oss_super_admin":
      return <Redirect to="/oss-admin" />;
    case "kitchen_staff":
      return <Redirect to="/restaurant/kitchen" />;
    case "waiter":
      return <Redirect to="/restaurant/waiter" />;
    case "restaurant_manager":
      return <Redirect to="/restaurant/manager" />;
    case "restaurant_cleaner":
      return <Redirect to="/restaurant/cleaner" />;
    case "restaurant_cashier":
      return <Redirect to="/restaurant/cashier" />;
    case "marketing_staff":
      return <Redirect to="/marketing" />;
    default:
      return <GuestDashboard />;
  }
}

// OSS Super Admin route with strict role check - isolated from tenant dashboards
function OssAdminProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "oss_super_admin") return <Redirect to="/dashboard" />;

  return <OssAdminDashboard />;
}

// Marketing Staff route guard
function MarketingProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "marketing_staff") return <Redirect to="/dashboard" />;
  return <MarketingDashboard />;
}

// Auth guard wrapper: redirects unauthenticated users, wraps content in DashboardLayout
function ProtectedRoute({ component: Component, guardTrial = false, ownerOnly = false }: { component: React.ComponentType; guardTrial?: boolean; ownerOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  if (ownerOnly && user.role !== "owner_admin") return <Redirect to="/dashboard" />;

  const content = guardTrial && user.role === "owner_admin" ? (
    <TrialExpiredGuard>
      <Component />
    </TrialExpiredGuard>
  ) : (
    <Component />
  );

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}

function AuthFallback() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user) return <Redirect to="/dashboard" />;
  return <Redirect to="/login" />;
}

// Public routes accessible without authentication
const JoinTeam = lazy(() => import("@/pages/join-team"));

const publicRoutes = [
  { path: "/", component: Welcome },
  { path: "/login", component: Login },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/reset-password", component: ResetPassword },
  { path: "/register", component: Register },
  { path: "/join-team", component: JoinTeam },
  { path: "/privacy-policy", component: PrivacyPolicy },
  { path: "/terms-of-service", component: TermsOfService },
] as const;

// Protected routes requiring authentication, wrapped in DashboardLayout
const protectedRoutes: { path: string; component: React.ComponentType; guardTrial?: boolean }[] = [
  { path: "/dashboard", component: DashboardRouter },
  { path: "/notifications", component: Notifications, guardTrial: true },
  { path: "/settings", component: Settings, guardTrial: true },
  { path: "/staff", component: StaffList, guardTrial: true },
  { path: "/guests", component: GuestsPage, guardTrial: true },
  { path: "/restaurant/kitchen", component: KitchenDisplay },
  { path: "/restaurant/waiter", component: WaiterView },
  { path: "/restaurant/manager", component: RestaurantManager },
  { path: "/restaurant/cleaner", component: RestaurantCleaner },
  { path: "/restaurant/cashier", component: RestaurantCashier },
];

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {publicRoutes.map(({ path, component: C }) => (
          <Route key={path} path={path} component={C} />
        ))}
        <Route path="/register-hotel">
          <HotelRegister />
        </Route>
        {protectedRoutes.map(({ path, component: C, guardTrial }) => (
          <Route key={path} path={path}>
            <ProtectedRoute component={C} guardTrial={guardTrial} />
          </Route>
        ))}
        <Route path="/owner/billing">
          <ProtectedRoute component={BillingPage} ownerOnly />
        </Route>
        <Route path="/oss-admin">
          <OssAdminProtectedRoute />
        </Route>
        <Route path="/marketing">
          <MarketingProtectedRoute />
        </Route>
        <Route>
          <AuthFallback />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <AIChatWidget />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
