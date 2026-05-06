import { lazy, Suspense, Component } from "react";
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
import { DashboardRouter } from "@/components/dashboard-router";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock as LockIcon } from "lucide-react";
import NotFound from "@/pages/not-found";
import { AIChatWidget } from "@/components/ai-chat-widget";
import '@/lib/i18n';

const Home = lazy(() => import("@/pages/home"));
const Welcome = lazy(() => import("@/pages/welcome"));
const RestaurantLanding = lazy(() => import("@/pages/restaurant-landing"));
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
const DemoLogin = lazy(() => import("@/pages/demo-login"));
const RestaurantRegister = lazy(() => import("@/pages/restaurant-register"));
const RestaurantGuestPage = lazy(() => import("@/pages/restaurant-guest"));

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-destructive text-2xl">!</span>
            </div>
            <p className="text-sm text-muted-foreground">Səhifə yüklənə bilmədi. Yeniləyin.</p>
            <button
              onClick={() => { this.setState({ hasError: false, errorMessage: "" }); window.location.reload(); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Yenilə
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Yüklənir...</p>
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
  { path: "/", component: Home },
  { path: "/hotel", component: Welcome },
  { path: "/restaurant", component: RestaurantLanding },
  { path: "/restaurant/guest/:propertyId/table/:tableNumber", component: RestaurantGuestPage },
  { path: "/login", component: Login },
  { path: "/demo", component: DemoLogin },
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
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {publicRoutes.map(({ path, component: C }) => (
          <Route key={path} path={path} component={C} />
        ))}
        <Route path="/register-hotel">
          <HotelRegister />
        </Route>
        <Route path="/register-restaurant">
          <RestaurantRegister />
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
    </ErrorBoundary>
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
