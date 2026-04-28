import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real, index, uniqueIndex, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===================== MULTI-TENANT SaaS TABLES =====================

// Property types
export type PropertyType = "hotel" | "resort" | "villa_complex" | "tiny_house_village" | "apartment_rental" | "glamping";

// Unit categories
export type UnitCategory = "accommodation" | "meeting" | "event" | "dining" | "wellness" | "parking" | "storage" | "common_area";

// Unit types per category
export const unitCategoryTypes: Record<UnitCategory, string[]> = {
  accommodation: ["room", "standard", "deluxe", "suite", "villa", "cabin", "tent", "apartment", "bungalow", "capsule", "a_frame", "tiny_house", "penthouse", "studio"],
  meeting: ["conference_room", "boardroom", "huddle_room", "training_room"],
  event: ["ballroom", "banquet_hall", "outdoor_venue", "terrace"],
  dining: ["restaurant", "bar", "lounge", "cafe", "rooftop_bar"],
  wellness: ["spa_room", "gym", "pool", "sauna", "yoga_studio"],
  parking: ["parking_spot", "garage", "valet_zone"],
  storage: ["luggage_room", "warehouse", "locker"],
  common_area: ["lobby", "coworking", "garden", "playground", "rooftop"],
};

export const unitCategoryLabels: Record<UnitCategory, string> = {
  accommodation: "Accommodation",
  meeting: "Meeting & Conference",
  event: "Event Spaces",
  dining: "Dining & Bars",
  wellness: "Wellness & Fitness",
  parking: "Parking",
  storage: "Storage",
  common_area: "Common Areas",
};

// Legacy type alias
export type UnitType = "room" | "villa" | "tiny_house" | "capsule" | "bungalow" | "apartment" | "cabin" | "a_frame";

// Subscription plans
export type PlanType = "trial" | "basic" | "starter" | "growth" | "pro" | "apartment_lite";

// Plan codes - canonical identifiers for plan tiers
export type PlanCode =
  | "CORE_STARTER"
  | "CORE_GROWTH"
  | "CORE_PRO"
  | "APARTMENT_LITE";

export const PLAN_TYPE_TO_CODE: Record<PlanType, PlanCode> = {
  trial: "CORE_STARTER",
  basic: "CORE_STARTER",
  starter: "CORE_STARTER",
  growth: "CORE_GROWTH",
  pro: "CORE_PRO",
  apartment_lite: "APARTMENT_LITE",
};

// Owners table - top of hierarchy
export const owners = pgTable("owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  companyName: text("company_name"),
  country: text("country"),
  city: text("city"),
  address: text("address"),
  logoUrl: text("logo_url"),
  status: text("status").notNull().default("active"),
  // Business entity fields (for multi-property validation)
  taxId: text("tax_id"),
  legalName: text("legal_name"),
  registrationNumber: text("registration_number"),
  // Marketing referral fields
  referralSource: text("referral_source"),       // google | instagram | event | staff_referral | other
  referralStaffId: varchar("referral_staff_id"), // FK to users.id (marketing staff)
  referralNotes: text("referral_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOwnerSchema = createInsertSchema(owners).omit({
  id: true,
  createdAt: true,
});

export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

// Referral Commissions — tracks commission owed to marketing staff for referrals
export const referralCommissions = pgTable("referral_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffUserId: varchar("staff_user_id").notNull(),   // marketing staff member
  ownerId: varchar("owner_id").notNull(),             // referred hotel owner
  commissionPct: text("commission_pct").default("10.00"),
  status: text("status").notNull().default("pending"), // pending | paid | cancelled
  amountCents: integer("amount_cents"),               // calculated on first payment
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralCommissionSchema = createInsertSchema(referralCommissions).omit({
  id: true,
  createdAt: true,
});

export type InsertReferralCommission = z.infer<typeof insertReferralCommissionSchema>;
export type ReferralCommission = typeof referralCommissions.$inferSelect;

// Properties table - belongs to an owner
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  type: text("type").notNull().default("hotel"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  country: text("country"),
  city: text("city"),
  postalCode: text("postal_code"),
  website: text("website"),
  starRating: text("star_rating"),
  totalUnits: integer("total_units"),
  numberOfFloors: integer("number_of_floors"),
  buildingType: text("building_type"),
  primaryGuestType: text("primary_guest_type"),
  hasSmartDevices: boolean("has_smart_devices").default(false),
  smartDoorLocks: boolean("smart_door_locks").default(false),
  smartHvac: boolean("smart_hvac").default(false),
  smartLighting: boolean("smart_lighting").default(false),
  pmsSystem: boolean("pms_system").default(false),
  bmsSystem: boolean("bms_system").default(false),
  iotSensors: boolean("iot_sensors").default(false),
  pmsSoftware: text("pms_software"),
  pmsOther: text("pms_other"),
  expectedSmartRoomCount: integer("expected_smart_room_count"),
  billingCurrency: text("billing_currency"),
  billingContactEmail: text("billing_contact_email"),
  timezone: text("timezone"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  countryTaxRate: integer("country_tax_rate").default(0),
  utilityExpensePct: integer("utility_expense_pct").default(0),
  cleaningExpenseMonthly: integer("cleaning_expense_monthly").default(0),
  defaultEmployeeTaxRate: integer("default_employee_tax_rate").default(0),
  additionalExpensesMonthly: integer("additional_expenses_monthly").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_properties_tenant_id").on(table.tenantId),
  index("idx_properties_owner_id").on(table.ownerId),
]);

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Units table - belongs to a property (rooms, villas, etc.)
export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  unitNumber: text("unit_number").notNull(),
  unitCategory: text("unit_category").notNull().default("accommodation"),
  unitType: text("unit_type").notNull().default("room"),
  name: text("name"),
  floor: integer("floor"),
  capacity: integer("capacity").default(2),
  description: text("description"),
  amenities: text("amenities").array(),
  pricePerNight: integer("price_per_night"),
  status: text("status").notNull().default("available"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_units_tenant_id").on(table.tenantId),
  index("idx_units_property_id").on(table.propertyId),
]);

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// Device types for IoT registry
export type DeviceType = "smart_lock" | "thermostat" | "light" | "curtain" | "sensor" | "camera" | "hvac" | "minibar" | "tv" | "speaker" | "other";
export type DeviceStatus = "online" | "offline" | "maintenance" | "error" | "firmware_update";

// Devices table - IoT devices linked to units (expanded for full registry)
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id"),
  propertyId: varchar("property_id").notNull(),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  deviceType: text("device_type").notNull(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  status: text("status").notNull().default("offline"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  firmwareVersion: text("firmware_version"),
  hardwareVersion: text("hardware_version"),
  lastOnline: timestamp("last_online"),
  lastPing: timestamp("last_ping"),
  batteryLevel: integer("battery_level"),
  signalStrength: integer("signal_strength"),
  capabilities: text("capabilities").array(),
  configuration: jsonb("configuration"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  installedAt: timestamp("installed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_devices_tenant_id").on(table.tenantId),
  index("idx_devices_owner_id").on(table.ownerId),
  index("idx_devices_property_id").on(table.propertyId),
]);

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
});

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

// Subscriptions table - SaaS plans for owners
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  planType: text("plan_type").notNull().default("starter"),
  planCode: text("plan_code").default("CORE_STARTER"),
  smartPlanType: text("smart_plan_type").default("none"),
  featureFlags: jsonb("feature_flags").default(sql`'{"smart_room": true, "ai_concierge": false, "analytics": true, "iot_devices": false}'::jsonb`),
  maxProperties: integer("max_properties").default(1),
  maxUnitsPerProperty: integer("max_units_per_property").default(50),
  maxStaff: integer("max_staff").default(5),
  multiProperty: boolean("multi_property").default(false),
  performanceEnabled: boolean("performance_enabled").default(false),
  staffPerformanceEnabled: boolean("staff_performance_enabled").default(false),
  advancedAnalytics: boolean("advanced_analytics").default(false),
  prioritySupport: boolean("priority_support").default(false),
  customIntegrations: boolean("custom_integrations").default(false),
  smartRoomsEnabled: boolean("smart_rooms_enabled").default(false),
  guestManagement: boolean("guest_management").default(true),
  staffManagement: boolean("staff_management").default(false),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  isActive: boolean("is_active").default(true),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  failedPaymentAttempts: integer("failed_payment_attempts").notNull().default(0),
  lastPaymentOrderId: varchar("last_payment_order_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_subscriptions_tenant_id").on(table.tenantId),
  index("idx_subscriptions_status").on(table.status),
  index("idx_subscriptions_period_end").on(table.currentPeriodEnd),
  index("idx_subscriptions_owner_id").on(table.ownerId),
]);

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// ===================== EXISTING TABLES (kept for backward compatibility, with new fields) =====================

// Hotels table - kept for backward compat, will map to properties
export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  country: text("country"),
  city: text("city"),
  postalCode: text("postal_code"),
  website: text("website"),
  starRating: text("star_rating"),
  totalRooms: integer("total_rooms"),
  numberOfFloors: integer("number_of_floors"),
  buildingType: text("building_type"),
  primaryGuestType: text("primary_guest_type"),
  hasSmartDevices: boolean("has_smart_devices").default(false),
  smartDoorLocks: boolean("smart_door_locks").default(false),
  smartHvac: boolean("smart_hvac").default(false),
  smartLighting: boolean("smart_lighting").default(false),
  pmsSystem: boolean("pms_system").default(false),
  bmsSystem: boolean("bms_system").default(false),
  iotSensors: boolean("iot_sensors").default(false),
  pmsSoftware: text("pms_software"),
  pmsOther: text("pms_other"),
  expectedSmartRoomCount: integer("expected_smart_room_count"),
  billingCurrency: text("billing_currency"),
  billingContactEmail: text("billing_contact_email"),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_hotels_tenant_id").on(table.tenantId),
  index("idx_hotels_owner_id").on(table.ownerId),
  index("idx_hotels_property_id").on(table.propertyId),
]);

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
});

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// User roles - updated for multi-tenant
export type UserRole = "guest" | "reception" | "admin" | "oss_super_admin" | "owner_admin" | "property_manager" | "staff";

// Supported languages
export type LanguageCode = "en" | "az" | "ar" | "tr" | "de" | "es" | "nl";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("guest"),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  phoneCountryCode: text("phone_country_code"),
  avatarUrl: text("avatar_url"),
  hotelId: varchar("hotel_id"),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  language: text("language").default("en"),
  referralCode: text("referral_code").unique(), // marketing staff referral code
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_users_tenant_id").on(table.tenantId),
  index("idx_users_hotel_id").on(table.hotelId),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Room settings preferences
export const roomSettings = pgTable("room_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  temperature: integer("temperature").default(22),
  lightsOn: boolean("lights_on").default(false),
  lightsBrightness: integer("lights_brightness").default(50),
  bathroomLightsOn: boolean("bathroom_lights_on").default(false),
  bathroomLightsBrightness: integer("bathroom_lights_brightness").default(50),
  hallLightsOn: boolean("hall_lights_on").default(false),
  hallLightsBrightness: integer("hall_lights_brightness").default(50),
  nonDimmableLightsOn: boolean("non_dimmable_lights_on").default(false),
  curtainsOpen: boolean("curtains_open").default(false),
  curtainsPosition: integer("curtains_position").default(0),
  jacuzziOn: boolean("jacuzzi_on").default(false),
  jacuzziTemperature: integer("jacuzzi_temperature").default(38),
  welcomeMode: boolean("welcome_mode").default(true),
  doorLocked: boolean("door_locked").default(true),
  tenantId: varchar("tenant_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_room_settings_tenant_id").on(table.tenantId),
]);

export const insertRoomSettingsSchema = createInsertSchema(roomSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertRoomSettings = z.infer<typeof insertRoomSettingsSchema>;
export type RoomSettings = typeof roomSettings.$inferSelect;

// Booking sources for dropdown
export type BookingSource = "walk_in" | "booking_com" | "airbnb" | "expedia" | "direct_website" | "travel_agency" | "corporate" | "other";

// Bookings table - with optional multi-tenant fields
export type BookingStatus = "booked" | "arrival_info_submitted" | "checked_in" | "checked_out";

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull(),
  roomNumber: text("room_number").notNull(),
  roomType: text("room_type").notNull(),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  status: text("status").notNull().default("booked"),
  preCheckedIn: boolean("pre_checked_in").default(false),
  specialRequests: text("special_requests"),
  bookingNumber: text("booking_number"),
  bookingSource: text("booking_source"),
  numberOfGuests: integer("number_of_guests"),
  nationality: text("nationality"),
  passportNumber: text("passport_number"),
  dateOfBirth: text("date_of_birth"),
  guestAddress: text("guest_address"),
  arrivalTime: text("arrival_time"),
  preCheckNotes: text("pre_check_notes"),
  rejectionReason: text("rejection_reason"),
  specialNotes: text("special_notes"),
  nightlyRate: integer("nightly_rate"),
  totalPrice: integer("total_price"),
  currency: text("currency").default("USD"),
  discount: integer("discount"),
  travelAgencyName: text("travel_agency_name"),
  paymentStatus: text("payment_status").default("unpaid"),
  guestSignatureBase64: text("guest_signature_base64"),
  idDocumentBase64: text("id_document_base64"),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  unitId: varchar("unit_id"),
  ratePlanId: varchar("rate_plan_id"),
  tenantId: varchar("tenant_id"),
  depositAmount: integer("deposit_amount"),
  depositDueDate: timestamp("deposit_due_date"),
  depositPaidAt: timestamp("deposit_paid_at"),
  paidAmount: integer("paid_amount").default(0),
  remainingBalance: integer("remaining_balance"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bookings_tenant_id").on(table.tenantId),
  index("idx_bookings_guest_id").on(table.guestId),
]);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Service request types
export type RequestType = "coffee" | "taxi" | "room_service" | "housekeeping" | "maintenance" | "concierge" | "other";
export type RequestStatus = "pending" | "approved" | "in_progress" | "completed" | "cancelled";

// Service requests from guests
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  roomNumber: text("room_number").notNull(),
  requestType: text("request_type").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  priority: text("priority").default("normal"),
  assignedTo: varchar("assigned_to"),
  notes: text("notes"),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_service_requests_tenant_id").on(table.tenantId),
  index("idx_service_requests_booking_id").on(table.bookingId),
]);

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_tenant_id").on(table.tenantId),
  index("idx_notifications_user_id").on(table.userId),
]);

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Door action logs for security tracking
export const doorActionLogs = pgTable("door_action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  roomNumber: text("room_number").notNull(),
  action: text("action").notNull(),
  performedBy: text("performed_by").notNull(),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_door_action_logs_tenant_id").on(table.tenantId),
]);

export const insertDoorActionLogSchema = createInsertSchema(doorActionLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertDoorActionLog = z.infer<typeof insertDoorActionLogSchema>;
export type DoorActionLog = typeof doorActionLogs.$inferSelect;

// Credential logs for tracking guest credential creation/updates
export const credentialLogs = pgTable("credential_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull(),
  action: text("action").notNull(),
  performedBy: varchar("performed_by").notNull(),
  performedByName: text("performed_by_name").notNull(),
  notes: text("notes"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_credential_logs_tenant_id").on(table.tenantId),
]);

export const insertCredentialLogSchema = createInsertSchema(credentialLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertCredentialLog = z.infer<typeof insertCredentialLogSchema>;
export type CredentialLog = typeof credentialLogs.$inferSelect;

// Chat messages between guests and staff
export type ThreadType = "guest_service" | "internal" | "escalation" | "staff_dm";

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  threadType: text("thread_type").notNull().default("guest_service"),
  escalatedBy: varchar("escalated_by"),
  escalationNote: text("escalation_note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_messages_tenant_id").on(table.tenantId),
  index("idx_chat_messages_hotel_id").on(table.hotelId),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Escalation status type
export type EscalationStatus = "open" | "in_progress" | "resolved" | "closed";

// Escalation replies table for tracking responses to escalations
export const escalationReplies = pgTable("escalation_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  escalationId: varchar("escalation_id").notNull(),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_escalation_replies_tenant_id").on(table.tenantId),
]);

export const insertEscalationReplySchema = createInsertSchema(escalationReplies).omit({
  id: true,
  createdAt: true,
});

export type InsertEscalationReply = z.infer<typeof insertEscalationReplySchema>;
export type EscalationReply = typeof escalationReplies.$inferSelect;

// Escalations table - tracks escalation metadata and status
export const escalations = pgTable("escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  status: text("status").notNull().default("open"),
  assignedTo: varchar("assigned_to"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_escalations_tenant_id").on(table.tenantId),
  index("idx_escalations_hotel_id").on(table.hotelId),
]);

export const insertEscalationSchema = createInsertSchema(escalations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEscalation = z.infer<typeof insertEscalationSchema>;
export type Escalation = typeof escalations.$inferSelect;

// Financial transaction types
export type TransactionCategory = 
  | "room_booking" 
  | "room_service" 
  | "housekeeping" 
  | "late_checkout" 
  | "damage_charge" 
  | "minibar" 
  | "spa" 
  | "restaurant" 
  | "laundry" 
  | "parking" 
  | "other";

export type PaymentStatus = "paid" | "unpaid" | "pending" | "refunded" | "voided";
export type PaymentMethod = "cash" | "card" | "online" | "room_charge" | "other";

// Financial transactions table
export const financialTransactions = pgTable("financial_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  guestId: varchar("guest_id"),
  bookingId: varchar("booking_id"),
  roomNumber: text("room_number"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  transactionReference: text("transaction_reference"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by"),
  voidReason: text("void_reason"),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_financial_transactions_tenant_id").on(table.tenantId),
  index("idx_financial_transactions_hotel_id").on(table.hotelId),
  index("idx_financial_transactions_owner_id").on(table.ownerId),
  index("idx_financial_transactions_created_at").on(table.createdAt),
]);

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  voidedAt: true,
  voidedBy: true,
  voidReason: true,
});

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// Financial audit logs for tracking changes
export const financialAuditLogs = pgTable("financial_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  transactionId: varchar("transaction_id").notNull(),
  action: text("action").notNull(),
  performedBy: varchar("performed_by").notNull(),
  performedByName: text("performed_by_name").notNull(),
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_financial_audit_logs_tenant_id").on(table.tenantId),
]);

export const insertFinancialAuditLogSchema = createInsertSchema(financialAuditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialAuditLog = z.infer<typeof insertFinancialAuditLogSchema>;
export type FinancialAuditLog = typeof financialAuditLogs.$inferSelect;

// No-show tracking for revenue loss analysis
export const noShowRecords = pgTable("no_show_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  roomNumber: text("room_number").notNull(),
  expectedCheckIn: timestamp("expected_check_in").notNull(),
  estimatedRevenueLoss: integer("estimated_revenue_loss"),
  recordedBy: varchar("recorded_by").notNull(),
  recordedByName: text("recorded_by_name").notNull(),
  notes: text("notes"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_no_show_records_tenant_id").on(table.tenantId),
  index("idx_no_show_records_hotel_id").on(table.hotelId),
]);

export const insertNoShowRecordSchema = createInsertSchema(noShowRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertNoShowRecord = z.infer<typeof insertNoShowRecordSchema>;
export type NoShowRecord = typeof noShowRecords.$inferSelect;

// Login schema for authentication
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["guest", "reception", "admin", "owner_admin", "property_manager", "staff"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Quote request status for CRM workflow
export type QuoteRequestStatus = "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";

// Quote requests for GET QUOTE form submissions
export const quoteRequests = pgTable("quote_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelName: text("hotel_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  preferredContactHours: text("preferred_contact_hours"),
  timezone: text("timezone"),
  preferredContactMethod: text("preferred_contact_method"),
  totalRooms: integer("total_rooms"),
  expectedSmartRooms: integer("expected_smart_rooms"),
  interestedFeatures: text("interested_features").array(),
  message: text("message"),
  sourcePage: text("source_page").notNull(),
  language: text("language").default("en"),
  status: text("status").notNull().default("NEW"),
  internalNotes: text("internal_notes"),
  emailSent: boolean("email_sent").default(false),
  assignedToUserId: varchar("assigned_to_user_id"),
  contactedAt: timestamp("contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  status: true,
  internalNotes: true,
  emailSent: true,
  assignedToUserId: true,
  contactedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

// Quote notes for activity tracking
export const quoteNotes = pgTable("quote_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteRequestId: varchar("quote_request_id").notNull(),
  authorUserId: varchar("author_user_id").notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteNoteSchema = createInsertSchema(quoteNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuoteNote = z.infer<typeof insertQuoteNoteSchema>;
export type QuoteNote = typeof quoteNotes.$inferSelect;

// Room Preparation Order types
export type RoomPrepOccasion = "birthday" | "honeymoon" | "anniversary" | "romantic_surprise" | "kids_decoration" | "custom";
export type RoomPrepDecorationStyle = "romantic" | "luxury" | "kids_theme" | "minimal" | "custom_theme";
export type RoomPrepBudgetRange = "basic" | "medium" | "premium" | "custom";
export type RoomPrepStatus = "pending" | "accepted" | "in_preparation" | "ready" | "delivered" | "rejected";

export const roomPreparationOrders = pgTable("room_preparation_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  roomNumber: text("room_number").notNull(),
  occasionType: text("occasion_type").notNull(),
  decorationStyle: text("decoration_style"),
  addOns: text("add_ons").array(),
  notes: text("notes"),
  budgetRange: text("budget_range").notNull().default("medium"),
  customBudget: integer("custom_budget"),
  preferredDatetime: timestamp("preferred_datetime"),
  referenceImageUrl: text("reference_image_url"),
  price: integer("price"),
  status: text("status").notNull().default("pending"),
  staffAssigned: varchar("staff_assigned"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_room_preparation_orders_tenant_id").on(table.tenantId),
]);

export const insertRoomPreparationOrderSchema = createInsertSchema(roomPreparationOrders).omit({
  id: true,
  price: true,
  status: true,
  staffAssigned: true,
  adminNotes: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRoomPreparationOrder = z.infer<typeof insertRoomPreparationOrderSchema>;
export type RoomPreparationOrder = typeof roomPreparationOrders.$inferSelect;

// ===================== ADVANCED SaaS TABLES =====================

// Audit action types
export type AuditAction = 
  | "user_login" | "user_logout" | "user_created" | "user_updated" | "user_deleted"
  | "device_created" | "device_updated" | "device_deleted" | "device_status_changed"
  | "subscription_created" | "subscription_upgraded" | "subscription_downgraded" | "subscription_cancelled"
  | "booking_created" | "booking_updated" | "booking_cancelled" | "booking_checked_in" | "booking_checked_out"
  | "property_created" | "property_updated" | "property_deleted"
  | "unit_created" | "unit_updated" | "unit_deleted"
  | "payment_received" | "invoice_created" | "refund_issued"
  | "settings_changed" | "white_label_updated";

// Audit logs table - tracks all system actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id"),
  propertyId: varchar("property_id"),
  userId: varchar("user_id"),
  userRole: text("user_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  description: text("description"),
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_tenant_id").on(table.tenantId),
  index("idx_audit_entity").on(table.entityType, table.entityId),
  index("idx_audit_created").on(table.createdAt),
  index("idx_audit_action").on(table.action),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Feature flag overrides per owner (for custom enablement)
export const featureFlagOverrides = pgTable("feature_flag_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  featureName: text("feature_name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_feature_flag_overrides_tenant_id").on(table.tenantId),
]);

export const insertFeatureFlagOverrideSchema = createInsertSchema(featureFlagOverrides).omit({
  id: true,
  createdAt: true,
});

export type InsertFeatureFlagOverride = z.infer<typeof insertFeatureFlagOverrideSchema>;
export type FeatureFlagOverride = typeof featureFlagOverrides.$inferSelect;

// Usage metering - daily snapshots of resource consumption
export const usageMeters = pgTable("usage_meters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  metricType: text("metric_type").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  maxAllowed: integer("max_allowed").notNull(),
  tenantId: varchar("tenant_id"),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  index("idx_usage_meters_tenant_id").on(table.tenantId),
]);

export const insertUsageMeterSchema = createInsertSchema(usageMeters).omit({
  id: true,
});

export type InsertUsageMeter = z.infer<typeof insertUsageMeterSchema>;
export type UsageMeter = typeof usageMeters.$inferSelect;

// White label settings for enterprise owners
export const whiteLabelSettings = pgTable("white_label_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  customDomain: text("custom_domain"),
  companyName: text("company_name"),
  hideBranding: boolean("hide_branding").default(false),
  customCss: text("custom_css"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_white_label_settings_tenant_id").on(table.tenantId),
]);

export const insertWhiteLabelSettingsSchema = createInsertSchema(whiteLabelSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWhiteLabelSettings = z.infer<typeof insertWhiteLabelSettingsSchema>;
export type WhiteLabelSettings = typeof whiteLabelSettings.$inferSelect;

// Onboarding progress tracking
export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  currentStep: integer("current_step").notNull().default(1),
  completedSteps: integer("completed_steps").array().default(sql`'{}'::integer[]`),
  accountCompleted: boolean("account_completed").default(false),
  propertyCompleted: boolean("property_completed").default(false),
  unitsCompleted: boolean("units_completed").default(false),
  smartSystemCompleted: boolean("smart_system_completed").default(false),
  staffCompleted: boolean("staff_completed").default(false),
  subscriptionCompleted: boolean("subscription_completed").default(false),
  devicesCompleted: boolean("devices_completed").default(false),
  isComplete: boolean("is_complete").default(false),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_progress_tenant_id").on(table.tenantId),
]);

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// Billing info for Stripe integration
export const billingInfo = pgTable("billing_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  paymentMethodLast4: text("payment_method_last4"),
  paymentMethodBrand: text("payment_method_brand"),
  billingEmail: text("billing_email"),
  billingName: text("billing_name"),
  billingAddress: jsonb("billing_address"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_billing_info_tenant_id").on(table.tenantId),
]);

export const insertBillingInfoSchema = createInsertSchema(billingInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBillingInfo = z.infer<typeof insertBillingInfoSchema>;
export type BillingInfo = typeof billingInfo.$inferSelect;

// Invoices table for billing history
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  invoiceNumber: text("invoice_number"),
  stripeInvoiceId: text("stripe_invoice_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("draft"),
  description: text("description"),
  invoiceUrl: text("invoice_url"),
  pdfUrl: text("pdf_url"),
  pdfPath: text("pdf_path"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  paidAt: timestamp("paid_at"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_invoices_tenant_id").on(table.tenantId),
  index("idx_invoices_owner_id").on(table.ownerId),
  index("idx_invoices_status").on(table.status),
  index("idx_invoices_paid_at").on(table.paidAt),
]);

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Payment Orders - tracks pending/approved/rejected payments (used by Epoint)
export const paymentOrders = pgTable("payment_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  planType: text("plan_type").notNull(),
  orderType: text("order_type").default("subscription"),
  referenceId: varchar("reference_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("AZN"),
  status: text("status").notNull().default("pending"),
  paymentMethodId: varchar("payment_method_id"),
  customerNote: text("customer_note"),
  adminNote: text("admin_note"),
  transferReference: text("transfer_reference"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payment_orders_owner_id").on(table.ownerId),
  index("idx_payment_orders_status").on(table.status),
  index("idx_payment_orders_tenant_id").on(table.tenantId),
]);

export const insertPaymentOrderSchema = createInsertSchema(paymentOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewedAt: true,
});

export type InsertPaymentOrder = z.infer<typeof insertPaymentOrderSchema>;
export type PaymentOrder = typeof paymentOrders.$inferSelect;

// Device telemetry for real-time data
export const deviceTelemetry = pgTable("device_telemetry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: real("metric_value"),
  stringValue: text("string_value"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_device_telemetry_tenant_id").on(table.tenantId),
  index("idx_device_telemetry_device_id").on(table.deviceId),
]);

export const insertDeviceTelemetrySchema = createInsertSchema(deviceTelemetry).omit({
  id: true,
  createdAt: true,
});

export type InsertDeviceTelemetry = z.infer<typeof insertDeviceTelemetrySchema>;
export type DeviceTelemetry = typeof deviceTelemetry.$inferSelect;

// Analytics snapshots for historical data
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  propertyId: varchar("property_id"),
  snapshotType: text("snapshot_type").notNull(),
  period: text("period").notNull(),
  data: jsonb("data").notNull(),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_snapshots_tenant_id").on(table.tenantId),
]);

export const insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalyticsSnapshot = z.infer<typeof insertAnalyticsSnapshotSchema>;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;

// Staff roles for property-level team management
export type StaffRole = "front_desk" | "manager" | "cleaner";
export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";

export const staffRoleLabels: Record<StaffRole, string> = {
  front_desk: "Front Desk",
  manager: "Manager",
  cleaner: "Cleaner",
};

// Staff invitations table - per-property team management
export const staffInvitations = pgTable("staff_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  ownerId: varchar("owner_id").notNull(),
  email: text("email").notNull(),
  staffRole: text("staff_role").notNull().default("front_desk"),
  status: text("status").notNull().default("pending"),
  invitedBy: varchar("invited_by").notNull(),
  acceptedBy: varchar("accepted_by"),
  inviteToken: text("invite_token"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_staff_invitations_tenant_id").on(table.tenantId),
]);

export const insertStaffInvitationSchema = createInsertSchema(staffInvitations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStaffInvitation = z.infer<typeof insertStaffInvitationSchema>;
export type StaffInvitation = typeof staffInvitations.$inferSelect;

// Validation schema for creating staff invitations from frontend
export const createStaffInvitationSchema = z.object({
  email: z.string().email("Valid email is required"),
  staffRole: z.enum(["front_desk", "manager", "cleaner"]),
  propertyId: z.string().min(1),
});

// ===================== FINANCE CENTER MODULE =====================

export type FinanceSourceType = "auto" | "owner_config" | "staff_input";
export type PayrollFrequency = "weekly" | "biweekly" | "monthly";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export const revenues = pgTable("revenues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  ownerId: varchar("owner_id"),
  bookingId: varchar("booking_id"),
  guestId: varchar("guest_id"),
  transactionId: varchar("transaction_id"),
  roomNumber: text("room_number"),
  category: text("category").notNull().default("room_booking"),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  sourceType: text("source_type").notNull().default("auto"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_revenues_tenant_id").on(table.tenantId),
  index("idx_revenues_hotel_id").on(table.hotelId),
]);

export const insertRevenueSchema = createInsertSchema(revenues).omit({
  id: true,
  createdAt: true,
});
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;
export type Revenue = typeof revenues.$inferSelect;

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  ownerId: varchar("owner_id"),
  recurringExpenseId: varchar("recurring_expense_id"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  vendor: text("vendor"),
  receiptUrl: text("receipt_url"),
  sourceType: text("source_type").notNull().default("staff_input"),
  periodMonth: integer("period_month"),
  periodYear: integer("period_year"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  approvedBy: varchar("approved_by"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_expenses_tenant_id").on(table.tenantId),
  index("idx_expenses_hotel_id").on(table.hotelId),
]);

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const payrollConfigs = pgTable("payroll_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  ownerId: varchar("owner_id"),
  staffId: varchar("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  staffRole: text("staff_role").notNull(),
  baseSalary: integer("base_salary").notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency").notNull().default("monthly"),
  bonusRules: text("bonus_rules"),
  deductionRules: text("deduction_rules"),
  bankDetails: text("bank_details"),
  employeeTaxRate: integer("employee_tax_rate").default(0),
  additionalExpensesMonthly: integer("additional_expenses_monthly").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payroll_configs_tenant_id").on(table.tenantId),
]);

export const insertPayrollConfigSchema = createInsertSchema(payrollConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayrollConfig = z.infer<typeof insertPayrollConfigSchema>;
export type PayrollConfig = typeof payrollConfigs.$inferSelect;

export const payrollEntries = pgTable("payroll_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  ownerId: varchar("owner_id"),
  payrollConfigId: varchar("payroll_config_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  amount: integer("amount").notNull(),
  bonusAmount: integer("bonus_amount").default(0),
  deductionAmount: integer("deduction_amount").default(0),
  netAmount: integer("net_amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  status: text("status").notNull().default("scheduled"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_payroll_entries_tenant_id").on(table.tenantId),
]);

export const insertPayrollEntrySchema = createInsertSchema(payrollEntries).omit({
  id: true,
  createdAt: true,
});
export type InsertPayrollEntry = z.infer<typeof insertPayrollEntrySchema>;
export type PayrollEntry = typeof payrollEntries.$inferSelect;

export const cashAccounts = pgTable("cash_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  ownerId: varchar("owner_id"),
  accountType: text("account_type").notNull().default("cash"),
  accountName: text("account_name").notNull(),
  balance: integer("balance").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  tenantId: varchar("tenant_id"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_cash_accounts_tenant_id").on(table.tenantId),
]);

export const insertCashAccountSchema = createInsertSchema(cashAccounts).omit({
  id: true,
  createdAt: true,
});
export type InsertCashAccount = z.infer<typeof insertCashAccountSchema>;
export type CashAccount = typeof cashAccounts.$inferSelect;

export const recurringExpenses = pgTable("recurring_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  ownerId: varchar("owner_id"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency").notNull().default("monthly"),
  vendor: text("vendor"),
  isActive: boolean("is_active").notNull().default(true),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  createdBy: varchar("created_by"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_recurring_expenses_tenant_id").on(table.tenantId),
]);

export const insertRecurringExpenseSchema = createInsertSchema(recurringExpenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRecurringExpense = z.infer<typeof insertRecurringExpenseSchema>;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;

// Expense categories for UI dropdowns
export const expenseCategories = [
  { value: "utilities_electricity", label: "Electricity" },
  { value: "utilities_gas", label: "Gas" },
  { value: "utilities_water", label: "Water" },
  { value: "utilities_internet", label: "Internet / WiFi" },
  { value: "rent", label: "Rent" },
  { value: "maintenance", label: "Maintenance & Repairs" },
  { value: "supplies", label: "Supplies & Amenities" },
  { value: "cleaning", label: "Cleaning Supplies" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "insurance", label: "Insurance" },
  { value: "taxes", label: "Taxes & Fees" },
  { value: "software", label: "Software & Subscriptions" },
  { value: "equipment", label: "Equipment" },
  { value: "emergency", label: "Emergency Purchase" },
  { value: "external_service", label: "External Service" },
  { value: "other", label: "Other" },
] as const;

export const revenueCategories = [
  { value: "room_booking", label: "Room Booking" },
  { value: "room_service", label: "Room Service" },
  { value: "minibar", label: "Minibar" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "restaurant", label: "Restaurant" },
  { value: "event", label: "Event / Conference" },
  { value: "parking", label: "Parking" },
  { value: "laundry", label: "Laundry" },
  { value: "late_checkout", label: "Late Checkout" },
  { value: "damage_fee", label: "Damage Fee" },
  { value: "other", label: "Other" },
] as const;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export type ContractStatus = "draft" | "signed" | "active" | "completed" | "cancelled";

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: text("region").notNull(),
  country: text("country").notNull(),
  clientName: text("client_name").notNull(),
  contractValue: integer("contract_value").notNull(),
  currency: text("currency").notNull().default("AZN"),
  partnerCompany: text("partner_company"),
  partnerCommissionPercent: integer("partner_commission_percent").notNull().default(20),
  taxPercent: integer("tax_percent").notNull().default(18),
  stateFeePercent: integer("state_fee_percent").notNull().default(10),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  signedDate: timestamp("signed_date"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
});
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export const boardReports = pgTable("board_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterName: text("reporter_name").notNull(),
  region: text("region").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contractIds: text("contract_ids").array(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBoardReportSchema = createInsertSchema(boardReports).omit({
  id: true,
  createdAt: true,
});
export type InsertBoardReport = z.infer<typeof insertBoardReportSchema>;
export type BoardReport = typeof boardReports.$inferSelect;

// ===================== STAFF BROADCAST MESSAGES =====================

export const staffMessages = pgTable("staff_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  senderRole: text("sender_role").notNull().default("owner"),
  senderId: varchar("sender_id").notNull(),
  messageText: text("message_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_staff_messages_hotel_id").on(table.hotelId),
  index("idx_staff_messages_tenant_id").on(table.tenantId),
]);

export const insertStaffMessageSchema = createInsertSchema(staffMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffMessage = z.infer<typeof insertStaffMessageSchema>;
export type StaffMessage = typeof staffMessages.$inferSelect;

export const staffMessageStatus = pgTable("staff_message_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
}, (table) => [
  index("idx_staff_message_status_message_id").on(table.messageId),
  index("idx_staff_message_status_staff_id").on(table.staffId),
]);

export const insertStaffMessageStatusSchema = createInsertSchema(staffMessageStatus).omit({
  id: true,
});
export type InsertStaffMessageStatus = z.infer<typeof insertStaffMessageStatusSchema>;
export type StaffMessageStatus = typeof staffMessageStatus.$inferSelect;

// ===================== STAFF PERFORMANCE SCORES =====================

export const staffPerformanceScores = pgTable("staff_performance_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  messageResponseScore: real("message_response_score").default(0),
  taskCompletionScore: real("task_completion_score").default(0),
  serviceQualityScore: real("service_quality_score").default(0),
  activityScore: real("activity_score").default(0),
  manualAdjustment: real("manual_adjustment").default(0),
  totalScore: real("total_score").default(0),
  period: text("period").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow(),
}, (table) => [
  index("idx_staff_performance_staff_id").on(table.staffId),
  index("idx_staff_performance_hotel_id").on(table.hotelId),
]);

export const insertStaffPerformanceScoreSchema = createInsertSchema(staffPerformanceScores).omit({
  id: true,
  calculatedAt: true,
});
export type InsertStaffPerformanceScore = z.infer<typeof insertStaffPerformanceScoreSchema>;
export type StaffPerformanceScore = typeof staffPerformanceScores.$inferSelect;

// ===================== STAFF FEEDBACK (OWNER → STAFF) =====================

export const staffFeedback = pgTable("staff_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  staffId: varchar("staff_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  type: text("type").notNull(),
  reason: text("reason"),
  scoreImpact: real("score_impact").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_staff_feedback_staff_id").on(table.staffId),
  index("idx_staff_feedback_hotel_id").on(table.hotelId),
]);

export const insertStaffFeedbackSchema = createInsertSchema(staffFeedback).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffFeedback = z.infer<typeof insertStaffFeedbackSchema>;
export type StaffFeedback = typeof staffFeedback.$inferSelect;

// Contract Acceptances - tracks service agreement acceptance by owners
export const contractAcceptances = pgTable("contract_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  userId: varchar("user_id").notNull(),
  planCode: text("plan_code").notNull(),
  planType: text("plan_type").notNull(),
  smartPlanType: text("smart_plan_type"),
  contractVersion: text("contract_version").notNull(),
  propertyName: text("property_name"),
  monthlyPrice: integer("monthly_price").notNull(),
  currency: text("currency").notNull().default("USD"),
  acceptedAt: timestamp("accepted_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  contractLanguage: text("contract_language").notNull().default("EN"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_contract_acceptances_owner_id").on(table.ownerId),
  index("idx_contract_acceptances_tenant_id").on(table.tenantId),
]);

export const insertContractAcceptanceSchema = createInsertSchema(contractAcceptances).omit({
  id: true,
  createdAt: true,
});
export type InsertContractAcceptance = z.infer<typeof insertContractAcceptanceSchema>;
export type ContractAcceptance = typeof contractAcceptances.$inferSelect;

export type HousekeepingTaskType = "cleaning" | "inspection" | "maintenance";
export type HousekeepingCleaningType = "checkout_cleaning" | "stayover_cleaning" | "deep_cleaning";
export type HousekeepingTaskStatus = "pending" | "assigned" | "in_progress" | "inspection" | "completed" | "cancelled";
export type HousekeepingPriority = "low" | "normal" | "high" | "urgent";
export type HousekeepingTriggerSource = "auto_checkout" | "manual" | "admin" | "system";

export const housekeepingTasks = pgTable("housekeeping_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  unitId: varchar("unit_id").notNull(),
  bookingId: varchar("booking_id"),
  roomNumber: text("room_number").notNull(),
  taskType: text("task_type").notNull(),
  cleaningType: text("cleaning_type"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").default("normal"),
  assignedTo: varchar("assigned_to"),
  triggerSource: text("trigger_source").notNull(),
  notes: text("notes"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_housekeeping_tasks_tenant_id").on(table.tenantId),
  index("idx_housekeeping_tasks_property_id").on(table.propertyId),
  index("idx_housekeeping_tasks_unit_id").on(table.unitId),
  index("idx_housekeeping_tasks_booking_id").on(table.bookingId),
  index("idx_housekeeping_tasks_assigned_to").on(table.assignedTo),
  index("idx_housekeeping_tasks_status").on(table.status),
]);

export const insertHousekeepingTaskSchema = createInsertSchema(housekeepingTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertHousekeepingTask = z.infer<typeof insertHousekeepingTaskSchema>;
export type HousekeepingTask = typeof housekeepingTasks.$inferSelect;

// ===================== EXTERNAL OTA BOOKINGS =====================

export const externalBookings = pgTable("external_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id"),
  tenantId: varchar("tenant_id"),
  source: text("source"),
  externalId: text("external_id"),
  guestName: text("guest_name"),
  checkinDate: text("checkin_date"),
  checkoutDate: text("checkout_date"),
  roomName: text("room_name"),
  price: real("price"),
  status: text("status").default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_external_bookings_external_id_hotel_id").on(table.externalId, table.hotelId),
  index("idx_external_bookings_tenant_id").on(table.tenantId),
  index("idx_external_bookings_hotel_id").on(table.hotelId),
]);

export const insertExternalBookingSchema = createInsertSchema(externalBookings).omit({
  id: true,
  createdAt: true,
});
export type InsertExternalBooking = z.infer<typeof insertExternalBookingSchema>;
export type ExternalBooking = typeof externalBookings.$inferSelect;

export const roomNights = pgTable("room_nights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").notNull(),
  date: date("date").notNull(),
  bookingId: varchar("booking_id").notNull(),
  tenantId: varchar("tenant_id"),
  propertyId: varchar("property_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_room_nights_unit_date").on(table.unitId, table.date),
  index("idx_room_nights_booking_id").on(table.bookingId),
  index("idx_room_nights_tenant_id").on(table.tenantId),
  index("idx_room_nights_property_date").on(table.propertyId, table.date),
]);

export const insertRoomNightSchema = createInsertSchema(roomNights).omit({
  id: true,
  createdAt: true,
});
export type InsertRoomNight = z.infer<typeof insertRoomNightSchema>;
export type RoomNight = typeof roomNights.$inferSelect;

export const ratePlans = pgTable("rate_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  refundPolicy: text("refund_policy").notNull().default("flexible"),
  mealPlan: text("meal_plan").notNull().default("none"),
  priceModifier: real("price_modifier").notNull().default(0),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rate_plans_property_id").on(table.propertyId),
  index("idx_rate_plans_tenant_id").on(table.tenantId),
]);

export const insertRatePlanSchema = createInsertSchema(ratePlans).omit({
  id: true,
  createdAt: true,
});
export type InsertRatePlan = z.infer<typeof insertRatePlanSchema>;
export type RatePlan = typeof ratePlans.$inferSelect;

// ===================== OTA INTEGRATIONS =====================

export const otaIntegrations = pgTable("ota_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  tenantId: varchar("tenant_id"),
  provider: text("provider").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ota_integrations_property_id").on(table.propertyId),
  index("idx_ota_integrations_tenant_id").on(table.tenantId),
  uniqueIndex("idx_ota_integrations_property_provider").on(table.propertyId, table.provider),
]);

export const insertOtaIntegrationSchema = createInsertSchema(otaIntegrations).omit({
  id: true,
  createdAt: true,
});
export type InsertOtaIntegration = z.infer<typeof insertOtaIntegrationSchema>;
export type OtaIntegration = typeof otaIntegrations.$inferSelect;

// ===================== OTA SYNC LOGS =====================

export const otaSyncLogs = pgTable("ota_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  propertyId: varchar("property_id").notNull(),
  tenantId: varchar("tenant_id"),
  action: text("action").notNull(),
  status: text("status").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ota_sync_logs_property_id").on(table.propertyId),
  index("idx_ota_sync_logs_tenant_id").on(table.tenantId),
  index("idx_ota_sync_logs_provider").on(table.provider),
  index("idx_ota_sync_logs_created_at").on(table.createdAt),
]);

export const insertOtaSyncLogSchema = createInsertSchema(otaSyncLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertOtaSyncLog = z.infer<typeof insertOtaSyncLogSchema>;
export type OtaSyncLog = typeof otaSyncLogs.$inferSelect;

export const otaConflicts = pgTable("ota_conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  tenantId: varchar("tenant_id"),
  unitId: varchar("unit_id"),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  guestName: text("guest_name"),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ota_conflicts_property_id").on(table.propertyId),
  index("idx_ota_conflicts_tenant_id").on(table.tenantId),
]);

export const insertOtaConflictSchema = createInsertSchema(otaConflicts).omit({
  id: true,
  createdAt: true,
});
export type InsertOtaConflict = z.infer<typeof insertOtaConflictSchema>;
export type OtaConflict = typeof otaConflicts.$inferSelect;

// ===================== DYNAMIC PRICING RULES =====================

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(),
  priority: integer("priority").notNull().default(0),
  conditions: jsonb("conditions").notNull(),
  adjustment: jsonb("adjustment").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pricing_rules_property_id").on(table.propertyId),
  index("idx_pricing_rules_tenant_id").on(table.tenantId),
]);

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
});
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;

export const refundRequests = pgTable("refund_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  transactionId: varchar("transaction_id"),
  ownerId: varchar("owner_id").notNull(),
  tenantId: varchar("tenant_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("AZN"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull(),
  approvedBy: varchar("approved_by"),
  rejectedBy: varchar("rejected_by"),
  rejectionReason: text("rejection_reason"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_refund_invoice").on(table.invoiceId),
  index("idx_refund_status").on(table.status),
  index("idx_refund_owner").on(table.ownerId),
]);

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  approvedBy: true,
  rejectedBy: true,
  rejectionReason: true,
});
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  endpoint: text("endpoint").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_api_usage_tenant").on(table.tenantId),
  index("idx_api_usage_created_at").on(table.createdAt),
]);

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;

// ===================== HOTEL FINANCE — DEPARTMENTS =====================
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_departments_hotel_id").on(table.hotelId),
  index("idx_departments_tenant_id").on(table.tenantId),
]);
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// ===================== HOTEL FINANCE — COST CENTERS =====================
export const costCenters = pgTable("cost_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  code: text("code").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_cost_centers_hotel_id").on(table.hotelId),
  index("idx_cost_centers_department_id").on(table.departmentId),
]);
export const insertCostCenterSchema = createInsertSchema(costCenters).omit({ id: true, createdAt: true });
export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type CostCenter = typeof costCenters.$inferSelect;

// ===================== HOTEL FINANCE — TAX CONFIGURATIONS =====================
export const taxConfigurations = pgTable("tax_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  code: text("code").notNull(),
  rate: integer("rate").notNull(),
  isInclusive: boolean("is_inclusive").default(false),
  appliesTo: text("applies_to").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tax_config_hotel_id").on(table.hotelId),
  index("idx_tax_config_tenant_id").on(table.tenantId),
]);
export const insertTaxConfigurationSchema = createInsertSchema(taxConfigurations).omit({ id: true, createdAt: true });
export type InsertTaxConfiguration = z.infer<typeof insertTaxConfigurationSchema>;
export type TaxConfiguration = typeof taxConfigurations.$inferSelect;

// ===================== HOTEL FINANCE — GUEST FOLIOS =====================
export const guestFolios = pgTable("guest_folios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().unique(),
  guestId: varchar("guest_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  propertyId: varchar("property_id"),
  tenantId: varchar("tenant_id"),
  folioNumber: text("folio_number").notNull(),
  status: text("status").notNull().default("open"),
  currency: text("currency").default("USD"),
  totalCharges: integer("total_charges").default(0),
  totalPayments: integer("total_payments").default(0),
  totalAdjustments: integer("total_adjustments").default(0),
  balance: integer("balance").default(0),
  taxTotal: integer("tax_total").default(0),
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  finalizedAt: timestamp("finalized_at"),
  finalizedBy: varchar("finalized_by"),
  invoiceGeneratedAt: timestamp("invoice_generated_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_folios_booking_id").on(table.bookingId),
  index("idx_folios_guest_id").on(table.guestId),
  index("idx_folios_hotel_id").on(table.hotelId),
  index("idx_folios_tenant_id").on(table.tenantId),
  index("idx_folios_status").on(table.status),
]);
export const insertGuestFolioSchema = createInsertSchema(guestFolios).omit({ id: true, createdAt: true });
export type InsertGuestFolio = z.infer<typeof insertGuestFolioSchema>;
export type GuestFolio = typeof guestFolios.$inferSelect;

// ===================== HOTEL FINANCE — FOLIO CHARGES =====================
export const folioCharges = pgTable("folio_charges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  folioId: varchar("folio_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  departmentId: varchar("department_id"),
  costCenterId: varchar("cost_center_id"),
  chargeType: text("charge_type").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price").notNull(),
  amountNet: integer("amount_net").notNull(),
  taxRate: integer("tax_rate").default(0),
  taxAmount: integer("tax_amount").default(0),
  amountGross: integer("amount_gross").notNull(),
  isInclusive: boolean("is_inclusive").default(false),
  currency: text("currency").default("USD"),
  serviceDate: timestamp("service_date"),
  idempotencyKey: text("idempotency_key").unique(),
  status: text("status").notNull().default("posted"),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by"),
  voidReason: text("void_reason"),
  postedBy: varchar("posted_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_folio_charges_folio_id").on(table.folioId),
  index("idx_folio_charges_booking_id").on(table.bookingId),
  index("idx_folio_charges_hotel_id").on(table.hotelId),
  index("idx_folio_charges_tenant_id").on(table.tenantId),
  index("idx_folio_charges_status").on(table.status),
  index("idx_folio_charges_service_date").on(table.serviceDate),
]);
export const insertFolioChargeSchema = createInsertSchema(folioCharges).omit({ id: true, createdAt: true });
export type InsertFolioCharge = z.infer<typeof insertFolioChargeSchema>;
export type FolioCharge = typeof folioCharges.$inferSelect;

// ===================== HOTEL FINANCE — FOLIO PAYMENTS =====================
export const folioPayments = pgTable("folio_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  folioId: varchar("folio_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  paymentType: text("payment_type").notNull().default("payment"),
  paymentMethod: text("payment_method").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("USD"),
  referenceNumber: text("reference_number"),
  isDeposit: boolean("is_deposit").default(false),
  status: text("status").notNull().default("completed"),
  receivedAt: timestamp("received_at").defaultNow(),
  receivedBy: varchar("received_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_folio_payments_folio_id").on(table.folioId),
  index("idx_folio_payments_booking_id").on(table.bookingId),
  index("idx_folio_payments_hotel_id").on(table.hotelId),
  index("idx_folio_payments_tenant_id").on(table.tenantId),
]);
export const insertFolioPaymentSchema = createInsertSchema(folioPayments).omit({ id: true, createdAt: true });
export type InsertFolioPayment = z.infer<typeof insertFolioPaymentSchema>;
export type FolioPayment = typeof folioPayments.$inferSelect;

// ===================== HOTEL FINANCE — FOLIO ADJUSTMENTS =====================
export const folioAdjustments = pgTable("folio_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  folioId: varchar("folio_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  adjustmentType: text("adjustment_type").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("USD"),
  approvalStatus: text("approval_status").notNull().default("approved"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_folio_adjustments_folio_id").on(table.folioId),
  index("idx_folio_adjustments_hotel_id").on(table.hotelId),
  index("idx_folio_adjustments_tenant_id").on(table.tenantId),
  index("idx_folio_adjustments_approval").on(table.approvalStatus),
]);
export const insertFolioAdjustmentSchema = createInsertSchema(folioAdjustments).omit({ id: true, createdAt: true });
export type InsertFolioAdjustment = z.infer<typeof insertFolioAdjustmentSchema>;
export type FolioAdjustment = typeof folioAdjustments.$inferSelect;

// ===================== HOTEL FINANCE — CANCELLATION POLICIES =====================
export const cancellationPolicies = pgTable("cancellation_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  name: text("name").notNull(),
  freeCancellationHours: integer("free_cancellation_hours").default(24),
  noShowPenaltyType: text("no_show_penalty_type").default("percent"),
  noShowPenaltyValue: integer("no_show_penalty_value").default(10000),
  lateCancellationPenaltyType: text("late_cancellation_penalty_type").default("percent"),
  lateCancellationPenaltyValue: integer("late_cancellation_penalty_value").default(10000),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_cancel_policy_hotel_id").on(table.hotelId),
  index("idx_cancel_policy_tenant_id").on(table.tenantId),
]);
export const insertCancellationPolicySchema = createInsertSchema(cancellationPolicies).omit({ id: true, createdAt: true });
export type InsertCancellationPolicy = z.infer<typeof insertCancellationPolicySchema>;
export type CancellationPolicy = typeof cancellationPolicies.$inferSelect;

// ===================== HOTEL FINANCE — CHART OF ACCOUNTS =====================
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(),
  parentId: varchar("parent_id"),
  isSystem: boolean("is_system").default(false),
  isActive: boolean("is_active").default(true),
  normalBalance: text("normal_balance").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_coa_hotel_id").on(table.hotelId),
  index("idx_coa_tenant_id").on(table.tenantId),
  index("idx_coa_account_code").on(table.accountCode),
]);
export const insertChartOfAccountSchema = createInsertSchema(chartOfAccounts).omit({ id: true, createdAt: true });
export type InsertChartOfAccount = z.infer<typeof insertChartOfAccountSchema>;
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;

// ===================== HOTEL FINANCE — JOURNAL ENTRIES =====================
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  entryNumber: text("entry_number").notNull(),
  entryDate: timestamp("entry_date").notNull(),
  description: text("description").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: varchar("source_id"),
  status: text("status").notNull().default("posted"),
  totalDebit: integer("total_debit").default(0),
  totalCredit: integer("total_credit").default(0),
  currency: text("currency").default("USD"),
  createdBy: varchar("created_by"),
  reversedBy: varchar("reversed_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_journal_entries_hotel_id").on(table.hotelId),
  index("idx_journal_entries_tenant_id").on(table.tenantId),
  index("idx_journal_entries_source").on(table.sourceType, table.sourceId),
  index("idx_journal_entries_date").on(table.entryDate),
]);
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// ===================== HOTEL FINANCE — JOURNAL ENTRY LINES =====================
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").notNull(),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  accountId: varchar("account_id").notNull(),
  departmentId: varchar("department_id"),
  description: text("description"),
  debit: integer("debit").default(0),
  credit: integer("credit").default(0),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_journal_lines_entry_id").on(table.journalEntryId),
  index("idx_journal_lines_account_id").on(table.accountId),
  index("idx_journal_lines_hotel_id").on(table.hotelId),
]);
export const insertJournalEntryLineSchema = createInsertSchema(journalEntryLines).omit({ id: true, createdAt: true });
export type InsertJournalEntryLine = z.infer<typeof insertJournalEntryLineSchema>;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;

// ===================== HOTEL FINANCE — NIGHT AUDITS =====================
export const nightAudits = pgTable("night_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  auditDate: timestamp("audit_date").notNull(),
  status: text("status").notNull().default("open"),
  totalRevenue: integer("total_revenue").default(0),
  totalPayments: integer("total_payments").default(0),
  totalAdjustments: integer("total_adjustments").default(0),
  roomNightsPosted: integer("room_nights_posted").default(0),
  occupiedRooms: integer("occupied_rooms").default(0),
  totalRooms: integer("total_rooms").default(0),
  occupancyRate: integer("occupancy_rate").default(0),
  notes: text("notes"),
  closedAt: timestamp("closed_at"),
  closedBy: varchar("closed_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_night_audits_hotel_id").on(table.hotelId),
  index("idx_night_audits_date").on(table.auditDate),
  index("idx_night_audits_tenant_id").on(table.tenantId),
]);
export const insertNightAuditSchema = createInsertSchema(nightAudits).omit({ id: true, createdAt: true });
export type InsertNightAudit = z.infer<typeof insertNightAuditSchema>;
export type NightAudit = typeof nightAudits.$inferSelect;

// ===================== HOTEL FINANCE — DAILY FINANCIAL SUMMARIES =====================
export const dailyFinancialSummaries = pgTable("daily_financial_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull(),
  tenantId: varchar("tenant_id"),
  summaryDate: timestamp("summary_date").notNull(),
  roomRevenue: integer("room_revenue").default(0),
  fbRevenue: integer("fb_revenue").default(0),
  spaRevenue: integer("spa_revenue").default(0),
  otherRevenue: integer("other_revenue").default(0),
  totalRevenue: integer("total_revenue").default(0),
  totalTax: integer("total_tax").default(0),
  totalExpenses: integer("total_expenses").default(0),
  occupiedRooms: integer("occupied_rooms").default(0),
  totalRooms: integer("total_rooms").default(0),
  occupancyRate: integer("occupancy_rate").default(0),
  adr: integer("adr").default(0),
  revpar: integer("revpar").default(0),
  totalPaymentsCash: integer("total_payments_cash").default(0),
  totalPaymentsCard: integer("total_payments_card").default(0),
  totalPaymentsBank: integer("total_payments_bank").default(0),
  isLocked: boolean("is_locked").default(false),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_daily_summary_hotel_id").on(table.hotelId),
  index("idx_daily_summary_date").on(table.summaryDate),
  index("idx_daily_summary_tenant_id").on(table.tenantId),
]);
export const insertDailyFinancialSummarySchema = createInsertSchema(dailyFinancialSummaries).omit({ id: true, createdAt: true });
export type InsertDailyFinancialSummary = z.infer<typeof insertDailyFinancialSummarySchema>;
export type DailyFinancialSummary = typeof dailyFinancialSummaries.$inferSelect;

// ===================== AI CHAT LEADS =====================
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyName: text("property_name").notNull(),
  country: text("country").notNull(),
  propertyType: text("property_type").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_leads_email").on(table.email),
  index("idx_leads_created_at").on(table.createdAt),
]);

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ===================== RESTAURANT / POS ECOSYSTEM =====================

export const posMenuCategories = pgTable("pos_menu_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  name: varchar("name").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPosMenuCategorySchema = createInsertSchema(posMenuCategories).omit({ id: true, createdAt: true });
export type InsertPosMenuCategory = z.infer<typeof insertPosMenuCategorySchema>;
export type PosMenuCategory = typeof posMenuCategories.$inferSelect;

export const posMenuItems = pgTable("pos_menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  categoryId: varchar("category_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPosMenuItemSchema = createInsertSchema(posMenuItems).omit({ id: true, createdAt: true });
export type InsertPosMenuItem = z.infer<typeof insertPosMenuItemSchema>;
export type PosMenuItem = typeof posMenuItems.$inferSelect;

// kitchen_status: pending | cooking | ready | delivered
// settlement_status: pending | posted_to_folio | cash_paid | cancelled
export const posOrders = pgTable("pos_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  folioId: varchar("folio_id"),
  bookingId: varchar("booking_id"),
  tableNumber: varchar("table_number"),
  guestName: varchar("guest_name"),
  waiterId: varchar("waiter_id"),
  kitchenStatus: varchar("kitchen_status").notNull().default("pending"),
  settlementStatus: varchar("settlement_status").notNull().default("pending"),
  notes: text("notes"),
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  readyAt: timestamp("ready_at"),
  deliveredAt: timestamp("delivered_at"),
  settledAt: timestamp("settled_at"),
});
export const insertPosOrderSchema = createInsertSchema(posOrders).omit({ id: true, createdAt: true });
export type InsertPosOrder = z.infer<typeof insertPosOrderSchema>;
export type PosOrder = typeof posOrders.$inferSelect;

export const posOrderItems = pgTable("pos_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  menuItemId: varchar("menu_item_id"),
  itemName: varchar("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
});
export const insertPosOrderItemSchema = createInsertSchema(posOrderItems).omit({ id: true });
export type InsertPosOrderItem = z.infer<typeof insertPosOrderItemSchema>;
export type PosOrderItem = typeof posOrderItems.$inferSelect;

// Waiter call logs — guest calls waiter from table / room
export const waiterCalls = pgTable("waiter_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  bookingId: varchar("booking_id"),
  tableNumber: varchar("table_number"),
  roomNumber: varchar("room_number"),
  status: varchar("status").notNull().default("pending"), // pending | acknowledged
  calledAt: timestamp("called_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by"),
});
export const insertWaiterCallSchema = createInsertSchema(waiterCalls).omit({ id: true, calledAt: true });
export type InsertWaiterCall = z.infer<typeof insertWaiterCallSchema>;
export type WaiterCall = typeof waiterCalls.$inferSelect;
