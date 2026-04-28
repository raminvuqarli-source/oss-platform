// Role-based permission system: defines access rules for guest, reception, admin, property_manager, owner_admin, oss_super_admin

export type UserRole = "guest" | "reception" | "admin" | "oss_super_admin" | "owner_admin" | "property_manager" | "staff";

export const allUnitCategories = ["accommodation", "meeting", "event", "dining", "wellness", "parking", "storage", "common_area"] as const;

export interface Permission {
  canCreateGuests: boolean;
  canEditGuests: boolean;
  canDeleteGuests: boolean;
  canCreateTransactions: boolean;
  canEditTransactions: boolean;
  canVoidTransactions: boolean;
  canViewAnalytics: boolean;
  canManageStaff: boolean;
  canViewSecurityLogs: boolean;
  canControlRoom: boolean;
  canRequestServices: boolean;
  canChatWithStaff: boolean;
  canChatWithGuests: boolean;
  canViewAllBookings: boolean;
  canViewOwnBooking: boolean;
  canManageProperties: boolean;
  canManageUnits: boolean;
  canManageDevices: boolean;
  canViewOwnerDashboard: boolean;
  canManageSubscription: boolean;
  allowedUnitCategories: string[];
}

const rolePermissions: Record<string, Permission> = {
  guest: {
    canCreateGuests: false,
    canEditGuests: false,
    canDeleteGuests: false,
    canCreateTransactions: false,
    canEditTransactions: false,
    canVoidTransactions: false,
    canViewAnalytics: false,
    canManageStaff: false,
    canViewSecurityLogs: false,
    canControlRoom: true,
    canRequestServices: true,
    canChatWithStaff: true,
    canChatWithGuests: false,
    canViewAllBookings: false,
    canViewOwnBooking: true,
    canManageProperties: false,
    canManageUnits: false,
    canManageDevices: false,
    canViewOwnerDashboard: false,
    canManageSubscription: false,
    allowedUnitCategories: [],
  },
  reception: {
    canCreateGuests: true,
    canEditGuests: true,
    canDeleteGuests: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canVoidTransactions: true,
    canViewAnalytics: false,
    canManageStaff: false,
    canViewSecurityLogs: false,
    canControlRoom: false,
    canRequestServices: false,
    canChatWithStaff: false,
    canChatWithGuests: true,
    canViewAllBookings: true,
    canViewOwnBooking: false,
    canManageProperties: false,
    canManageUnits: false,
    canManageDevices: false,
    canViewOwnerDashboard: false,
    canManageSubscription: false,
    allowedUnitCategories: ["accommodation"],
  },
  staff: {
    canCreateGuests: true,
    canEditGuests: true,
    canDeleteGuests: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canVoidTransactions: true,
    canViewAnalytics: false,
    canManageStaff: false,
    canViewSecurityLogs: false,
    canControlRoom: false,
    canRequestServices: false,
    canChatWithStaff: false,
    canChatWithGuests: true,
    canViewAllBookings: true,
    canViewOwnBooking: false,
    canManageProperties: false,
    canManageUnits: false,
    canManageDevices: false,
    canViewOwnerDashboard: false,
    canManageSubscription: false,
    allowedUnitCategories: ["accommodation"],
  },
  admin: {
    canCreateGuests: false,
    canEditGuests: true,
    canDeleteGuests: true,
    canCreateTransactions: false,
    canEditTransactions: false,
    canVoidTransactions: false,
    canViewAnalytics: true,
    canManageStaff: true,
    canViewSecurityLogs: true,
    canControlRoom: false,
    canRequestServices: false,
    canChatWithStaff: false,
    canChatWithGuests: true,
    canViewAllBookings: true,
    canViewOwnBooking: false,
    canManageProperties: false,
    canManageUnits: true,
    canManageDevices: true,
    canViewOwnerDashboard: false,
    canManageSubscription: false,
    allowedUnitCategories: [...allUnitCategories],
  },
  property_manager: {
    canCreateGuests: true,
    canEditGuests: true,
    canDeleteGuests: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canVoidTransactions: true,
    canViewAnalytics: true,
    canManageStaff: true,
    canViewSecurityLogs: true,
    canControlRoom: false,
    canRequestServices: false,
    canChatWithStaff: false,
    canChatWithGuests: true,
    canViewAllBookings: true,
    canViewOwnBooking: false,
    canManageProperties: false,
    canManageUnits: true,
    canManageDevices: true,
    canViewOwnerDashboard: false,
    canManageSubscription: false,
    allowedUnitCategories: [...allUnitCategories],
  },
  owner_admin: {
    canCreateGuests: true,
    canEditGuests: true,
    canDeleteGuests: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canVoidTransactions: true,
    canViewAnalytics: true,
    canManageStaff: true,
    canViewSecurityLogs: true,
    canControlRoom: false,
    canRequestServices: false,
    canChatWithStaff: false,
    canChatWithGuests: true,
    canViewAllBookings: true,
    canViewOwnBooking: false,
    canManageProperties: true,
    canManageUnits: true,
    canManageDevices: true,
    canViewOwnerDashboard: true,
    canManageSubscription: true,
    allowedUnitCategories: [...allUnitCategories],
  },
  oss_super_admin: {
    canCreateGuests: true,
    canEditGuests: true,
    canDeleteGuests: true,
    canCreateTransactions: true,
    canEditTransactions: true,
    canVoidTransactions: true,
    canViewAnalytics: true,
    canManageStaff: true,
    canViewSecurityLogs: true,
    canControlRoom: false,
    canRequestServices: false,
    canChatWithStaff: false,
    canChatWithGuests: true,
    canViewAllBookings: true,
    canViewOwnBooking: false,
    canManageProperties: true,
    canManageUnits: true,
    canManageDevices: true,
    canViewOwnerDashboard: true,
    canManageSubscription: true,
    allowedUnitCategories: [...allUnitCategories],
  },
};

export function getAllowedCategories(role: string): string[] {
  const perms = getPermissions(role);
  return perms.allowedUnitCategories;
}

export function canManageCategory(role: string, category: string): boolean {
  const allowed = getAllowedCategories(role);
  return allowed.includes(category);
}

export function getPermissions(role: string): Permission {
  return rolePermissions[role] || rolePermissions.guest;
}

export function hasPermission(role: string, permission: keyof Permission): boolean {
  const permissions = getPermissions(role);
  return permissions[permission] === true;
}

export function canAccess(role: string | undefined, requiredRoles: string[]): boolean {
  if (!role) return false;
  return requiredRoles.includes(role);
}

export function getDashboardRoute(role: string): string {
  switch (role) {
    case "oss_super_admin":
      return "/oss-admin";
    case "owner_admin":
      return "/dashboard";
    case "property_manager":
      return "/dashboard";
    case "admin":
      return "/dashboard";
    case "reception":
    case "staff":
      return "/dashboard";
    case "guest":
    default:
      return "/dashboard";
  }
}

export function getRoleDisplayName(role: string, t?: (key: string) => string): string {
  if (t) {
    const key = `roles.${role}`;
    return t(key);
  }
  
  switch (role) {
    case "oss_super_admin":
      return "Super Admin";
    case "owner_admin":
      return "Owner";
    case "property_manager":
      return "Property Manager";
    case "admin":
      return "Administrator";
    case "reception":
      return "Reception Staff";
    case "staff":
      return "Staff";
    case "guest":
      return "Guest";
    case "restaurant_manager":
      return "Restaurant Manager";
    case "waiter":
      return "Waiter";
    case "kitchen_staff":
      return "Kitchen Staff";
    default:
      return role;
  }
}

export function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "oss_super_admin":
    case "owner_admin":
      return "destructive";
    case "property_manager":
    case "admin":
      return "default";
    case "reception":
    case "staff":
      return "secondary";
    case "guest":
    default:
      return "outline";
  }
}
