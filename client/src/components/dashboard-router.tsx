import { lazy, Suspense } from "react";
import { Redirect, useSearch } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";

const GuestDashboard = lazy(() => import("@/pages/guest-dashboard"));
const GuestActionDashboard = lazy(() => import("@/pages/guest-action-dashboard"));
const ReceptionDashboard = lazy(() => import("@/pages/reception-dashboard"));
const ReceptionActionDashboard = lazy(() => import("@/pages/reception-action-dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminActionDashboard = lazy(() => import("@/pages/admin-action-dashboard"));
const HousekeepingDashboard = lazy(() => import("@/pages/housekeeping-dashboard"));
const OwnerDashboard = lazy(() => import("@/pages/owner-dashboard"));
const OnboardingWizard = lazy(() => import("@/pages/onboarding-wizard"));
const OssAdminDashboard = lazy(() => import("@/pages/oss-admin-dashboard"));
const RestaurantOwnerDashboard = lazy(() => import("@/pages/restaurant-owner-dashboard"));

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

function OwnerDashboardRouter() {
  const { data: ownerData, isLoading } = useQuery<{ tenantType?: string }>({
    queryKey: ["/api/owners/me"],
  });

  if (isLoading) return <PageLoader />;

  if (ownerData?.tenantType === "restaurant_only") {
    return <RestaurantOwnerDashboard />;
  }

  return <OwnerDashboardWithOnboarding />;
}

function ReceptionDashboardRouter() {
  const searchString = useSearch();
  const hasView = new URLSearchParams(searchString).has("view");

  if (hasView) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ReceptionDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="flex flex-col h-full">
        <ReceptionActionDashboard />
      </div>
    </Suspense>
  );
}

function AdminDashboardRouter() {
  const searchString = useSearch();
  const hasView = new URLSearchParams(searchString).has("view");

  if (hasView) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="flex flex-col h-full">
        <AdminActionDashboard />
      </div>
    </Suspense>
  );
}

function GuestDashboardRouter() {
  const searchString = useSearch();
  const hasView = new URLSearchParams(searchString).has("view");

  if (hasView) {
    return (
      <Suspense fallback={<PageLoader />}>
        <GuestDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <GuestActionDashboard />
    </Suspense>
  );
}

export function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "reception":
      return <ReceptionDashboardRouter />;
    case "staff":
      return <HousekeepingDashboard />;
    case "admin":
    case "property_manager":
      return <AdminDashboardRouter />;
    case "owner_admin":
      return <OwnerDashboardRouter />;
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
    case "bar_staff":
      return <Redirect to="/restaurant/bar" />;
    case "marketing_staff":
      return <Redirect to="/marketing" />;
    default:
      return <GuestDashboardRouter />;
  }
}
