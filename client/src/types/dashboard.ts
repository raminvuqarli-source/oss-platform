export interface OssAdminStats {
  total: number;
  newLast7Days: number;
  byStatus: Record<string, number>;
  byCountry: Record<string, number>;
}

export interface RoomPrepAnalyticsData {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  byOccasion: Record<string, number>;
  byAddOn: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface PlatformStats {
  totalOwners: number;
  totalProperties: number;
  totalRooms: number;
  totalUsers: number;
  activeSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  totalStaff: number;
}

export interface CustomerSummary {
  ownerId: string;
  companyName: string;
  email: string;
  fullName: string;
  propertyCount: number;
  totalRooms: number;
  plan: string;
  subscriptionActive: boolean;
  status: string;
  createdAt: string | null;
}

export interface CustomerDetail {
  owner: {
    id: string;
    companyName: string;
    referralSource: string | null;
    referralStaffId: string | null;
    referralNotes: string | null;
    [key: string]: any;
  };
  referralStaffName: string | null;
  user: { fullName: string; email: string; username: string; createdAt: string | null };
  properties: { id: string; name: string; type: string; totalUnits: number; city: string; country: string }[];
  subscription: any;
  billingInfo: any;
  staffCount: number;
  recentActivity: any[];
}

export interface SubscriptionRow {
  subscriptionId: string;
  ownerId: string;
  companyName: string;
  email: string;
  planType: string;
  isActive: boolean;
  createdAt: string | null;
}
