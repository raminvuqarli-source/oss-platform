import { useQuery } from "@tanstack/react-query";
import type { BusinessFeature, FeatureAccess } from "@shared/planFeatures";
import { useAuth } from "@/lib/auth-context";

interface MeFeaturesResponse {
  planCode: string;
  features: Record<BusinessFeature, FeatureAccess>;
  limits: {
    maxProperties: number;
    maxUnitsPerProperty: number;
    maxStaff: number;
  };
  trialExpired?: boolean;
}

const DEMO_PRO_LIMITS = {
  maxProperties: 999,
  maxUnitsPerProperty: 999,
  maxStaff: 999,
};

export function usePlanFeatures() {
  const { isDemoMode } = useAuth();

  const { data, isLoading } = useQuery<MeFeaturesResponse>({
    queryKey: ["/api/me/features"],
    staleTime: 60000,
    retry: false,
  });

  const hasFeature = (feature: BusinessFeature): FeatureAccess => {
    if (isDemoMode) return true;
    if (!data?.features) return false;
    return data.features[feature] ?? false;
  };

  const isFeatureEnabled = (feature: BusinessFeature): boolean => {
    if (isDemoMode) return true;
    const access = hasFeature(feature);
    return access === true || access === "limited";
  };

  const isFeatureLimited = (feature: BusinessFeature): boolean => {
    if (isDemoMode) return false;
    return hasFeature(feature) === "limited";
  };

  return {
    plan: isDemoMode ? "DEMO_PRO" : (data?.planCode || null),
    planLimits: isDemoMode ? DEMO_PRO_LIMITS : data?.limits,
    trialExpired: isDemoMode ? false : (data?.trialExpired || false),
    isDemoMode,
    hasFeature,
    isFeatureEnabled,
    isFeatureLimited,
    isLoading,
  };
}
