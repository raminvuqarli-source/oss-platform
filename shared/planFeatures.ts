import type { PlanType, PlanCode } from "./schema";

export type BusinessFeature =
  | "guest_management"
  | "staff_management"
  | "smart_controls"
  | "advanced_analytics"
  | "multi_property"
  | "custom_integrations"
  | "priority_support";

export type FeatureAccess = true | false | "limited";

export interface PlanFeatureConfig {
  features: Record<BusinessFeature, FeatureAccess>;
  limits: {
    maxProperties: number;
    maxUnitsPerProperty: number;
    maxDevices: number;
    maxUsers: number;
    maxStaff: number;
  };
  subscriptionDefaults: {
    maxProperties: number;
    maxStaff: number;
    maxUnitsPerProperty: number;
    multiProperty: boolean;
    performanceEnabled: boolean;
    staffPerformanceEnabled: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
    smartRoomsEnabled: boolean;
    guestManagement: boolean;
    staffManagement: boolean;
  };
}

export const PLAN_FEATURE_MATRIX: Record<PlanType, PlanFeatureConfig> = {
  trial: {
    features: {
      guest_management: true,
      staff_management: false,
      smart_controls: false,
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 1, maxUnitsPerProperty: 50, maxDevices: 20, maxUsers: 10, maxStaff: 0,
    },
    subscriptionDefaults: {
      maxProperties: 1, maxStaff: 0, maxUnitsPerProperty: 50,
      multiProperty: false, performanceEnabled: false, staffPerformanceEnabled: false,
      advancedAnalytics: false, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: true, staffManagement: false,
    },
  },
  basic: {
    features: {
      guest_management: true,
      staff_management: false,
      smart_controls: false,
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 1, maxUnitsPerProperty: 50, maxDevices: 20, maxUsers: 10, maxStaff: 0,
    },
    subscriptionDefaults: {
      maxProperties: 1, maxStaff: 0, maxUnitsPerProperty: 50,
      multiProperty: false, performanceEnabled: false, staffPerformanceEnabled: false,
      advancedAnalytics: false, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: true, staffManagement: false,
    },
  },
  starter: {
    features: {
      guest_management: true,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 1, maxUnitsPerProperty: 20, maxDevices: 20, maxUsers: 10, maxStaff: 5,
    },
    subscriptionDefaults: {
      maxProperties: 1, maxStaff: 5, maxUnitsPerProperty: 20,
      multiProperty: false, performanceEnabled: false, staffPerformanceEnabled: false,
      advancedAnalytics: false, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: true, staffManagement: true,
    },
  },
  growth: {
    features: {
      guest_management: true,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: true,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 3, maxUnitsPerProperty: 30, maxDevices: 50, maxUsers: 25, maxStaff: 20,
    },
    subscriptionDefaults: {
      maxProperties: 3, maxStaff: 20, maxUnitsPerProperty: 30,
      multiProperty: true, performanceEnabled: true, staffPerformanceEnabled: true,
      advancedAnalytics: true, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: true, staffManagement: true,
    },
  },
  pro: {
    features: {
      guest_management: true,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: true,
      custom_integrations: true,
      priority_support: true,
    },
    limits: {
      maxProperties: 999, maxUnitsPerProperty: 999, maxDevices: 999, maxUsers: 999, maxStaff: 999,
    },
    subscriptionDefaults: {
      maxProperties: 999, maxStaff: 999, maxUnitsPerProperty: 999,
      multiProperty: true, performanceEnabled: true, staffPerformanceEnabled: true,
      advancedAnalytics: true, prioritySupport: true, customIntegrations: true,
      smartRoomsEnabled: false, guestManagement: true, staffManagement: true,
    },
  },
  apartment_lite: {
    features: {
      guest_management: true,
      staff_management: false,
      smart_controls: "limited",
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 1, maxUnitsPerProperty: 50, maxDevices: 50, maxUsers: 50, maxStaff: 2,
    },
    subscriptionDefaults: {
      maxProperties: 1, maxStaff: 2, maxUnitsPerProperty: 50,
      multiProperty: false, performanceEnabled: false, staffPerformanceEnabled: false,
      advancedAnalytics: false, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: true, staffManagement: false,
    },
  },
  restaurant_cafe: {
    features: {
      guest_management: false,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 1, maxUnitsPerProperty: 0, maxDevices: 0, maxUsers: 10, maxStaff: 10,
    },
    subscriptionDefaults: {
      maxProperties: 1, maxStaff: 10, maxUnitsPerProperty: 0,
      multiProperty: false, performanceEnabled: false, staffPerformanceEnabled: false,
      advancedAnalytics: false, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: false, staffManagement: true,
    },
  },
  restaurant_bistro: {
    features: {
      guest_management: false,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: {
      maxProperties: 1, maxUnitsPerProperty: 0, maxDevices: 0, maxUsers: 30, maxStaff: 30,
    },
    subscriptionDefaults: {
      maxProperties: 1, maxStaff: 30, maxUnitsPerProperty: 0,
      multiProperty: false, performanceEnabled: true, staffPerformanceEnabled: true,
      advancedAnalytics: true, prioritySupport: false, customIntegrations: false,
      smartRoomsEnabled: false, guestManagement: false, staffManagement: true,
    },
  },
  restaurant_chain: {
    features: {
      guest_management: false,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: true,
      custom_integrations: true,
      priority_support: true,
    },
    limits: {
      maxProperties: 999, maxUnitsPerProperty: 0, maxDevices: 0, maxUsers: 999, maxStaff: 999,
    },
    subscriptionDefaults: {
      maxProperties: 999, maxStaff: 999, maxUnitsPerProperty: 0,
      multiProperty: true, performanceEnabled: true, staffPerformanceEnabled: true,
      advancedAnalytics: true, prioritySupport: true, customIntegrations: true,
      smartRoomsEnabled: false, guestManagement: false, staffManagement: true,
    },
  },
};

export function hasBusinessFeature(planType: PlanType, feature: BusinessFeature): FeatureAccess {
  const config = PLAN_FEATURE_MATRIX[planType];
  if (!config) return false;
  return config.features[feature];
}

export function getPlanLimits(planType: PlanType): PlanFeatureConfig["limits"] {
  const config = PLAN_FEATURE_MATRIX[planType];
  if (!config) return { maxProperties: 1, maxUnitsPerProperty: 50, maxDevices: 20, maxUsers: 10, maxStaff: 0 };
  return config.limits;
}

export function applyPlanFeatures(planType: PlanType): PlanFeatureConfig["subscriptionDefaults"] {
  const config = PLAN_FEATURE_MATRIX[planType];
  if (!config) {
    return PLAN_FEATURE_MATRIX["starter"].subscriptionDefaults;
  }
  return { ...config.subscriptionDefaults };
}

export const ALL_BUSINESS_FEATURES: BusinessFeature[] = [
  "guest_management",
  "staff_management",
  "smart_controls",
  "advanced_analytics",
  "multi_property",
  "custom_integrations",
  "priority_support",
];

export type SmartPlanType = "none" | "smart_lite" | "smart_pro" | "smart_ai";

export type SmartFeature =
  | "light_control"
  | "ac_control"
  | "smart_lock"
  | "pre_checkin"
  | "curtains"
  | "jacuzzi"
  | "welcome_mode"
  | "mood_lighting"
  | "immersive_audio"
  | "smart_mirror"
  | "ai_wakeup"
  | "guest_ai"
  | "energy_monitoring"
  | "smart_scenes"
  | "automation_rules"
  | "ai_energy_optimization"
  | "behavioral_analytics"
  | "auto_temperature"
  | "advanced_iot";

export interface SmartPlanPricing {
  displayName: string;
  priceMonthlyUSD: number;
  priceMonthlyAZN: number;
  currency: string;
  popular: boolean;
}

export const ACTIVE_SMART_PLANS: SmartPlanType[] = ["smart_lite"];
export const COMING_SOON_SMART_PLANS: SmartPlanType[] = ["smart_pro", "smart_ai"];

export function isSmartPlanActive(plan: SmartPlanType): boolean {
  return plan === "none" || ACTIVE_SMART_PLANS.includes(plan);
}

export const SMART_PLAN_PRICING: Record<Exclude<SmartPlanType, "none">, SmartPlanPricing> = {
  smart_lite: { displayName: "Smart Lite", priceMonthlyUSD: 29, priceMonthlyAZN: 49.30, currency: "USD", popular: false },
  smart_pro: { displayName: "Smart Pro", priceMonthlyUSD: 59, priceMonthlyAZN: 100.30, currency: "USD", popular: true },
  smart_ai: { displayName: "Smart AI", priceMonthlyUSD: 99, priceMonthlyAZN: 168.30, currency: "USD", popular: false },
};

export const SMART_PLAN_FEATURES: Record<SmartPlanType, SmartFeature[]> = {
  none: [],
  smart_lite: [
    "light_control",
    "ac_control",
    "smart_lock",
    "pre_checkin",
  ],
  smart_pro: [
    "light_control",
    "ac_control",
    "smart_lock",
    "pre_checkin",
    "energy_monitoring",
    "smart_scenes",
    "curtains",
    "jacuzzi",
    "welcome_mode",
    "mood_lighting",
    "immersive_audio",
    "smart_mirror",
    "automation_rules",
  ],
  smart_ai: [
    "light_control",
    "ac_control",
    "smart_lock",
    "pre_checkin",
    "energy_monitoring",
    "smart_scenes",
    "curtains",
    "jacuzzi",
    "welcome_mode",
    "mood_lighting",
    "immersive_audio",
    "smart_mirror",
    "automation_rules",
    "ai_wakeup",
    "guest_ai",
    "ai_energy_optimization",
    "behavioral_analytics",
    "auto_temperature",
    "advanced_iot",
  ],
};

export function hasSmartFeature(smartPlan: SmartPlanType, feature: SmartFeature): boolean {
  const features = SMART_PLAN_FEATURES[smartPlan];
  if (!features) return false;
  return features.includes(feature);
}

export interface PlanCodeConfig {
  displayName: string;
  priceMonthlyUSD: number;
  priceMonthlyAZN: number;
  currency: "USD";
  features: Record<BusinessFeature, FeatureAccess>;
  limits: {
    maxProperties: number;
    maxUnitsPerProperty: number;
    maxStaff: number;
    maxIntegrations: number;
    maxApiCallsMonthly: number;
  };
}

export const PLAN_CODE_FEATURES: Record<PlanCode, PlanCodeConfig> = {
  CORE_STARTER: {
    displayName: "Starter",
    priceMonthlyUSD: 79,
    priceMonthlyAZN: 134.30,
    currency: "USD",
    features: {
      guest_management: true,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: { maxProperties: 1, maxUnitsPerProperty: 20, maxStaff: 5, maxIntegrations: 1, maxApiCallsMonthly: 1000 },
  },
  CORE_GROWTH: {
    displayName: "Growth",
    priceMonthlyUSD: 129,
    priceMonthlyAZN: 219.30,
    currency: "USD",
    features: {
      guest_management: true,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: true,
      custom_integrations: false,
      priority_support: false,
    },
    limits: { maxProperties: 3, maxUnitsPerProperty: 30, maxStaff: 20, maxIntegrations: 5, maxApiCallsMonthly: 10000 },
  },
  CORE_PRO: {
    displayName: "Pro",
    priceMonthlyUSD: 199,
    priceMonthlyAZN: 338.30,
    currency: "USD",
    features: {
      guest_management: true,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: true,
      custom_integrations: true,
      priority_support: true,
    },
    limits: { maxProperties: 999, maxUnitsPerProperty: 999, maxStaff: 999, maxIntegrations: 999, maxApiCallsMonthly: 100000 },
  },
  APARTMENT_LITE: {
    displayName: "Apartment Lite",
    priceMonthlyUSD: 50,
    priceMonthlyAZN: 85.00,
    currency: "USD",
    features: {
      guest_management: true,
      staff_management: false,
      smart_controls: "limited",
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: { maxProperties: 1, maxUnitsPerProperty: 50, maxStaff: 2, maxIntegrations: 1, maxApiCallsMonthly: 500 },
  },
  REST_CAFE: {
    displayName: "Cafe",
    priceMonthlyUSD: 79,
    priceMonthlyAZN: 134.30,
    currency: "USD",
    features: {
      guest_management: false,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: false,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: { maxProperties: 1, maxUnitsPerProperty: 0, maxStaff: 10, maxIntegrations: 1, maxApiCallsMonthly: 500 },
  },
  REST_BISTRO: {
    displayName: "Bistro",
    priceMonthlyUSD: 129,
    priceMonthlyAZN: 219.30,
    currency: "USD",
    features: {
      guest_management: false,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: false,
      custom_integrations: false,
      priority_support: false,
    },
    limits: { maxProperties: 1, maxUnitsPerProperty: 0, maxStaff: 30, maxIntegrations: 3, maxApiCallsMonthly: 5000 },
  },
  REST_CHAIN: {
    displayName: "Chain",
    priceMonthlyUSD: 199,
    priceMonthlyAZN: 338.30,
    currency: "USD",
    features: {
      guest_management: false,
      staff_management: true,
      smart_controls: false,
      advanced_analytics: true,
      multi_property: true,
      custom_integrations: true,
      priority_support: true,
    },
    limits: { maxProperties: 999, maxUnitsPerProperty: 0, maxStaff: 999, maxIntegrations: 999, maxApiCallsMonthly: 100000 },
  },
};
