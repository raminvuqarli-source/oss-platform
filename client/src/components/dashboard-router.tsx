import { lazy } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";

const GuestDashboard = lazy(() => import("@/pages/guest-dashboard"));
const ReceptionDashboard = lazy(() => import("@/pages/reception-dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const HousekeepingDashboard = lazy(() => import("@/pages/housekeeping-dashboard"));
const OwnerDashboard = lazy(() => import("@/pages/owner-dashboard"));
const OnboardingWizard = lazy(() => import("@/pages/onboarding-wizard"));
const OssAdminDashboard = lazy(() => import("@/pages/oss-admin-dashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted mx-auto animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded mx-auto animate-pulse" />
      </div>
    </div>
  );
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

export function DashboardRouter() {
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
