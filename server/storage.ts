import { db } from "./db";
import { eq, desc, asc, and, or, gte, lte, lt, gt, sql, ilike, count, inArray } from "drizzle-orm";
import { logger } from "./utils/logger";
import { 
  users, 
  bookings, 
  roomSettings, 
  serviceRequests, 
  notifications,
  doorActionLogs,
  credentialLogs,
  hotels,
  chatMessages,
  financialTransactions,
  financialAuditLogs,
  noShowRecords,
  quoteRequests,
  quoteNotes,
  owners,
  properties,
  units,
  devices,
  subscriptions,
  roomPreparationOrders,
  auditLogs,
  featureFlagOverrides,
  usageMeters,
  whiteLabelSettings,
  onboardingProgress,
  billingInfo,
  invoices,
  deviceTelemetry,
  analyticsSnapshots,
  escalations,
  escalationReplies,
  type User, 
  type InsertUser,
  type Booking,
  type InsertBooking,
  type RoomSettings,
  type InsertRoomSettings,
  type ServiceRequest,
  type InsertServiceRequest,
  type Notification,
  type InsertNotification,
  type DoorActionLog,
  type InsertDoorActionLog,
  type CredentialLog,
  type InsertCredentialLog,
  type Hotel,
  type InsertHotel,
  type ChatMessage,
  type InsertChatMessage,
  type FinancialTransaction,
  type InsertFinancialTransaction,
  type FinancialAuditLog,
  type InsertFinancialAuditLog,
  type NoShowRecord,
  type InsertNoShowRecord,
  type QuoteRequest,
  type InsertQuoteRequest,
  type QuoteNote,
  type InsertQuoteNote,
  type Owner,
  type InsertOwner,
  type Property,
  type InsertProperty,
  type Unit,
  type InsertUnit,
  type Device,
  type InsertDevice,
  type Subscription,
  type InsertSubscription,
  type RoomPreparationOrder,
  type InsertRoomPreparationOrder,
  type AuditLog,
  type InsertAuditLog,
  type FeatureFlagOverride,
  type InsertFeatureFlagOverride,
  type UsageMeter,
  type InsertUsageMeter,
  type WhiteLabelSettings,
  type InsertWhiteLabelSettings,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type BillingInfo,
  type InsertBillingInfo,
  type Invoice,
  type InsertInvoice,
  type DeviceTelemetry,
  type InsertDeviceTelemetry,
  type AnalyticsSnapshot,
  type InsertAnalyticsSnapshot,
  type PlanType,
  staffInvitations,
  type StaffInvitation,
  type InsertStaffInvitation,
  passwordResetTokens,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  revenues,
  expenses,
  payrollConfigs,
  payrollEntries,
  cashAccounts,
  recurringExpenses,
  type InsertRevenue,
  type Revenue,
  type InsertExpense,
  type Expense,
  type InsertPayrollConfig,
  type PayrollConfig,
  type InsertPayrollEntry,
  type PayrollEntry,
  type InsertCashAccount,
  type CashAccount,
  type InsertRecurringExpense,
  type RecurringExpense,
  type Escalation,
  type InsertEscalation,
  type EscalationReply,
  type InsertEscalationReply,
  paymentOrders,
  type PaymentOrder,
  type InsertPaymentOrder,
  contracts,
  boardReports,
  type Contract,
  type InsertContract,
  contractAcceptances,
  type ContractAcceptance,
  type InsertContractAcceptance,
  type BoardReport,
  type InsertBoardReport,
  staffMessages,
  staffMessageStatus,
  staffPerformanceScores,
  staffFeedback,
  type StaffMessage,
  type InsertStaffMessage,
  type StaffMessageStatus,
  type InsertStaffMessageStatus,
  type StaffPerformanceScore,
  type InsertStaffPerformanceScore,
  type StaffFeedback,
  type InsertStaffFeedback,
  housekeepingTasks,
  type HousekeepingTask,
  type InsertHousekeepingTask,
  externalBookings,
  type ExternalBooking,
  type InsertExternalBooking,
  roomNights,
  type RoomNight,
  type InsertRoomNight,
  ratePlans,
  type RatePlan,
  type InsertRatePlan,
  otaIntegrations,
  type OtaIntegration,
  type InsertOtaIntegration,
  otaSyncLogs,
  type OtaSyncLog,
  type InsertOtaSyncLog,
  otaConflicts,
  type OtaConflict,
  type InsertOtaConflict,
  pricingRules,
  type PricingRule,
  type InsertPricingRule,
  apiUsageLogs,
  departments,
  type Department,
  type InsertDepartment,
  costCenters,
  type CostCenter,
  type InsertCostCenter,
  taxConfigurations,
  type TaxConfiguration,
  type InsertTaxConfiguration,
  guestFolios,
  type GuestFolio,
  type InsertGuestFolio,
  folioCharges,
  type FolioCharge,
  type InsertFolioCharge,
  folioPayments,
  type FolioPayment,
  type InsertFolioPayment,
  folioAdjustments,
  type FolioAdjustment,
  type InsertFolioAdjustment,
  chartOfAccounts,
  type ChartOfAccount,
  type InsertChartOfAccount,
  journalEntries,
  type JournalEntry,
  type InsertJournalEntry,
  journalEntryLines,
  type JournalEntryLine,
  type InsertJournalEntryLine,
  nightAudits,
  type NightAudit,
  type InsertNightAudit,
  dailyFinancialSummaries,
  type DailyFinancialSummary,
  type InsertDailyFinancialSummary,
  cancellationPolicies,
  type CancellationPolicy,
  type InsertCancellationPolicy,
} from "@shared/schema";

export interface IStorage {
  // Owners
  getOwner(id: string): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: string, updates: Partial<Owner>): Promise<Owner | undefined>;
  getAllOwners(): Promise<Owner[]>;

  // Properties
  getProperty(id: string): Promise<Property | undefined>;
  getPropertiesByOwner(ownerId: string): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<void>;
  getAllProperties(tenantId: string): Promise<Property[]>;

  // Units
  getUnit(id: string): Promise<Unit | undefined>;
  getUnitsByProperty(propertyId: string): Promise<Unit[]>;
  getUnitsByOwner(ownerId: string): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | undefined>;
  deleteUnit(id: string): Promise<void>;

  // Devices
  getDevice(id: string): Promise<Device | undefined>;
  getDevicesByProperty(propertyId: string): Promise<Device[]>;
  getDevicesByOwner(ownerId: string): Promise<Device[]>;
  getDevicesByUnit(unitId: string): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<void>;

  // Subscriptions
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByOwner(ownerId: string): Promise<Subscription | undefined>;
  getSubscriptionsDueForRenewal(): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Hotels (backward compat)
  getHotel(id: string): Promise<Hotel | undefined>;
  getHotelByPropertyId(propertyId: string): Promise<Hotel | undefined>;
  getHotelByName(name: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  getAllHotels(tenantId: string): Promise<Hotel[]>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(tenantId: string): Promise<User[]>;
  getUsersByHotel(hotelId: string, tenantId: string): Promise<User[]>;
  getUsersByOwner(ownerId: string, tenantId: string): Promise<User[]>;
  getUsersByProperty(propertyId: string): Promise<User[]>;
  getStaffUsers(): Promise<User[]>;
  getGuestUsers(hotelId: string, tenantId: string): Promise<User[]>;
  getGuestUsersByHotel(hotelId: string, tenantId: string): Promise<User[]>;
  
  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getCurrentBookingForGuest(guestId: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<Booking>): Promise<Booking | undefined>;
  getAllBookings(tenantId: string): Promise<Booking[]>;
  getBookingsByHotel(hotelId: string, tenantId: string): Promise<Booking[]>;
  getBookingsByProperty(propertyId: string): Promise<Booking[]>;

  // OTA Integrations
  getOtaIntegrationsByProperty(propertyId: string, tenantId: string): Promise<OtaIntegration[]>;
  getActiveOtaIntegrations(propertyId: string, tenantId?: string | null): Promise<OtaIntegration[]>;
  getOtaIntegration(id: string): Promise<OtaIntegration | undefined>;
  createOtaIntegration(data: InsertOtaIntegration): Promise<OtaIntegration>;
  updateOtaIntegration(id: string, updates: Partial<OtaIntegration>): Promise<OtaIntegration | undefined>;
  deleteOtaIntegration(id: string): Promise<void>;

  // OTA Sync Logs
  getOtaSyncLogs(propertyId: string, tenantId?: string | null, limit?: number): Promise<OtaSyncLog[]>;
  createOtaSyncLog(data: InsertOtaSyncLog): Promise<OtaSyncLog>;

  getOtaConflicts(propertyId: string, tenantId?: string | null): Promise<OtaConflict[]>;
  createOtaConflict(data: InsertOtaConflict): Promise<OtaConflict>;

  // Pricing Rules (Dynamic Pricing)
  getPricingRulesByProperty(propertyId: string, tenantId: string): Promise<PricingRule[]>;
  getPricingRule(id: string): Promise<PricingRule | undefined>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, tenantId: string, updates: Partial<PricingRule>): Promise<PricingRule | undefined>;
  deletePricingRule(id: string, tenantId: string): Promise<void>;

  // Rate Plans
  getRatePlansByProperty(propertyId: string, tenantId: string): Promise<RatePlan[]>;
  getRatePlan(id: string): Promise<RatePlan | undefined>;
  createRatePlan(ratePlan: InsertRatePlan): Promise<RatePlan>;
  updateRatePlan(id: string, updates: Partial<RatePlan>): Promise<RatePlan | undefined>;
  deleteRatePlan(id: string): Promise<void>;
  getDefaultRatePlan(propertyId: string): Promise<RatePlan | undefined>;
  ensureDefaultRatePlan(propertyId: string, tenantId: string | null): Promise<RatePlan>;

  // Room Nights (Availability Engine)
  getRoomNightsByUnit(unitId: string, startDate: string, endDate: string): Promise<RoomNight[]>;
  getRoomNightsByProperty(propertyId: string, startDate: string, endDate: string): Promise<RoomNight[]>;
  deleteRoomNightsByBooking(bookingId: string): Promise<void>;
  reconcileRoomNights(bookingId: string, unitId: string, checkIn: Date, checkOut: Date, tenantId?: string | null, propertyId?: string | null): Promise<void>;
  searchAvailableUnits(propertyId: string, checkIn: string, checkOut: string, guests?: number, tenantId?: string): Promise<Unit[]>;
  
  // Room Settings
  getRoomSettings(bookingId: string): Promise<RoomSettings | undefined>;
  createRoomSettings(settings: InsertRoomSettings): Promise<RoomSettings>;
  updateRoomSettings(bookingId: string, settings: Partial<RoomSettings>): Promise<RoomSettings | undefined>;
  
  // Service Requests
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestsForGuest(guestId: string): Promise<ServiceRequest[]>;
  getAllServiceRequests(tenantId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByHotel(hotelId: string, tenantId: string): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, request: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  
  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsForUser(userId: string, tenantId: string): Promise<Notification[]>;
  getAllNotifications(tenantId: string): Promise<Notification[]>;
  getNotificationsByHotel(hotelId: string, tenantId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Door Action Logs
  createDoorActionLog(log: InsertDoorActionLog): Promise<DoorActionLog>;
  getAllDoorActionLogs(tenantId: string): Promise<DoorActionLog[]>;
  getDoorActionLogsByHotel(hotelId: string, tenantId: string): Promise<DoorActionLog[]>;
  getDoorActionLogsForRoom(roomNumber: string): Promise<DoorActionLog[]>;
  
  // Credential Logs
  createCredentialLog(log: InsertCredentialLog): Promise<CredentialLog>;
  getCredentialLogsForGuest(guestId: string): Promise<CredentialLog[]>;
  
  // User updates
  updateUserPassword(userId: string, password: string): Promise<User | undefined>;
  updateUserLanguage(userId: string, language: string): Promise<User | undefined>;
  getGuestWithPassword(guestId: string): Promise<User | undefined>;
  deleteGuest(guestId: string): Promise<void>;
  
  // Chat Messages
  getChatMessagesForGuest(guestId: string, hotelId: string, tenantId: string): Promise<ChatMessage[]>;
  getChatMessagesForHotel(hotelId: string, tenantId: string, guestId?: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getGuestsWithChats(hotelId: string, tenantId: string): Promise<{ guestId: string; lastMessage: string; lastMessageAt: Date | null }[]>;
  getInternalMessages(hotelId: string, tenantId: string): Promise<ChatMessage[]>;
  getEscalationMessages(hotelId: string, tenantId: string): Promise<ChatMessage[]>;
  getChatMessagesByThreadType(hotelId: string, threadType: string): Promise<ChatMessage[]>;
  getStaffDmMessages(conversationKey: string, hotelId: string): Promise<ChatMessage[]>;
  getStaffDmConversations(userId: string, hotelIds: string[]): Promise<{ conversationKey: string; peerId: string; lastMessage: string; lastMessageAt: Date | null }[]>;
  
  // Escalations
  getEscalation(id: string): Promise<Escalation | undefined>;
  getEscalationByMessageId(messageId: string): Promise<Escalation | undefined>;
  getEscalationsByHotel(hotelId: string): Promise<Escalation[]>;
  createEscalation(escalation: InsertEscalation): Promise<Escalation>;
  updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation | undefined>;
  createEscalationReply(reply: InsertEscalationReply): Promise<EscalationReply>;
  getEscalationReplies(escalationId: string): Promise<EscalationReply[]>;
  
  // Financial Transactions
  getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactionsByHotel(hotelId: string, tenantId: string): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: string, transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction | undefined>;
  voidFinancialTransaction(id: string, voidedBy: string, reason: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactionsByDateRange(hotelId: string, startDate: Date, endDate: Date): Promise<FinancialTransaction[]>;
  
  // Financial Audit Logs
  createFinancialAuditLog(log: InsertFinancialAuditLog): Promise<FinancialAuditLog>;
  getFinancialAuditLogs(hotelId: string, tenantId: string): Promise<FinancialAuditLog[]>;
  getAuditLogsForTransaction(transactionId: string): Promise<FinancialAuditLog[]>;
  
  // No-Show Records
  createNoShowRecord(record: InsertNoShowRecord): Promise<NoShowRecord>;
  getNoShowRecordsByHotel(hotelId: string, tenantId: string): Promise<NoShowRecord[]>;
  
  // Quote Requests
  createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest>;
  getAllQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequest(id: string): Promise<QuoteRequest | undefined>;
  updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<QuoteRequest | undefined>;
  
  // Quote Notes (for CRM activity)
  createQuoteNote(note: InsertQuoteNote): Promise<QuoteNote>;
  getQuoteNotes(quoteRequestId: string): Promise<QuoteNote[]>;
  
  // OSS Super Admin specific methods (unscoped — admin only)
  getOssSuperAdminUsers(): Promise<User[]>;
  getQuoteRequestsByStatus(status: string): Promise<QuoteRequest[]>;
  getQuoteRequestsCount(): Promise<{ total: number; byStatus: Record<string, number>; byCountry: Record<string, number> }>;
  adminGetAllProperties(): Promise<Property[]>;
  adminGetAllHotels(): Promise<Hotel[]>;
  adminGetAllUsers(): Promise<User[]>;
  adminGetAllRoomPreparationOrders(): Promise<RoomPreparationOrder[]>;

  // Room Preparation Orders
  getRoomPreparationOrder(id: string): Promise<RoomPreparationOrder | undefined>;
  getRoomPreparationOrdersByGuest(guestId: string, tenantId: string): Promise<RoomPreparationOrder[]>;
  getRoomPreparationOrdersByHotel(hotelId: string, tenantId: string): Promise<RoomPreparationOrder[]>;
  getAllRoomPreparationOrders(tenantId: string): Promise<RoomPreparationOrder[]>;
  createRoomPreparationOrder(order: InsertRoomPreparationOrder): Promise<RoomPreparationOrder>;
  updateRoomPreparationOrder(id: string, updates: Partial<RoomPreparationOrder>): Promise<RoomPreparationOrder | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByOwner(ownerId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  getAuditLogsFiltered(ownerId: string, filters: {
    action?: string; entityType?: string; search?: string;
    limit: number; offset: number;
  }): Promise<{ logs: AuditLog[]; total: number; actions: string[]; entityTypes: string[] }>;
  getAuditLogsAdmin(filters: {
    tenantId?: string; action?: string; entityType?: string;
    from?: Date; to?: Date; search?: string;
    limit: number; offset: number;
  }): Promise<{ logs: AuditLog[]; total: number; actions: string[]; entityTypes: string[] }>;

  // Feature Flag Overrides
  getFeatureFlagOverrides(ownerId: string): Promise<FeatureFlagOverride[]>;
  setFeatureFlagOverride(override: InsertFeatureFlagOverride): Promise<FeatureFlagOverride>;
  deleteFeatureFlagOverride(id: string): Promise<void>;
  hasFeature(ownerId: string, featureName: string): Promise<boolean>;

  // Usage Meters
  getUsageMeters(ownerId: string): Promise<UsageMeter[]>;
  getUsageMeter(ownerId: string, metricType: string): Promise<UsageMeter | undefined>;
  upsertUsageMeter(meter: InsertUsageMeter): Promise<UsageMeter>;
  refreshUsageMeters(ownerId: string): Promise<UsageMeter[]>;

  // White Label Settings
  getWhiteLabelSettings(ownerId: string): Promise<WhiteLabelSettings | undefined>;
  upsertWhiteLabelSettings(settings: InsertWhiteLabelSettings): Promise<WhiteLabelSettings>;

  // Onboarding Progress
  getOnboardingProgress(ownerId: string): Promise<OnboardingProgress | undefined>;
  upsertOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;

  // Billing Info
  getBillingInfo(ownerId: string): Promise<BillingInfo | undefined>;
  upsertBillingInfo(info: InsertBillingInfo): Promise<BillingInfo>;

  // Invoices
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByOwner(ownerId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined>;

  // Payment Orders
  getPaymentOrders(): Promise<PaymentOrder[]>;
  getPaymentOrdersByOwner(ownerId: string): Promise<PaymentOrder[]>;
  getPaymentOrdersByStatus(status: string): Promise<PaymentOrder[]>;
  getPaymentOrder(id: string): Promise<PaymentOrder | undefined>;
  createPaymentOrder(order: InsertPaymentOrder): Promise<PaymentOrder>;
  updatePaymentOrder(id: string, updates: Partial<PaymentOrder>): Promise<PaymentOrder | undefined>;

  // Device Telemetry
  createDeviceTelemetry(telemetry: InsertDeviceTelemetry): Promise<DeviceTelemetry>;
  getDeviceTelemetry(deviceId: string, limit?: number): Promise<DeviceTelemetry[]>;

  // Analytics Snapshots
  createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot>;
  getAnalyticsSnapshots(ownerId: string, snapshotType: string): Promise<AnalyticsSnapshot[]>;

  // Staff Invitations
  getStaffInvitationsByProperty(propertyId: string): Promise<StaffInvitation[]>;
  getStaffInvitationByEmail(propertyId: string, email: string): Promise<StaffInvitation | undefined>;
  createStaffInvitation(invitation: InsertStaffInvitation): Promise<StaffInvitation>;
  updateStaffInvitation(id: string, updates: Partial<StaffInvitation>): Promise<StaffInvitation | undefined>;
  deleteStaffInvitation(id: string): Promise<void>;
  getStaffInvitationByToken(token: string): Promise<StaffInvitation | undefined>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<void>;

  // Finance Center - Revenues
  createRevenue(revenue: InsertRevenue): Promise<Revenue>;
  getRevenuesByHotel(hotelId: string, tenantId: string): Promise<Revenue[]>;
  getRevenuesByOwner(ownerId: string, tenantId: string): Promise<Revenue[]>;
  getRevenuesByProperty(propertyId: string): Promise<Revenue[]>;

  // Finance Center - Expenses
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByHotel(hotelId: string, tenantId: string): Promise<Expense[]>;
  getExpensesByOwner(ownerId: string, tenantId: string): Promise<Expense[]>;

  // Finance Center - Payroll
  createPayrollConfig(config: InsertPayrollConfig): Promise<PayrollConfig>;
  getPayrollConfigsByHotel(hotelId: string, tenantId: string): Promise<PayrollConfig[]>;
  getPayrollConfigsByOwner(ownerId: string, tenantId: string): Promise<PayrollConfig[]>;
  getPayrollConfigByStaff(staffId: string): Promise<PayrollConfig | undefined>;
  updatePayrollConfig(id: string, updates: Partial<PayrollConfig>): Promise<PayrollConfig | undefined>;
  createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry>;
  getPayrollEntriesByHotel(hotelId: string, tenantId: string): Promise<PayrollEntry[]>;
  getPayrollEntriesByOwner(ownerId: string, tenantId: string): Promise<PayrollEntry[]>;
  updatePayrollEntry(id: string, updates: Partial<PayrollEntry>): Promise<PayrollEntry | undefined>;

  // Finance Center - Cash Accounts
  createCashAccount(account: InsertCashAccount): Promise<CashAccount>;
  getCashAccountsByHotel(hotelId: string, tenantId: string): Promise<CashAccount[]>;
  getCashAccountsByOwner(ownerId: string, tenantId: string): Promise<CashAccount[]>;
  updateCashAccount(id: string, updates: Partial<CashAccount>): Promise<CashAccount | undefined>;

  // Finance Center - Recurring Expenses
  createRecurringExpense(expense: InsertRecurringExpense): Promise<RecurringExpense>;
  getRecurringExpensesByHotel(hotelId: string, tenantId: string): Promise<RecurringExpense[]>;
  getRecurringExpensesByOwner(ownerId: string, tenantId: string): Promise<RecurringExpense[]>;
  updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | undefined>;
  getDueRecurringExpenses(): Promise<RecurringExpense[]>;

  // Contracts (OSS Admin)
  getContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<void>;

  // Board Reports (OSS Admin)
  getBoardReports(): Promise<BoardReport[]>;
  getBoardReport(id: string): Promise<BoardReport | undefined>;
  createBoardReport(report: InsertBoardReport): Promise<BoardReport>;
  deleteBoardReport(id: string): Promise<void>;

  // Staff Broadcast Messages
  createStaffMessage(message: InsertStaffMessage): Promise<StaffMessage>;
  getStaffMessagesByHotel(hotelId: string): Promise<StaffMessage[]>;
  createStaffMessageStatus(status: InsertStaffMessageStatus): Promise<StaffMessageStatus>;
  getStaffMessageStatusByMessage(messageId: string): Promise<StaffMessageStatus[]>;
  getStaffMessageStatusByStaff(staffId: string): Promise<StaffMessageStatus[]>;
  markStaffMessageRead(messageId: string, staffId: string): Promise<void>;

  // Staff Performance Scores
  getStaffPerformanceScore(staffId: string, period: string): Promise<StaffPerformanceScore | undefined>;
  getStaffPerformanceScoresByHotel(hotelId: string, period: string): Promise<StaffPerformanceScore[]>;
  upsertStaffPerformanceScore(score: InsertStaffPerformanceScore): Promise<StaffPerformanceScore>;
  getStaffPerformanceHistory(staffId: string): Promise<StaffPerformanceScore[]>;

  // Staff Feedback
  createStaffFeedback(feedback: InsertStaffFeedback): Promise<StaffFeedback>;
  getStaffFeedbackByStaff(staffId: string): Promise<StaffFeedback[]>;
  getStaffFeedbackByHotel(hotelId: string): Promise<StaffFeedback[]>;

  // Housekeeping Tasks
  getHousekeepingTask(id: string): Promise<HousekeepingTask | undefined>;
  createHousekeepingTask(task: InsertHousekeepingTask): Promise<HousekeepingTask>;
  getHousekeepingTasksByProperty(propertyId: string, tenantId: string): Promise<HousekeepingTask[]>;
  getHousekeepingTasksByStaff(userId: string): Promise<HousekeepingTask[]>;
  updateHousekeepingTask(id: string, updates: Partial<HousekeepingTask>): Promise<HousekeepingTask | undefined>;
  getOpenHousekeepingTasksForUnit(unitId: string): Promise<HousekeepingTask[]>;

  // External OTA Bookings
  getExternalBooking(id: string): Promise<ExternalBooking | undefined>;
  getExternalBookingByExternalId(externalId: string, hotelId: string): Promise<ExternalBooking | undefined>;
  getExternalBookingsByHotel(hotelId: string, tenantId: string): Promise<ExternalBooking[]>;
  createExternalBooking(booking: InsertExternalBooking): Promise<ExternalBooking>;
  updateExternalBooking(id: string, updates: Partial<ExternalBooking>): Promise<ExternalBooking | undefined>;
  deleteExternalBooking(id: string): Promise<void>;

  // API Usage Logs
  createApiUsageLog(tenantId: string, endpoint: string): Promise<void>;
  countApiUsageThisMonth(tenantId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // ===================== OWNERS =====================
  async getOwner(id: string): Promise<Owner | undefined> {
    const result = await db.select().from(owners).where(eq(owners.id, id)).limit(1);
    return result[0];
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    const result = await db.insert(owners).values(owner).returning();
    return result[0];
  }

  async updateOwner(id: string, updates: Partial<Owner>): Promise<Owner | undefined> {
    const result = await db.update(owners).set(updates).where(eq(owners.id, id)).returning();
    return result[0];
  }

  async getAllOwners(): Promise<Owner[]> {
    return db.select().from(owners).orderBy(desc(owners.createdAt));
  }

  // ===================== PROPERTIES =====================
  async getProperty(id: string): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result[0];
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return db.select().from(properties)
      .where(eq(properties.ownerId, ownerId))
      .orderBy(desc(properties.createdAt));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const result = await db.insert(properties).values(property).returning();
    return result[0];
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined> {
    const result = await db.update(properties).set(updates).where(eq(properties.id, id)).returning();
    return result[0];
  }

  async deleteProperty(id: string): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async getAllProperties(tenantId: string): Promise<Property[]> {
    return db.select().from(properties)
      .where(eq(properties.tenantId, tenantId))
      .orderBy(desc(properties.createdAt));
  }

  // ===================== UNITS =====================
  async getUnit(id: string): Promise<Unit | undefined> {
    const result = await db.select().from(units).where(eq(units.id, id)).limit(1);
    return result[0];
  }

  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    return db.select().from(units)
      .where(eq(units.propertyId, propertyId))
      .orderBy(units.unitNumber);
  }

  async getUnitsByOwner(ownerId: string): Promise<Unit[]> {
    return db.select().from(units)
      .where(eq(units.ownerId, ownerId))
      .orderBy(units.unitNumber);
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const result = await db.insert(units).values(unit).returning();
    return result[0];
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | undefined> {
    const result = await db.update(units).set(updates).where(eq(units.id, id)).returning();
    return result[0];
  }

  async deleteUnit(id: string): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // ===================== DEVICES =====================
  async getDevice(id: string): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
    return result[0];
  }

  async getDevicesByProperty(propertyId: string): Promise<Device[]> {
    return db.select().from(devices)
      .where(eq(devices.propertyId, propertyId))
      .orderBy(desc(devices.createdAt));
  }

  async getDevicesByOwner(ownerId: string): Promise<Device[]> {
    return db.select().from(devices)
      .where(eq(devices.ownerId, ownerId))
      .orderBy(desc(devices.createdAt));
  }

  async getDevicesByUnit(unitId: string): Promise<Device[]> {
    return db.select().from(devices)
      .where(eq(devices.unitId, unitId))
      .orderBy(desc(devices.createdAt));
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const result = await db.insert(devices).values(device).returning();
    return result[0];
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const result = await db.update(devices).set(updates).where(eq(devices.id, id)).returning();
    return result[0];
  }

  async deleteDevice(id: string): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  }

  // ===================== SUBSCRIPTIONS =====================
  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionByOwner(ownerId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.ownerId, ownerId), eq(subscriptions.isActive, true)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return result[0];
  }

  async getSubscriptionsDueForRenewal(): Promise<Subscription[]> {
    const now = new Date();
    return db.select().from(subscriptions)
      .where(
        and(
          lte(subscriptions.currentPeriodEnd, now),
          inArray(subscriptions.status, ["trial", "active", "past_due"]),
          eq(subscriptions.isActive, true)
        )
      );
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription).returning();
    return result[0];
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions).set({ ...updates, updatedAt: new Date() }).where(eq(subscriptions.id, id)).returning();
    return result[0];
  }

  // ===================== HOTELS (backward compat) =====================
  async getHotel(id: string): Promise<Hotel | undefined> {
    const result = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
    return result[0];
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const result = await db.insert(hotels).values(hotel).returning();
    return result[0];
  }

  async getHotelByPropertyId(propertyId: string): Promise<Hotel | undefined> {
    const result = await db.select().from(hotels).where(eq(hotels.propertyId, propertyId)).limit(1);
    return result[0];
  }

  async getHotelByName(name: string): Promise<Hotel | undefined> {
    const result = await db.select().from(hotels).where(eq(hotels.name, name)).limit(1);
    return result[0];
  }

  async getAllHotels(tenantId: string): Promise<Hotel[]> {
    return db.select().from(hotels)
      .where(eq(hotels.tenantId, tenantId))
      .orderBy(desc(hotels.createdAt));
  }

  // ===================== USERS =====================
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(users.createdAt));
  }

  async getUsersByHotel(hotelId: string, tenantId: string): Promise<User[]> {
    const conditions = [eq(users.hotelId, hotelId), eq(users.tenantId, tenantId)];
    return db.select().from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));
  }

  async getUsersByOwner(ownerId: string, tenantId: string): Promise<User[]> {
    const conditions = [eq(users.ownerId, ownerId), eq(users.tenantId, tenantId)];
    return db.select().from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));
  }

  async getUsersByProperty(propertyId: string): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.propertyId, propertyId))
      .orderBy(desc(users.createdAt));
  }

  async getStaffUsers(): Promise<User[]> {
    return db.select().from(users).where(
      or(eq(users.role, "reception"), eq(users.role, "admin"), eq(users.role, "staff"), eq(users.role, "property_manager"))
    );
  }

  async getGuestUsers(hotelId: string, tenantId: string): Promise<User[]> {
    const conditions = [eq(users.role, "guest"), eq(users.hotelId, hotelId), eq(users.tenantId, tenantId)];
    return db.select().from(users).where(and(...conditions));
  }

  async getGuestUsersByHotel(hotelId: string, tenantId: string): Promise<User[]> {
    const conditions = [eq(users.role, "guest"), eq(users.hotelId, hotelId), eq(users.tenantId, tenantId)];
    return db.select().from(users).where(and(...conditions));
  }

  async deleteGuest(guestId: string): Promise<void> {
    const guestBookings = await db.select().from(bookings).where(eq(bookings.guestId, guestId));
    for (const booking of guestBookings) {
      await db.delete(roomSettings).where(eq(roomSettings.bookingId, booking.id));
    }
    await db.delete(bookings).where(eq(bookings.guestId, guestId));
    await db.delete(serviceRequests).where(eq(serviceRequests.guestId, guestId));
    await db.delete(notifications).where(eq(notifications.userId, guestId));
    await db.delete(credentialLogs).where(eq(credentialLogs.guestId, guestId));
    await db.delete(users).where(eq(users.id, guestId));
  }

  // ===================== BOOKINGS =====================
  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getCurrentBookingForGuest(guestId: string): Promise<Booking | undefined> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM bookings
            WHERE guest_id = ${guestId}
              AND status IN ('pending','confirmed','booked','precheck_submitted','arrival_info_submitted','checked_in','rejected','active')
            ORDER BY check_in_date DESC
            LIMIT 1`
      );
      const rows = (result as any).rows ?? result;
      if (!rows || rows.length === 0) return undefined;
      const row = rows[0];
      return {
        id: row.id,
        guestId: row.guest_id,
        roomNumber: row.room_number,
        roomType: row.room_type,
        checkInDate: row.check_in_date,
        checkOutDate: row.check_out_date,
        status: row.status,
        preCheckedIn: row.pre_checked_in ?? false,
        specialRequests: row.special_requests ?? null,
        bookingNumber: row.booking_number ?? null,
        bookingSource: row.booking_source ?? null,
        numberOfGuests: row.number_of_guests ?? null,
        nationality: row.nationality ?? null,
        passportNumber: row.passport_number ?? null,
        specialNotes: row.special_notes ?? null,
        ownerId: row.owner_id ?? null,
        propertyId: row.property_id ?? null,
        unitId: row.unit_id ?? null,
        nightlyRate: row.nightly_rate ?? null,
        totalPrice: row.total_price ?? null,
        currency: row.currency ?? "USD",
        discount: row.discount ?? null,
        tenantId: row.tenant_id ?? null,
        travelAgencyName: row.travel_agency_name ?? null,
        dateOfBirth: row.date_of_birth ?? null,
        guestAddress: row.guest_address ?? null,
        arrivalTime: row.arrival_time ?? null,
        preCheckNotes: row.pre_check_notes ?? null,
        rejectionReason: row.rejection_reason ?? null,
        paymentStatus: row.payment_status ?? null,
        guestSignatureBase64: row.guest_signature_base64 ?? null,
        idDocumentBase64: row.id_document_base64 ?? null,
        ratePlanId: row.rate_plan_id ?? null,
        depositAmount: row.deposit_amount ?? null,
        depositDueDate: row.deposit_due_date ?? null,
        depositPaidAt: row.deposit_paid_at ?? null,
        paidAmount: row.paid_amount ?? 0,
        remainingBalance: row.remaining_balance ?? null,
        createdAt: row.created_at ?? null,
      } as Booking;
    } catch (error) {
      logger.error({ err: error }, "Error in getCurrentBookingForGuest");
      return undefined;
    }
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    return await db.transaction(async (tx) => {
      if (booking.tenantId) {
        const normalizedRoomNumber = booking.roomNumber.trim().toUpperCase();

        const conditions: any[] = [
          eq(bookings.tenantId, booking.tenantId),
          inArray(bookings.status, ["booked", "confirmed", "checked_in"]),
          lt(bookings.checkInDate, new Date(booking.checkOutDate)),
          gt(bookings.checkOutDate, new Date(booking.checkInDate)),
        ];

        if (booking.unitId) {
          conditions.push(eq(bookings.unitId, booking.unitId));
        } else if (booking.propertyId) {
          conditions.push(eq(bookings.propertyId, booking.propertyId));
          conditions.push(sql`UPPER(TRIM(${bookings.roomNumber})) = ${normalizedRoomNumber}`);
        } else {
          conditions.push(sql`UPPER(TRIM(${bookings.roomNumber})) = ${normalizedRoomNumber}`);
        }

        const conflicts = await tx.select({ id: bookings.id })
          .from(bookings)
          .where(and(...conditions))
          .limit(1);

        if (conflicts.length > 0) {
          logger.warn({ tenantId: booking.tenantId, propertyId: booking.propertyId, roomNumber: booking.roomNumber, checkIn: booking.checkInDate, checkOut: booking.checkOutDate }, "Overbooking blocked");
          throw new Error("OVERBOOKING_BLOCKED: Room already booked for selected dates");
        }
      }

      const inserted = await tx.insert(bookings).values(booking).returning({ id: bookings.id });
      const insertedId = inserted[0].id;

      const rawResult = await tx.execute(sql`SELECT * FROM bookings WHERE id = ${insertedId} LIMIT 1`);
      const rawRows = (rawResult as any).rows ?? rawResult;
      const createdBooking: Booking = rawRows[0] ? {
        id: rawRows[0].id,
        guestId: rawRows[0].guest_id,
        roomNumber: rawRows[0].room_number,
        roomType: rawRows[0].room_type,
        checkInDate: rawRows[0].check_in_date,
        checkOutDate: rawRows[0].check_out_date,
        status: rawRows[0].status,
        preCheckedIn: rawRows[0].pre_checked_in ?? false,
        specialRequests: rawRows[0].special_requests ?? null,
        bookingNumber: rawRows[0].booking_number ?? null,
        bookingSource: rawRows[0].booking_source ?? null,
        numberOfGuests: rawRows[0].number_of_guests ?? null,
        nationality: rawRows[0].nationality ?? null,
        passportNumber: rawRows[0].passport_number ?? null,
        specialNotes: rawRows[0].special_notes ?? null,
        ownerId: rawRows[0].owner_id ?? null,
        propertyId: rawRows[0].property_id ?? null,
        unitId: rawRows[0].unit_id ?? null,
        nightlyRate: rawRows[0].nightly_rate ?? null,
        totalPrice: rawRows[0].total_price ?? null,
        currency: rawRows[0].currency ?? "USD",
        discount: rawRows[0].discount ?? null,
        tenantId: rawRows[0].tenant_id ?? null,
        travelAgencyName: rawRows[0].travel_agency_name ?? null,
        dateOfBirth: rawRows[0].date_of_birth ?? null,
        guestAddress: rawRows[0].guest_address ?? null,
        arrivalTime: rawRows[0].arrival_time ?? null,
        preCheckNotes: rawRows[0].pre_check_notes ?? null,
        rejectionReason: rawRows[0].rejection_reason ?? null,
        paymentStatus: rawRows[0].payment_status ?? null,
        guestSignatureBase64: rawRows[0].guest_signature_base64 ?? null,
        idDocumentBase64: rawRows[0].id_document_base64 ?? null,
        ratePlanId: rawRows[0].rate_plan_id ?? null,
        depositAmount: rawRows[0].deposit_amount ?? null,
        depositDueDate: rawRows[0].deposit_due_date ?? null,
        depositPaidAt: rawRows[0].deposit_paid_at ?? null,
        paidAmount: rawRows[0].paid_amount ?? 0,
        remainingBalance: rawRows[0].remaining_balance ?? null,
        createdAt: rawRows[0].created_at ?? null,
      } as Booking : { id: insertedId, ...booking } as unknown as Booking;

      if (createdBooking.unitId && createdBooking.checkInDate && createdBooking.checkOutDate) {
        const nightRows = this.generateNightDates(
          new Date(createdBooking.checkInDate),
          new Date(createdBooking.checkOutDate),
        ).map(dateStr => ({
          unitId: createdBooking.unitId!,
          date: dateStr,
          bookingId: createdBooking.id,
          tenantId: createdBooking.tenantId || null,
          propertyId: createdBooking.propertyId || null,
        }));

        if (nightRows.length > 0) {
          try {
            await tx.insert(roomNights).values(nightRows);
            logger.info({ bookingId: createdBooking.id, unitId: createdBooking.unitId, nights: nightRows.length }, "Room nights reserved");
          } catch (err: any) {
            if (err.code === "23505") {
              logger.warn({ bookingId: createdBooking.id, unitId: createdBooking.unitId }, "Room not available — unique constraint violation on room_nights");
              throw new Error("ROOM_NOT_AVAILABLE: Room not available for selected dates");
            }
            throw err;
          }
        }
      }

      return createdBooking;
    });
  }

  private generateNightDates(checkIn: Date, checkOut: Date): string[] {
    const dates: string[] = [];
    const current = new Date(checkIn);
    const end = new Date(checkOut);
    while (current < end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<Booking | undefined> {
    await db.update(bookings)
      .set(booking)
      .where(eq(bookings.id, id));
    const rawResult = await db.execute(sql`SELECT * FROM bookings WHERE id = ${id} LIMIT 1`);
    const rows = (rawResult as any).rows ?? rawResult;
    if (!rows || rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      guestId: row.guest_id,
      roomNumber: row.room_number,
      roomType: row.room_type,
      checkInDate: row.check_in_date,
      checkOutDate: row.check_out_date,
      status: row.status,
      preCheckedIn: row.pre_checked_in ?? false,
      specialRequests: row.special_requests ?? null,
      bookingNumber: row.booking_number ?? null,
      bookingSource: row.booking_source ?? null,
      numberOfGuests: row.number_of_guests ?? null,
      nationality: row.nationality ?? null,
      passportNumber: row.passport_number ?? null,
      specialNotes: row.special_notes ?? null,
      ownerId: row.owner_id ?? null,
      propertyId: row.property_id ?? null,
      unitId: row.unit_id ?? null,
      nightlyRate: row.nightly_rate ?? null,
      totalPrice: row.total_price ?? null,
      currency: row.currency ?? "USD",
      discount: row.discount ?? null,
      tenantId: row.tenant_id ?? null,
      travelAgencyName: row.travel_agency_name ?? null,
      dateOfBirth: row.date_of_birth ?? null,
      guestAddress: row.guest_address ?? null,
      arrivalTime: row.arrival_time ?? null,
      preCheckNotes: row.pre_check_notes ?? null,
      rejectionReason: row.rejection_reason ?? null,
      paymentStatus: row.payment_status ?? null,
      guestSignatureBase64: row.guest_signature_base64 ?? null,
      idDocumentBase64: row.id_document_base64 ?? null,
      ratePlanId: row.rate_plan_id ?? null,
      depositAmount: row.deposit_amount ?? null,
      depositDueDate: row.deposit_due_date ?? null,
      depositPaidAt: row.deposit_paid_at ?? null,
      paidAmount: row.paid_amount ?? 0,
      remainingBalance: row.remaining_balance ?? null,
      createdAt: row.created_at ?? null,
    } as Booking;
  }

  async findUnitForBooking(booking: { tenantId: string | null; propertyId: string | null; roomNumber: string; unitId: string | null }): Promise<Unit | undefined> {
    if (booking.unitId) {
      return this.getUnit(booking.unitId);
    }
    const trimmedRoom = booking.roomNumber.trim();
    const conditions = [eq(units.unitNumber, trimmedRoom)];
    if (booking.tenantId) conditions.push(eq(units.tenantId, booking.tenantId));
    if (booking.propertyId) conditions.push(eq(units.propertyId, booking.propertyId));
    if (!booking.tenantId && !booking.propertyId) return undefined;
    const result = await db.select().from(units).where(and(...conditions)).limit(1);
    return result[0];
  }

  async updateUnitStatusFromBooking(bookingId: string): Promise<void> {
    const booking = await this.getBooking(bookingId);
    if (!booking) return;

    const unit = await this.findUnitForBooking(booking);
    if (!unit) {
      logger.debug({ bookingId }, "Room status skip: no matching unit");
      return;
    }

    let newStatus: string | null = null;
    if (booking.status === "checked_in") {
      newStatus = "occupied";
    } else if (booking.status === "checked_out") {
      newStatus = "dirty";
    } else if (booking.status === "cancelled" || booking.status === "no_show") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const activeStatuses = ["booked", "confirmed", "precheck_submitted", "arrival_info_submitted", "checked_in"];
      const overlapping = await db.select().from(bookings).where(
        and(
          eq(bookings.tenantId, booking.tenantId!),
          eq(bookings.roomNumber, booking.roomNumber),
          inArray(bookings.status, activeStatuses),
          lte(bookings.checkInDate, tomorrow),
          gte(bookings.checkOutDate, today),
          sql`${bookings.id} != ${bookingId}`
        )
      ).limit(1);
      if (overlapping.length === 0) {
        newStatus = "ready";
      }
    }

    if (newStatus) {
      await this.updateUnit(unit.id, { status: newStatus });
      logger.info({ unitNumber: unit.unitNumber, newStatus, bookingId }, "Room status updated");
    }

    if (booking.status === "checked_out" && unit) {
      await this.autoCreateHousekeepingTask(unit, booking);
    }
  }

  private async autoCreateHousekeepingTask(unit: Unit, booking: Booking): Promise<void> {
    try {
      const duplicate = await db.select().from(housekeepingTasks)
        .where(and(
          eq(housekeepingTasks.unitId, unit.id),
          eq(housekeepingTasks.bookingId, booking.id),
          inArray(housekeepingTasks.status, ["pending", "assigned", "in_progress", "inspection"])
        ))
        .limit(1);

      if (duplicate.length > 0) {
        logger.debug({ bookingId: booking.id }, "Housekeeping skip: duplicate booking task");
        return;
      }

      const tenantId = booking.tenantId || booking.ownerId || "";
      const propertyId = booking.propertyId || unit.propertyId || "";
      if (!tenantId || !propertyId) {
        logger.debug({ unitNumber: unit.unitNumber }, "Housekeeping skip: missing tenantId or propertyId");
        return;
      }

      let priority: "normal" | "high" | "urgent" = "normal";
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const [nextBooking] = await db.select().from(bookings)
          .where(and(
            eq(bookings.unitId, unit.id),
            gte(bookings.checkInDate, now),
            inArray(bookings.status, ["booked", "confirmed", "precheck_submitted"])
          ))
          .orderBy(asc(bookings.checkInDate))
          .limit(1);

        if (nextBooking) {
          const nextCheckIn = new Date(nextBooking.checkInDate);
          const nextCheckInDay = new Date(nextCheckIn.getFullYear(), nextCheckIn.getMonth(), nextCheckIn.getDate());
          if (nextCheckInDay.getTime() === today.getTime()) {
            priority = "urgent";
          } else if (nextCheckInDay.getTime() === tomorrow.getTime()) {
            priority = "high";
          }
        }
      } catch (err) {
        logger.error({ err }, "Housekeeping priority engine error");
      }

      const staffUsers = await this.getUsersByProperty(propertyId);
      const housekeepers = staffUsers.filter(u => u.role === "staff");

      let assignedTo: string | null = null;
      if (housekeepers.length > 0) {
        const staffIds = housekeepers.map(h => h.id);
        const openTaskCounts = await db.select({
          assignedTo: housekeepingTasks.assignedTo,
          count: sql<number>`count(*)::int`,
        })
          .from(housekeepingTasks)
          .where(and(
            inArray(housekeepingTasks.assignedTo, staffIds),
            inArray(housekeepingTasks.status, ["pending", "assigned", "in_progress", "inspection"])
          ))
          .groupBy(housekeepingTasks.assignedTo);

        const countMap = new Map(openTaskCounts.map(r => [r.assignedTo, r.count]));
        let minCount = Infinity;
        for (const h of housekeepers) {
          const c = countMap.get(h.id) || 0;
          if (c < minCount) {
            minCount = c;
            assignedTo = h.id;
          }
        }
      }

      const task = await this.createHousekeepingTask({
        tenantId,
        propertyId,
        unitId: unit.id,
        bookingId: booking.id,
        roomNumber: unit.unitNumber,
        taskType: "cleaning",
        cleaningType: "checkout_cleaning",
        status: assignedTo ? "assigned" : "pending",
        priority,
        assignedTo,
        triggerSource: "auto_checkout",
      });

      logger.info({ unitNumber: unit.unitNumber, taskId: task.id, priority, assignedTo: assignedTo || "none" }, "Housekeeping task created");

      if (assignedTo) {
        const { notifyCleaningTaskAssigned } = await import("./notifications");
        await notifyCleaningTaskAssigned(task).catch(err => logger.error({ err }, "Housekeeping notification error"));
      }

      const adminStaff = staffUsers.filter(u =>
        u.role === "admin" || u.role === "reception" || u.role === "owner_admin"
      );
      for (const admin of adminStaff) {
        await this.createNotification({
          userId: admin.id,
          tenantId,
          title: "Housekeeping Task Created",
          message: `Room ${unit.unitNumber} checkout cleaning ${assignedTo ? "assigned" : "unassigned"} [${priority}]`,
          type: "housekeeping",
          read: false,
          actionUrl: "/housekeeping",
        }).catch(err => logger.error({ err }, "Housekeeping admin notification error"));
      }
    } catch (error) {
      logger.error({ err: error, unitNumber: unit.unitNumber }, "Housekeeping auto-create error");
    }
  }

  async autoCheckinIfReady(bookingId: string): Promise<void> {
    const booking = await this.getBooking(bookingId);
    if (!booking) {
      logger.debug({ bookingId }, "Auto checkin skipped: booking not found");
      return;
    }

    if (booking.status === "precheck_submitted" && booking.paymentStatus === "paid") {
      await this.updateBooking(bookingId, { status: "confirmed" });
      logger.info({ bookingId }, "Auto checkin confirmed");
    } else {
      logger.debug({ bookingId, status: booking.status, paymentStatus: booking.paymentStatus }, "Auto checkin skipped");
    }
  }

  async getAllBookings(tenantId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.tenantId, tenantId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsByHotel(hotelId: string, tenantId: string): Promise<Booking[]> {
    const conditions = [eq(users.hotelId, hotelId), eq(bookings.tenantId, tenantId)];
    const result = await db.select()
      .from(bookings)
      .innerJoin(users, eq(bookings.guestId, users.id))
      .where(and(...conditions))
      .orderBy(desc(bookings.createdAt));
    return result.map(r => r.bookings);
  }

  async getBookingsByProperty(propertyId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.propertyId, propertyId))
      .orderBy(desc(bookings.createdAt));
  }

  // ===================== ROOM SETTINGS =====================
  async getRoomSettings(bookingId: string): Promise<RoomSettings | undefined> {
    const result = await db.select().from(roomSettings)
      .where(eq(roomSettings.bookingId, bookingId))
      .limit(1);
    return result[0];
  }

  async createRoomSettings(settings: InsertRoomSettings): Promise<RoomSettings> {
    const result = await db.insert(roomSettings).values(settings).returning();
    return result[0];
  }

  async updateRoomSettings(bookingId: string, settings: Partial<RoomSettings>): Promise<RoomSettings | undefined> {
    const result = await db.update(roomSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(roomSettings.bookingId, bookingId))
      .returning();
    return result[0];
  }

  // ===================== SERVICE REQUESTS =====================
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const result = await db.select().from(serviceRequests)
      .where(eq(serviceRequests.id, id))
      .limit(1);
    return result[0];
  }

  async getServiceRequestsForGuest(guestId: string): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests)
      .where(eq(serviceRequests.guestId, guestId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getAllServiceRequests(tenantId: string): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests)
      .where(eq(serviceRequests.tenantId, tenantId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequestsByHotel(hotelId: string, tenantId: string): Promise<ServiceRequest[]> {
    const conditions = [eq(users.hotelId, hotelId), eq(serviceRequests.tenantId, tenantId)];
    const result = await db.select()
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.guestId, users.id))
      .where(and(...conditions))
      .orderBy(desc(serviceRequests.createdAt));
    return result.map(r => r.service_requests);
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const result = await db.insert(serviceRequests).values(request).returning();
    return result[0];
  }

  async updateServiceRequest(id: string, request: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const result = await db.update(serviceRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return result[0];
  }

  // ===================== NOTIFICATIONS =====================
  async getNotification(id: string): Promise<Notification | undefined> {
    const result = await db.select().from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return result[0];
  }

  async getNotificationsForUser(userId: string, tenantId: string): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId), eq(notifications.tenantId, tenantId)];
    return db.select().from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async getAllNotifications(tenantId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByHotel(hotelId: string, tenantId: string): Promise<Notification[]> {
    const conditions = [eq(users.hotelId, hotelId), eq(notifications.tenantId, tenantId)];
    const result = await db.select()
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
    return result.map(r => r.notifications);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // ===================== DOOR ACTION LOGS =====================
  async createDoorActionLog(log: InsertDoorActionLog): Promise<DoorActionLog> {
    const result = await db.insert(doorActionLogs).values(log).returning();
    return result[0];
  }

  async getAllDoorActionLogs(tenantId: string): Promise<DoorActionLog[]> {
    return db.select().from(doorActionLogs)
      .where(eq(doorActionLogs.tenantId, tenantId))
      .orderBy(desc(doorActionLogs.createdAt));
  }

  async getDoorActionLogsByHotel(hotelId: string, tenantId: string): Promise<DoorActionLog[]> {
    const conditions = [eq(users.hotelId, hotelId), eq(doorActionLogs.tenantId, tenantId)];
    const result = await db.select()
      .from(doorActionLogs)
      .innerJoin(users, eq(doorActionLogs.guestId, users.id))
      .where(and(...conditions))
      .orderBy(desc(doorActionLogs.createdAt));
    return result.map(r => r.door_action_logs);
  }

  async getDoorActionLogsForRoom(roomNumber: string): Promise<DoorActionLog[]> {
    return db.select().from(doorActionLogs)
      .where(eq(doorActionLogs.roomNumber, roomNumber))
      .orderBy(desc(doorActionLogs.createdAt));
  }

  // ===================== CREDENTIAL LOGS =====================
  async createCredentialLog(log: InsertCredentialLog): Promise<CredentialLog> {
    const result = await db.insert(credentialLogs).values(log).returning();
    return result[0];
  }

  async getCredentialLogsForGuest(guestId: string): Promise<CredentialLog[]> {
    return db.select().from(credentialLogs)
      .where(eq(credentialLogs.guestId, guestId))
      .orderBy(desc(credentialLogs.createdAt));
  }

  // ===================== USER UPDATES =====================
  async updateUserPassword(userId: string, password: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ password })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserLanguage(userId: string, language: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ language })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getGuestWithPassword(guestId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(and(eq(users.id, guestId), eq(users.role, "guest")))
      .limit(1);
    return result[0];
  }

  // ===================== CHAT MESSAGES =====================
  async getChatMessagesForGuest(guestId: string, hotelId: string, tenantId: string): Promise<ChatMessage[]> {
    const conditions = [eq(chatMessages.guestId, guestId), eq(chatMessages.hotelId, hotelId), eq(chatMessages.tenantId, tenantId)];
    return db.select().from(chatMessages)
      .where(and(...conditions))
      .orderBy(chatMessages.createdAt);
  }

  async getChatMessagesForHotel(hotelId: string, tenantId: string, guestId?: string): Promise<ChatMessage[]> {
    const conditions = [eq(chatMessages.hotelId, hotelId), eq(chatMessages.tenantId, tenantId)];
    if (guestId) {
      conditions.push(eq(chatMessages.guestId, guestId));
    }
    return db.select().from(chatMessages)
      .where(and(...conditions))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async getGuestsWithChats(hotelId: string, tenantId: string): Promise<{ guestId: string; lastMessage: string; lastMessageAt: Date | null }[]> {
    const conditions = [eq(chatMessages.hotelId, hotelId), eq(chatMessages.threadType, "guest_service"), eq(chatMessages.tenantId, tenantId)];
    const messages = await db.select().from(chatMessages)
      .where(and(...conditions))
      .orderBy(desc(chatMessages.createdAt));
    
    const guestMap = new Map<string, { lastMessage: string; lastMessageAt: Date | null }>();
    for (const msg of messages) {
      if (!guestMap.has(msg.guestId)) {
        guestMap.set(msg.guestId, { lastMessage: msg.message, lastMessageAt: msg.createdAt });
      }
    }
    
    return Array.from(guestMap.entries()).map(([guestId, data]) => ({
      guestId,
      ...data,
    }));
  }

  async getInternalMessages(hotelId: string, tenantId: string): Promise<ChatMessage[]> {
    const conditions = [eq(chatMessages.hotelId, hotelId), eq(chatMessages.threadType, "internal"), eq(chatMessages.tenantId, tenantId)];
    return db.select().from(chatMessages)
      .where(and(...conditions))
      .orderBy(chatMessages.createdAt);
  }

  async getEscalationMessages(hotelId: string, tenantId: string): Promise<ChatMessage[]> {
    const conditions = [eq(chatMessages.hotelId, hotelId), eq(chatMessages.threadType, "escalation"), eq(chatMessages.tenantId, tenantId)];
    return db.select().from(chatMessages)
      .where(and(...conditions))
      .orderBy(chatMessages.createdAt);
  }

  async getChatMessagesByThreadType(hotelId: string, threadType: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(and(eq(chatMessages.hotelId, hotelId), eq(chatMessages.threadType, threadType)))
      .orderBy(chatMessages.createdAt);
  }

  async getStaffDmMessages(conversationKey: string, hotelId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(and(
        eq(chatMessages.hotelId, hotelId),
        eq(chatMessages.threadType, "staff_dm"),
        eq(chatMessages.guestId, conversationKey)
      ))
      .orderBy(chatMessages.createdAt);
  }

  async getStaffDmConversations(userId: string, hotelIds: string[]): Promise<{ conversationKey: string; peerId: string; lastMessage: string; lastMessageAt: Date | null }[]> {
    if (hotelIds.length === 0) return [];
    const allDms: ChatMessage[] = [];
    for (const hid of hotelIds) {
      const msgs = await db.select().from(chatMessages)
        .where(and(
          eq(chatMessages.hotelId, hid),
          eq(chatMessages.threadType, "staff_dm")
        ))
        .orderBy(chatMessages.createdAt);
      allDms.push(...msgs);
    }
    const myDms = allDms.filter(m => {
      const parts = m.guestId.replace("dm_", "").split("_");
      return parts.includes(userId);
    });
    const convMap = new Map<string, { lastMessage: string; lastMessageAt: Date | null }>();
    for (const msg of myDms) {
      convMap.set(msg.guestId, { lastMessage: msg.message, lastMessageAt: msg.createdAt });
    }
    return Array.from(convMap.entries()).map(([conversationKey, data]) => {
      const parts = conversationKey.replace("dm_", "").split("_");
      const peerId = parts.find(p => p !== userId) || parts[0];
      return { conversationKey, peerId, ...data };
    });
  }

  // ===================== ESCALATIONS =====================
  async getEscalation(id: string): Promise<Escalation | undefined> {
    const result = await db.select().from(escalations).where(eq(escalations.id, id)).limit(1);
    return result[0];
  }

  async getEscalationByMessageId(messageId: string): Promise<Escalation | undefined> {
    const result = await db.select().from(escalations).where(eq(escalations.messageId, messageId)).limit(1);
    return result[0];
  }

  async getEscalationsByHotel(hotelId: string): Promise<Escalation[]> {
    return db.select().from(escalations)
      .where(eq(escalations.hotelId, hotelId))
      .orderBy(desc(escalations.createdAt));
  }

  async createEscalation(escalation: InsertEscalation): Promise<Escalation> {
    const result = await db.insert(escalations).values(escalation).returning();
    return result[0];
  }

  async updateEscalation(id: string, updates: Partial<Escalation>): Promise<Escalation | undefined> {
    const result = await db.update(escalations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(escalations.id, id))
      .returning();
    return result[0];
  }

  async createEscalationReply(reply: InsertEscalationReply): Promise<EscalationReply> {
    const result = await db.insert(escalationReplies).values(reply).returning();
    return result[0];
  }

  async getEscalationReplies(escalationId: string): Promise<EscalationReply[]> {
    return db.select().from(escalationReplies)
      .where(eq(escalationReplies.escalationId, escalationId))
      .orderBy(escalationReplies.createdAt);
  }

  // ===================== FINANCIAL TRANSACTIONS =====================
  async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
    const result = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id)).limit(1);
    return result[0];
  }

  async getFinancialTransactionsByHotel(hotelId: string, tenantId: string): Promise<FinancialTransaction[]> {
    const conditions = [eq(financialTransactions.hotelId, hotelId), eq(financialTransactions.tenantId, tenantId)];
    return db.select().from(financialTransactions)
      .where(and(...conditions))
      .orderBy(desc(financialTransactions.createdAt));
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const result = await db.insert(financialTransactions).values(transaction).returning();
    return result[0];
  }

  async updateFinancialTransaction(id: string, transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction | undefined> {
    const result = await db.update(financialTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(financialTransactions.id, id))
      .returning();
    return result[0];
  }

  async voidFinancialTransaction(id: string, voidedBy: string, reason: string): Promise<FinancialTransaction | undefined> {
    const result = await db.update(financialTransactions)
      .set({
        paymentStatus: "voided",
        voidedAt: new Date(),
        voidedBy,
        voidReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(financialTransactions.id, id))
      .returning();
    return result[0];
  }

  async getFinancialTransactionsByDateRange(hotelId: string, startDate: Date, endDate: Date): Promise<FinancialTransaction[]> {
    return db.select().from(financialTransactions)
      .where(and(
        eq(financialTransactions.hotelId, hotelId),
        gte(financialTransactions.createdAt, startDate),
        lte(financialTransactions.createdAt, endDate)
      ))
      .orderBy(desc(financialTransactions.createdAt));
  }

  // ===================== FINANCIAL AUDIT LOGS =====================
  async createFinancialAuditLog(log: InsertFinancialAuditLog): Promise<FinancialAuditLog> {
    const result = await db.insert(financialAuditLogs).values(log).returning();
    return result[0];
  }

  async getFinancialAuditLogs(hotelId: string, tenantId: string): Promise<FinancialAuditLog[]> {
    const conditions = [eq(financialAuditLogs.hotelId, hotelId), eq(financialAuditLogs.tenantId, tenantId)];
    return db.select().from(financialAuditLogs)
      .where(and(...conditions))
      .orderBy(desc(financialAuditLogs.createdAt));
  }

  async getAuditLogsForTransaction(transactionId: string): Promise<FinancialAuditLog[]> {
    return db.select().from(financialAuditLogs)
      .where(eq(financialAuditLogs.transactionId, transactionId))
      .orderBy(desc(financialAuditLogs.createdAt));
  }

  // ===================== NO-SHOW RECORDS =====================
  async createNoShowRecord(record: InsertNoShowRecord): Promise<NoShowRecord> {
    const result = await db.insert(noShowRecords).values(record).returning();
    return result[0];
  }

  async getNoShowRecordsByHotel(hotelId: string, tenantId: string): Promise<NoShowRecord[]> {
    const conditions = [eq(noShowRecords.hotelId, hotelId), eq(noShowRecords.tenantId, tenantId)];
    return db.select().from(noShowRecords)
      .where(and(...conditions))
      .orderBy(desc(noShowRecords.createdAt));
  }

  // ===================== QUOTE REQUESTS =====================
  async createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest> {
    const result = await db.insert(quoteRequests).values(request).returning();
    return result[0];
  }

  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    return db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | undefined> {
    const result = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
    return result[0];
  }

  async updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<QuoteRequest | undefined> {
    const result = await db.update(quoteRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quoteRequests.id, id))
      .returning();
    return result[0];
  }

  // ===================== QUOTE NOTES =====================
  async createQuoteNote(note: InsertQuoteNote): Promise<QuoteNote> {
    const result = await db.insert(quoteNotes).values(note).returning();
    return result[0];
  }

  async getQuoteNotes(quoteRequestId: string): Promise<QuoteNote[]> {
    return db.select().from(quoteNotes)
      .where(eq(quoteNotes.quoteRequestId, quoteRequestId))
      .orderBy(desc(quoteNotes.createdAt));
  }

  // ===================== OSS SUPER ADMIN =====================
  async adminGetAllProperties(): Promise<Property[]> {
    return db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async adminGetAllHotels(): Promise<Hotel[]> {
    return db.select().from(hotels).orderBy(desc(hotels.createdAt));
  }

  async adminGetAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async adminGetAllRoomPreparationOrders(): Promise<RoomPreparationOrder[]> {
    return db.select().from(roomPreparationOrders).orderBy(desc(roomPreparationOrders.createdAt));
  }

  async getOssSuperAdminUsers(): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.role, "oss_super_admin"))
      .orderBy(desc(users.createdAt));
  }

  async getQuoteRequestsByStatus(status: string): Promise<QuoteRequest[]> {
    return db.select().from(quoteRequests)
      .where(eq(quoteRequests.status, status))
      .orderBy(desc(quoteRequests.createdAt));
  }

  async getQuoteRequestsCount(): Promise<{ total: number; byStatus: Record<string, number>; byCountry: Record<string, number> }> {
    const allRequests = await db.select().from(quoteRequests);
    
    const byStatus: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    
    allRequests.forEach(req => {
      byStatus[req.status] = (byStatus[req.status] || 0) + 1;
      byCountry[req.country] = (byCountry[req.country] || 0) + 1;
    });
    
    return {
      total: allRequests.length,
      byStatus,
      byCountry,
    };
  }

  // ===================== ROOM PREPARATION ORDERS =====================
  async getRoomPreparationOrder(id: string): Promise<RoomPreparationOrder | undefined> {
    const result = await db.select().from(roomPreparationOrders).where(eq(roomPreparationOrders.id, id)).limit(1);
    return result[0];
  }

  async getRoomPreparationOrdersByGuest(guestId: string, tenantId: string): Promise<RoomPreparationOrder[]> {
    const conditions = [eq(roomPreparationOrders.guestId, guestId), eq(roomPreparationOrders.tenantId, tenantId)];
    return db.select().from(roomPreparationOrders)
      .where(and(...conditions))
      .orderBy(desc(roomPreparationOrders.createdAt));
  }

  async getRoomPreparationOrdersByHotel(hotelId: string, tenantId: string): Promise<RoomPreparationOrder[]> {
    const conditions = [eq(roomPreparationOrders.hotelId, hotelId), eq(roomPreparationOrders.tenantId, tenantId)];
    return db.select().from(roomPreparationOrders)
      .where(and(...conditions))
      .orderBy(desc(roomPreparationOrders.createdAt));
  }

  async getAllRoomPreparationOrders(tenantId: string): Promise<RoomPreparationOrder[]> {
    return db.select().from(roomPreparationOrders)
      .where(eq(roomPreparationOrders.tenantId, tenantId))
      .orderBy(desc(roomPreparationOrders.createdAt));
  }

  async createRoomPreparationOrder(order: InsertRoomPreparationOrder): Promise<RoomPreparationOrder> {
    const result = await db.insert(roomPreparationOrders).values(order).returning();
    return result[0];
  }

  async updateRoomPreparationOrder(id: string, updates: Partial<RoomPreparationOrder>): Promise<RoomPreparationOrder | undefined> {
    const result = await db.update(roomPreparationOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roomPreparationOrders.id, id))
      .returning();
    return result[0];
  }

  // ===================== AUDIT LOGS =====================
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogsByOwner(ownerId: string, limitCount: number = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(eq(auditLogs.ownerId, ownerId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitCount);
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }

  async getAuditLogsFiltered(ownerId: string, filters: {
    action?: string; entityType?: string; search?: string;
    limit: number; offset: number;
  }): Promise<{ logs: AuditLog[]; total: number; actions: string[]; entityTypes: string[] }> {
    const conditions = [eq(auditLogs.ownerId, ownerId)];
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters.search) {
      conditions.push(
        or(
          ilike(auditLogs.description, `%${filters.search}%`),
          ilike(auditLogs.action, `%${filters.search}%`),
          ilike(auditLogs.entityType, `%${filters.search}%`)
        )!
      );
    }
    const where = and(...conditions);

    const [logs, countResult, actionsResult, entityTypesResult] = await Promise.all([
      db.select().from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(filters.limit)
        .offset(filters.offset),
      db.select({ count: count() }).from(auditLogs).where(where),
      db.selectDistinct({ action: auditLogs.action }).from(auditLogs)
        .where(eq(auditLogs.ownerId, ownerId)),
      db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs)
        .where(eq(auditLogs.ownerId, ownerId)),
    ]);

    return {
      logs,
      total: countResult[0]?.count || 0,
      actions: actionsResult.map(r => r.action).sort(),
      entityTypes: entityTypesResult.map(r => r.entityType).sort(),
    };
  }

  async getAuditLogsAdmin(filters: {
    tenantId?: string; action?: string; entityType?: string;
    from?: Date; to?: Date; search?: string;
    limit: number; offset: number;
  }): Promise<{ logs: AuditLog[]; total: number; actions: string[]; entityTypes: string[] }> {
    const conditions: any[] = [];
    if (filters.tenantId) conditions.push(eq(auditLogs.tenantId, filters.tenantId));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters.from) conditions.push(gte(auditLogs.createdAt, filters.from));
    if (filters.to) conditions.push(lte(auditLogs.createdAt, filters.to));
    if (filters.search) {
      conditions.push(
        or(
          ilike(auditLogs.description, `%${filters.search}%`),
          ilike(auditLogs.action, `%${filters.search}%`),
          ilike(auditLogs.entityType, `%${filters.search}%`)
        )!
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, countResult, actionsResult, entityTypesResult] = await Promise.all([
      db.select().from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(filters.limit)
        .offset(filters.offset),
      db.select({ count: count() }).from(auditLogs).where(where),
      db.selectDistinct({ action: auditLogs.action }).from(auditLogs),
      db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs),
    ]);

    return {
      logs,
      total: countResult[0]?.count || 0,
      actions: actionsResult.map(r => r.action).sort(),
      entityTypes: entityTypesResult.map(r => r.entityType).sort(),
    };
  }

  // ===================== FEATURE FLAGS =====================
  async getFeatureFlagOverrides(ownerId: string): Promise<FeatureFlagOverride[]> {
    return db.select().from(featureFlagOverrides)
      .where(eq(featureFlagOverrides.ownerId, ownerId));
  }

  async setFeatureFlagOverride(override: InsertFeatureFlagOverride): Promise<FeatureFlagOverride> {
    const existing = await db.select().from(featureFlagOverrides)
      .where(and(
        eq(featureFlagOverrides.ownerId, override.ownerId),
        eq(featureFlagOverrides.featureName, override.featureName)
      )).limit(1);
    
    if (existing[0]) {
      const result = await db.update(featureFlagOverrides)
        .set({ enabled: override.enabled, reason: override.reason, expiresAt: override.expiresAt })
        .where(eq(featureFlagOverrides.id, existing[0].id))
        .returning();
      return result[0];
    }
    const result = await db.insert(featureFlagOverrides).values(override).returning();
    return result[0];
  }

  async deleteFeatureFlagOverride(id: string): Promise<void> {
    await db.delete(featureFlagOverrides).where(eq(featureFlagOverrides.id, id));
  }

  async hasFeature(ownerId: string, featureName: string): Promise<boolean> {
    const { getOwnerFeatures } = await import("./utils/planResolver");
    const { planCode, features } = await getOwnerFeatures(ownerId);

    const sub = await this.getSubscriptionByOwner(ownerId);
    if (!sub) return false;

    if (sub.planType === "trial" && sub.trialEndsAt) {
      if (new Date(sub.trialEndsAt) < new Date()) {
        return false;
      }
    }

    const access = features.features[featureName as keyof typeof features.features];
    let enabled = access === true || access === "limited";

    const overrides = await db.select().from(featureFlagOverrides)
      .where(and(
        eq(featureFlagOverrides.ownerId, ownerId),
        eq(featureFlagOverrides.featureName, featureName)
      )).limit(1);

    if (overrides[0]) {
      if (overrides[0].expiresAt && overrides[0].expiresAt < new Date()) {
        await db.delete(featureFlagOverrides).where(eq(featureFlagOverrides.id, overrides[0].id));
      } else {
        enabled = overrides[0].enabled;
      }
    }

    return enabled;
  }

  // ===================== USAGE METERS =====================
  async getUsageMeters(ownerId: string): Promise<UsageMeter[]> {
    return db.select().from(usageMeters)
      .where(eq(usageMeters.ownerId, ownerId));
  }

  async getUsageMeter(ownerId: string, metricType: string): Promise<UsageMeter | undefined> {
    const result = await db.select().from(usageMeters)
      .where(and(eq(usageMeters.ownerId, ownerId), eq(usageMeters.metricType, metricType)))
      .limit(1);
    return result[0];
  }

  async upsertUsageMeter(meter: InsertUsageMeter): Promise<UsageMeter> {
    const existing = await db.select().from(usageMeters)
      .where(and(eq(usageMeters.ownerId, meter.ownerId), eq(usageMeters.metricType, meter.metricType)))
      .limit(1);
    
    if (existing[0]) {
      const result = await db.update(usageMeters)
        .set({ currentValue: meter.currentValue, maxAllowed: meter.maxAllowed, lastUpdated: new Date() })
        .where(eq(usageMeters.id, existing[0].id))
        .returning();
      return result[0];
    }
    const result = await db.insert(usageMeters).values(meter).returning();
    return result[0];
  }

  async refreshUsageMeters(ownerId: string): Promise<UsageMeter[]> {
    const { getOwnerFeatures } = await import("./utils/planResolver");
    const { features: config } = await getOwnerFeatures(ownerId);

    const [propCount] = await db.select({ count: count() }).from(properties).where(eq(properties.ownerId, ownerId));
    const [unitCount] = await db.select({ count: count() }).from(units).where(eq(units.ownerId, ownerId));
    const [deviceCount] = await db.select({ count: count() }).from(devices).where(eq(devices.ownerId, ownerId));
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.ownerId, ownerId));

    const metrics = [
      { metricType: "properties", currentValue: propCount.count, maxAllowed: config.limits.maxProperties },
      { metricType: "units", currentValue: unitCount.count, maxAllowed: config.limits.maxUnitsPerProperty * config.limits.maxProperties },
      { metricType: "devices", currentValue: deviceCount.count, maxAllowed: (config.limits as any).maxDevices || 999 },
      { metricType: "users", currentValue: userCount.count, maxAllowed: config.limits.maxStaff },
    ];

    const results: UsageMeter[] = [];
    for (const m of metrics) {
      const result = await this.upsertUsageMeter({ ownerId, ...m });
      results.push(result);
    }
    return results;
  }

  // ===================== WHITE LABEL =====================
  async getWhiteLabelSettings(ownerId: string): Promise<WhiteLabelSettings | undefined> {
    const result = await db.select().from(whiteLabelSettings)
      .where(eq(whiteLabelSettings.ownerId, ownerId)).limit(1);
    return result[0];
  }

  async upsertWhiteLabelSettings(settings: InsertWhiteLabelSettings): Promise<WhiteLabelSettings> {
    const existing = await db.select().from(whiteLabelSettings)
      .where(eq(whiteLabelSettings.ownerId, settings.ownerId)).limit(1);
    
    if (existing[0]) {
      const result = await db.update(whiteLabelSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(whiteLabelSettings.id, existing[0].id))
        .returning();
      return result[0];
    }
    const result = await db.insert(whiteLabelSettings).values(settings).returning();
    return result[0];
  }

  // ===================== ONBOARDING =====================
  async getOnboardingProgress(ownerId: string): Promise<OnboardingProgress | undefined> {
    const result = await db.select().from(onboardingProgress)
      .where(eq(onboardingProgress.ownerId, ownerId)).limit(1);
    return result[0];
  }

  async upsertOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const existing = await db.select().from(onboardingProgress)
      .where(eq(onboardingProgress.ownerId, progress.ownerId)).limit(1);
    
    if (existing[0]) {
      const result = await db.update(onboardingProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(onboardingProgress.id, existing[0].id))
        .returning();
      return result[0];
    }
    const result = await db.insert(onboardingProgress).values(progress).returning();
    return result[0];
  }

  // ===================== BILLING =====================
  async getBillingInfo(ownerId: string): Promise<BillingInfo | undefined> {
    const result = await db.select().from(billingInfo)
      .where(eq(billingInfo.ownerId, ownerId)).limit(1);
    return result[0];
  }

  async upsertBillingInfo(info: InsertBillingInfo): Promise<BillingInfo> {
    const existing = await db.select().from(billingInfo)
      .where(eq(billingInfo.ownerId, info.ownerId)).limit(1);
    
    if (existing[0]) {
      const result = await db.update(billingInfo)
        .set({ ...info, updatedAt: new Date() })
        .where(eq(billingInfo.id, existing[0].id))
        .returning();
      return result[0];
    }
    const result = await db.insert(billingInfo).values(info).returning();
    return result[0];
  }

  // ===================== INVOICES =====================
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoicesByOwner(ownerId: string): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.ownerId, ownerId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices).set(updates).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  // ===================== DEVICE TELEMETRY =====================
  async createDeviceTelemetry(telemetry: InsertDeviceTelemetry): Promise<DeviceTelemetry> {
    const result = await db.insert(deviceTelemetry).values(telemetry).returning();
    return result[0];
  }

  async getDeviceTelemetry(deviceId: string, limitCount: number = 100): Promise<DeviceTelemetry[]> {
    return db.select().from(deviceTelemetry)
      .where(eq(deviceTelemetry.deviceId, deviceId))
      .orderBy(desc(deviceTelemetry.createdAt))
      .limit(limitCount);
  }

  // ===================== ANALYTICS SNAPSHOTS =====================
  async createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const result = await db.insert(analyticsSnapshots).values(snapshot).returning();
    return result[0];
  }

  async getAnalyticsSnapshots(ownerId: string, snapshotType: string): Promise<AnalyticsSnapshot[]> {
    return db.select().from(analyticsSnapshots)
      .where(and(eq(analyticsSnapshots.ownerId, ownerId), eq(analyticsSnapshots.snapshotType, snapshotType)))
      .orderBy(desc(analyticsSnapshots.createdAt));
  }

  // ===================== STAFF INVITATIONS =====================
  async getStaffInvitationsByProperty(propertyId: string): Promise<StaffInvitation[]> {
    return db.select().from(staffInvitations)
      .where(eq(staffInvitations.propertyId, propertyId))
      .orderBy(desc(staffInvitations.createdAt));
  }

  async getStaffInvitationByEmail(propertyId: string, email: string): Promise<StaffInvitation | undefined> {
    const result = await db.select().from(staffInvitations)
      .where(and(eq(staffInvitations.propertyId, propertyId), eq(staffInvitations.email, email)))
      .limit(1);
    return result[0];
  }

  async createStaffInvitation(invitation: InsertStaffInvitation): Promise<StaffInvitation> {
    const result = await db.insert(staffInvitations).values(invitation).returning();
    return result[0];
  }

  async updateStaffInvitation(id: string, updates: Partial<StaffInvitation>): Promise<StaffInvitation | undefined> {
    const result = await db.update(staffInvitations).set(updates).where(eq(staffInvitations.id, id)).returning();
    return result[0];
  }

  async deleteStaffInvitation(id: string): Promise<void> {
    await db.delete(staffInvitations).where(eq(staffInvitations.id, id));
  }

  async getStaffInvitationByToken(token: string): Promise<StaffInvitation | undefined> {
    const result = await db.select().from(staffInvitations)
      .where(eq(staffInvitations.inviteToken, token))
      .limit(1);
    return result[0];
  }

  // ===================== PASSWORD RESET TOKENS =====================
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const result = await db.insert(passwordResetTokens).values(token).returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    return result[0];
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }

  // ===================== FINANCE CENTER - REVENUES =====================
  async createRevenue(revenue: InsertRevenue): Promise<Revenue> {
    const result = await db.insert(revenues).values(revenue).returning();
    return result[0];
  }

  async getRevenuesByHotel(hotelId: string, tenantId: string): Promise<Revenue[]> {
    const conditions = [eq(revenues.hotelId, hotelId), eq(revenues.tenantId, tenantId)];
    return db.select().from(revenues)
      .where(and(...conditions))
      .orderBy(desc(revenues.createdAt));
  }

  async getRevenuesByOwner(ownerId: string, tenantId: string): Promise<Revenue[]> {
    const conditions = [eq(revenues.ownerId, ownerId), eq(revenues.tenantId, tenantId)];
    return db.select().from(revenues)
      .where(and(...conditions))
      .orderBy(desc(revenues.createdAt));
  }

  async getRevenuesByProperty(propertyId: string): Promise<Revenue[]> {
    return db.select().from(revenues)
      .where(eq(revenues.propertyId, propertyId))
      .orderBy(desc(revenues.createdAt));
  }

  // ===================== FINANCE CENTER - EXPENSES =====================
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async getExpensesByHotel(hotelId: string, tenantId: string): Promise<Expense[]> {
    const conditions = [eq(expenses.hotelId, hotelId), eq(expenses.tenantId, tenantId)];
    return db.select().from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.createdAt));
  }

  async getExpensesByOwner(ownerId: string, tenantId: string): Promise<Expense[]> {
    const conditions = [eq(expenses.ownerId, ownerId), eq(expenses.tenantId, tenantId)];
    return db.select().from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.createdAt));
  }

  // ===================== FINANCE CENTER - PAYROLL =====================
  async createPayrollConfig(config: InsertPayrollConfig): Promise<PayrollConfig> {
    const result = await db.insert(payrollConfigs).values(config).returning();
    return result[0];
  }

  async getPayrollConfigsByHotel(hotelId: string, tenantId: string): Promise<PayrollConfig[]> {
    const conditions = [eq(payrollConfigs.hotelId, hotelId), eq(payrollConfigs.tenantId, tenantId)];
    return db.select().from(payrollConfigs)
      .where(and(...conditions))
      .orderBy(desc(payrollConfigs.createdAt));
  }

  async getPayrollConfigsByOwner(ownerId: string, tenantId: string): Promise<PayrollConfig[]> {
    const conditions = [eq(payrollConfigs.ownerId, ownerId), eq(payrollConfigs.tenantId, tenantId)];
    return db.select().from(payrollConfigs)
      .where(and(...conditions))
      .orderBy(desc(payrollConfigs.createdAt));
  }

  async getPayrollConfigByStaff(staffId: string): Promise<PayrollConfig | undefined> {
    const result = await db.select().from(payrollConfigs)
      .where(eq(payrollConfigs.staffId, staffId))
      .limit(1);
    return result[0];
  }

  async updatePayrollConfig(id: string, updates: Partial<PayrollConfig>): Promise<PayrollConfig | undefined> {
    const result = await db.update(payrollConfigs).set(updates).where(eq(payrollConfigs.id, id)).returning();
    return result[0];
  }

  async createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry> {
    const result = await db.insert(payrollEntries).values(entry).returning();
    return result[0];
  }

  async getPayrollEntriesByHotel(hotelId: string, tenantId: string): Promise<PayrollEntry[]> {
    const conditions = [eq(payrollEntries.hotelId, hotelId), eq(payrollEntries.tenantId, tenantId)];
    return db.select().from(payrollEntries)
      .where(and(...conditions))
      .orderBy(desc(payrollEntries.createdAt));
  }

  async getPayrollEntriesByOwner(ownerId: string, tenantId: string): Promise<PayrollEntry[]> {
    const conditions = [eq(payrollEntries.ownerId, ownerId), eq(payrollEntries.tenantId, tenantId)];
    return db.select().from(payrollEntries)
      .where(and(...conditions))
      .orderBy(desc(payrollEntries.createdAt));
  }

  async updatePayrollEntry(id: string, updates: Partial<PayrollEntry>): Promise<PayrollEntry | undefined> {
    const result = await db.update(payrollEntries).set(updates).where(eq(payrollEntries.id, id)).returning();
    return result[0];
  }

  // ===================== FINANCE CENTER - CASH ACCOUNTS =====================
  async createCashAccount(account: InsertCashAccount): Promise<CashAccount> {
    const result = await db.insert(cashAccounts).values(account).returning();
    return result[0];
  }

  async getCashAccountsByHotel(hotelId: string, tenantId: string): Promise<CashAccount[]> {
    const conditions = [eq(cashAccounts.hotelId, hotelId), eq(cashAccounts.tenantId, tenantId)];
    return db.select().from(cashAccounts)
      .where(and(...conditions))
      .orderBy(desc(cashAccounts.createdAt));
  }

  async getCashAccountsByOwner(ownerId: string, tenantId: string): Promise<CashAccount[]> {
    const conditions = [eq(cashAccounts.ownerId, ownerId), eq(cashAccounts.tenantId, tenantId)];
    return db.select().from(cashAccounts)
      .where(and(...conditions))
      .orderBy(desc(cashAccounts.createdAt));
  }

  async updateCashAccount(id: string, updates: Partial<CashAccount>): Promise<CashAccount | undefined> {
    const result = await db.update(cashAccounts).set(updates).where(eq(cashAccounts.id, id)).returning();
    return result[0];
  }

  // ===================== FINANCE CENTER - RECURRING EXPENSES =====================
  async createRecurringExpense(expense: InsertRecurringExpense): Promise<RecurringExpense> {
    const result = await db.insert(recurringExpenses).values(expense).returning();
    return result[0];
  }

  async getRecurringExpensesByHotel(hotelId: string, tenantId: string): Promise<RecurringExpense[]> {
    const conditions = [eq(recurringExpenses.hotelId, hotelId), eq(recurringExpenses.tenantId, tenantId)];
    return db.select().from(recurringExpenses)
      .where(and(...conditions))
      .orderBy(desc(recurringExpenses.createdAt));
  }

  async getRecurringExpensesByOwner(ownerId: string, tenantId: string): Promise<RecurringExpense[]> {
    const conditions = [eq(recurringExpenses.ownerId, ownerId), eq(recurringExpenses.tenantId, tenantId)];
    return db.select().from(recurringExpenses)
      .where(and(...conditions))
      .orderBy(desc(recurringExpenses.createdAt));
  }

  async updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | undefined> {
    const result = await db.update(recurringExpenses).set(updates).where(eq(recurringExpenses.id, id)).returning();
    return result[0];
  }

  async getDueRecurringExpenses(): Promise<RecurringExpense[]> {
    return db.select().from(recurringExpenses)
      .where(and(eq(recurringExpenses.isActive, true), lte(recurringExpenses.nextRunAt, new Date())));
  }

  // ===================== PAYMENT ORDERS =====================
  async getPaymentOrders(): Promise<PaymentOrder[]> {
    return db.select().from(paymentOrders).orderBy(desc(paymentOrders.createdAt));
  }

  async getPaymentOrdersByOwner(ownerId: string): Promise<PaymentOrder[]> {
    return db.select().from(paymentOrders)
      .where(eq(paymentOrders.ownerId, ownerId))
      .orderBy(desc(paymentOrders.createdAt));
  }

  async getPaymentOrdersByStatus(status: string): Promise<PaymentOrder[]> {
    return db.select().from(paymentOrders)
      .where(eq(paymentOrders.status, status))
      .orderBy(desc(paymentOrders.createdAt));
  }

  async getPaymentOrder(id: string): Promise<PaymentOrder | undefined> {
    const result = await db.select().from(paymentOrders).where(eq(paymentOrders.id, id)).limit(1);
    return result[0];
  }

  async createPaymentOrder(order: InsertPaymentOrder): Promise<PaymentOrder> {
    const result = await db.insert(paymentOrders).values(order).returning();
    return result[0];
  }

  async updatePaymentOrder(id: string, updates: Partial<PaymentOrder>): Promise<PaymentOrder | undefined> {
    const result = await db.update(paymentOrders).set({ ...updates, updatedAt: new Date() }).where(eq(paymentOrders.id, id)).returning();
    return result[0];
  }

  // ===================== CONTRACTS =====================
  async getContracts(): Promise<Contract[]> {
    return db.select().from(contracts).orderBy(contracts.createdAt);
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [created] = await db.insert(contracts).values(contract).returning();
    return created;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const [updated] = await db.update(contracts).set(updates).where(eq(contracts.id, id)).returning();
    return updated;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // ===================== BOARD REPORTS =====================
  async getBoardReports(): Promise<BoardReport[]> {
    return db.select().from(boardReports).orderBy(boardReports.createdAt);
  }

  async getBoardReport(id: string): Promise<BoardReport | undefined> {
    const [report] = await db.select().from(boardReports).where(eq(boardReports.id, id)).limit(1);
    return report;
  }

  async createBoardReport(report: InsertBoardReport): Promise<BoardReport> {
    const [created] = await db.insert(boardReports).values(report).returning();
    return created;
  }

  async deleteBoardReport(id: string): Promise<void> {
    await db.delete(boardReports).where(eq(boardReports.id, id));
  }

  // ===================== STAFF BROADCAST MESSAGES =====================
  async createStaffMessage(message: InsertStaffMessage): Promise<StaffMessage> {
    const [created] = await db.insert(staffMessages).values(message).returning();
    return created;
  }

  async getStaffMessagesByHotel(hotelId: string): Promise<StaffMessage[]> {
    return db.select().from(staffMessages).where(eq(staffMessages.hotelId, hotelId)).orderBy(desc(staffMessages.createdAt));
  }

  async createStaffMessageStatus(status: InsertStaffMessageStatus): Promise<StaffMessageStatus> {
    const [created] = await db.insert(staffMessageStatus).values(status).returning();
    return created;
  }

  async getStaffMessageStatusByMessage(messageId: string): Promise<StaffMessageStatus[]> {
    return db.select().from(staffMessageStatus).where(eq(staffMessageStatus.messageId, messageId));
  }

  async getStaffMessageStatusByStaff(staffId: string): Promise<StaffMessageStatus[]> {
    return db.select().from(staffMessageStatus).where(eq(staffMessageStatus.staffId, staffId)).orderBy(desc(staffMessageStatus.readAt));
  }

  async markStaffMessageRead(messageId: string, staffId: string): Promise<void> {
    await db.update(staffMessageStatus)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(staffMessageStatus.messageId, messageId), eq(staffMessageStatus.staffId, staffId)));
  }

  // ===================== STAFF PERFORMANCE SCORES =====================
  async getStaffPerformanceScore(staffId: string, period: string): Promise<StaffPerformanceScore | undefined> {
    const [score] = await db.select().from(staffPerformanceScores)
      .where(and(eq(staffPerformanceScores.staffId, staffId), eq(staffPerformanceScores.period, period)))
      .limit(1);
    return score;
  }

  async getStaffPerformanceScoresByHotel(hotelId: string, period: string): Promise<StaffPerformanceScore[]> {
    return db.select().from(staffPerformanceScores)
      .where(and(eq(staffPerformanceScores.hotelId, hotelId), eq(staffPerformanceScores.period, period)));
  }

  async upsertStaffPerformanceScore(score: InsertStaffPerformanceScore): Promise<StaffPerformanceScore> {
    const existing = await this.getStaffPerformanceScore(score.staffId, score.period);
    if (existing) {
      const [updated] = await db.update(staffPerformanceScores)
        .set(score)
        .where(eq(staffPerformanceScores.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(staffPerformanceScores).values(score).returning();
    return created;
  }

  async getStaffPerformanceHistory(staffId: string): Promise<StaffPerformanceScore[]> {
    return db.select().from(staffPerformanceScores)
      .where(eq(staffPerformanceScores.staffId, staffId))
      .orderBy(desc(staffPerformanceScores.calculatedAt));
  }

  // ===================== STAFF FEEDBACK =====================
  async createStaffFeedback(feedback: InsertStaffFeedback): Promise<StaffFeedback> {
    const [created] = await db.insert(staffFeedback).values(feedback).returning();
    return created;
  }

  async getStaffFeedbackByStaff(staffId: string): Promise<StaffFeedback[]> {
    return db.select().from(staffFeedback).where(eq(staffFeedback.staffId, staffId)).orderBy(desc(staffFeedback.createdAt));
  }

  async getStaffFeedbackByHotel(hotelId: string): Promise<StaffFeedback[]> {
    return db.select().from(staffFeedback).where(eq(staffFeedback.hotelId, hotelId)).orderBy(desc(staffFeedback.createdAt));
  }
  // ===================== CONTRACT ACCEPTANCES =====================
  async createContractAcceptance(data: InsertContractAcceptance): Promise<ContractAcceptance> {
    const [created] = await db.insert(contractAcceptances).values(data).returning();
    return created;
  }

  async getLatestContractAcceptance(ownerId: string): Promise<ContractAcceptance | undefined> {
    const [latest] = await db.select().from(contractAcceptances)
      .where(eq(contractAcceptances.ownerId, ownerId))
      .orderBy(desc(contractAcceptances.createdAt))
      .limit(1);
    return latest;
  }

  // ===================== HOUSEKEEPING TASKS =====================
  async getHousekeepingTask(id: string): Promise<HousekeepingTask | undefined> {
    const [task] = await db.select().from(housekeepingTasks)
      .where(eq(housekeepingTasks.id, id)).limit(1);
    return task;
  }

  async createHousekeepingTask(task: InsertHousekeepingTask): Promise<HousekeepingTask> {
    const [created] = await db.insert(housekeepingTasks).values(task).returning();
    return created;
  }

  async getHousekeepingTasksByProperty(propertyId: string, tenantId: string): Promise<HousekeepingTask[]> {
    return db.select().from(housekeepingTasks)
      .where(and(
        eq(housekeepingTasks.propertyId, propertyId),
        eq(housekeepingTasks.tenantId, tenantId)
      ))
      .orderBy(desc(housekeepingTasks.createdAt));
  }

  async getHousekeepingTasksByStaff(userId: string): Promise<HousekeepingTask[]> {
    return db.select().from(housekeepingTasks)
      .where(eq(housekeepingTasks.assignedTo, userId))
      .orderBy(desc(housekeepingTasks.createdAt));
  }

  async updateHousekeepingTask(id: string, updates: Partial<HousekeepingTask>): Promise<HousekeepingTask | undefined> {
    const [updated] = await db.update(housekeepingTasks).set(updates)
      .where(eq(housekeepingTasks.id, id)).returning();
    return updated;
  }

  async getOpenHousekeepingTasksForUnit(unitId: string): Promise<HousekeepingTask[]> {
    return db.select().from(housekeepingTasks)
      .where(and(
        eq(housekeepingTasks.unitId, unitId),
        inArray(housekeepingTasks.status, ["pending", "assigned", "in_progress"])
      ))
      .orderBy(desc(housekeepingTasks.createdAt));
  }

  // ===================== EXTERNAL OTA BOOKINGS =====================
  async getExternalBooking(id: string): Promise<ExternalBooking | undefined> {
    const result = await db.select().from(externalBookings).where(eq(externalBookings.id, id)).limit(1);
    return result[0];
  }

  async getExternalBookingByExternalId(externalId: string, hotelId: string): Promise<ExternalBooking | undefined> {
    const result = await db.select().from(externalBookings)
      .where(and(eq(externalBookings.externalId, externalId), eq(externalBookings.hotelId, hotelId)))
      .limit(1);
    return result[0];
  }

  async getExternalBookingsByHotel(hotelId: string, tenantId: string): Promise<ExternalBooking[]> {
    return db.select().from(externalBookings)
      .where(and(eq(externalBookings.hotelId, hotelId), eq(externalBookings.tenantId, tenantId)))
      .orderBy(desc(externalBookings.createdAt));
  }

  async createExternalBooking(booking: InsertExternalBooking): Promise<ExternalBooking> {
    const result = await db.insert(externalBookings).values(booking).returning();
    return result[0];
  }

  async updateExternalBooking(id: string, updates: Partial<ExternalBooking>): Promise<ExternalBooking | undefined> {
    const result = await db.update(externalBookings).set(updates).where(eq(externalBookings.id, id)).returning();
    return result[0];
  }

  async deleteExternalBooking(id: string): Promise<void> {
    await db.delete(externalBookings).where(eq(externalBookings.id, id));
  }

  async getOtaIntegrationsByProperty(propertyId: string, tenantId: string): Promise<OtaIntegration[]> {
    return await db.select()
      .from(otaIntegrations)
      .where(and(
        eq(otaIntegrations.propertyId, propertyId),
        eq(otaIntegrations.tenantId, tenantId),
      ))
      .orderBy(asc(otaIntegrations.createdAt));
  }

  async getActiveOtaIntegrations(propertyId: string, tenantId?: string | null): Promise<OtaIntegration[]> {
    const conditions = [
      eq(otaIntegrations.propertyId, propertyId),
      eq(otaIntegrations.isActive, true),
    ];
    if (tenantId) {
      conditions.push(eq(otaIntegrations.tenantId, tenantId));
    }
    return await db.select()
      .from(otaIntegrations)
      .where(and(...conditions));
  }

  async getOtaIntegration(id: string): Promise<OtaIntegration | undefined> {
    const result = await db.select().from(otaIntegrations).where(eq(otaIntegrations.id, id)).limit(1);
    return result[0];
  }

  async createOtaIntegration(data: InsertOtaIntegration): Promise<OtaIntegration> {
    const result = await db.insert(otaIntegrations).values(data).returning();
    return result[0];
  }

  async updateOtaIntegration(id: string, updates: Partial<OtaIntegration>): Promise<OtaIntegration | undefined> {
    const result = await db.update(otaIntegrations).set(updates).where(eq(otaIntegrations.id, id)).returning();
    return result[0];
  }

  async deleteOtaIntegration(id: string): Promise<void> {
    await db.delete(otaIntegrations).where(eq(otaIntegrations.id, id));
  }

  async getOtaSyncLogs(propertyId: string, tenantId?: string | null, limit: number = 50): Promise<OtaSyncLog[]> {
    const conditions = [eq(otaSyncLogs.propertyId, propertyId)];
    if (tenantId) {
      conditions.push(eq(otaSyncLogs.tenantId, tenantId));
    }
    return await db.select()
      .from(otaSyncLogs)
      .where(and(...conditions))
      .orderBy(desc(otaSyncLogs.createdAt))
      .limit(limit);
  }

  async createOtaSyncLog(data: InsertOtaSyncLog): Promise<OtaSyncLog> {
    const result = await db.insert(otaSyncLogs).values(data).returning();
    return result[0];
  }

  async getOtaConflicts(propertyId: string, tenantId?: string | null): Promise<OtaConflict[]> {
    const conditions: any[] = [eq(otaConflicts.propertyId, propertyId)];
    if (tenantId) {
      conditions.push(eq(otaConflicts.tenantId, tenantId));
    }
    return await db.select()
      .from(otaConflicts)
      .where(and(...conditions))
      .orderBy(desc(otaConflicts.createdAt));
  }

  async createOtaConflict(data: InsertOtaConflict): Promise<OtaConflict> {
    const result = await db.insert(otaConflicts).values(data).returning();
    return result[0];
  }

  async getPricingRulesByProperty(propertyId: string, tenantId: string): Promise<PricingRule[]> {
    return await db.select()
      .from(pricingRules)
      .where(and(
        eq(pricingRules.propertyId, propertyId),
        eq(pricingRules.tenantId, tenantId),
      ))
      .orderBy(desc(pricingRules.priority));
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const result = await db.insert(pricingRules).values(rule).returning();
    return result[0];
  }

  async getPricingRule(id: string): Promise<PricingRule | undefined> {
    const result = await db.select()
      .from(pricingRules)
      .where(eq(pricingRules.id, id))
      .limit(1);
    return result[0];
  }

  async updatePricingRule(id: string, tenantId: string, updates: Partial<PricingRule>): Promise<PricingRule | undefined> {
    const result = await db.update(pricingRules)
      .set(updates)
      .where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)))
      .returning();
    return result[0];
  }

  async deletePricingRule(id: string, tenantId: string): Promise<void> {
    await db.delete(pricingRules).where(and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)));
  }

  async getRatePlansByProperty(propertyId: string, tenantId: string): Promise<RatePlan[]> {
    return await db.select()
      .from(ratePlans)
      .where(and(
        eq(ratePlans.propertyId, propertyId),
        eq(ratePlans.tenantId, tenantId),
      ))
      .orderBy(asc(ratePlans.createdAt));
  }

  async getRatePlan(id: string): Promise<RatePlan | undefined> {
    const result = await db.select().from(ratePlans).where(eq(ratePlans.id, id)).limit(1);
    return result[0];
  }

  async createRatePlan(ratePlan: InsertRatePlan): Promise<RatePlan> {
    const result = await db.insert(ratePlans).values(ratePlan).returning();
    return result[0];
  }

  async updateRatePlan(id: string, updates: Partial<RatePlan>): Promise<RatePlan | undefined> {
    const result = await db.update(ratePlans).set(updates).where(eq(ratePlans.id, id)).returning();
    return result[0];
  }

  async deleteRatePlan(id: string): Promise<void> {
    await db.delete(ratePlans).where(eq(ratePlans.id, id));
  }

  async getDefaultRatePlan(propertyId: string): Promise<RatePlan | undefined> {
    const result = await db.select()
      .from(ratePlans)
      .where(and(
        eq(ratePlans.propertyId, propertyId),
        eq(ratePlans.isDefault, true),
      ))
      .limit(1);
    return result[0];
  }

  async ensureDefaultRatePlan(propertyId: string, tenantId: string | null): Promise<RatePlan> {
    const existing = await this.getDefaultRatePlan(propertyId);
    if (existing) return existing;

    return await this.createRatePlan({
      propertyId,
      tenantId,
      name: "Standard",
      refundPolicy: "flexible",
      mealPlan: "none",
      priceModifier: 0,
      isDefault: true,
      isActive: true,
    });
  }

  async getRoomNightsByUnit(unitId: string, startDate: string, endDate: string): Promise<RoomNight[]> {
    return await db.select()
      .from(roomNights)
      .where(and(
        eq(roomNights.unitId, unitId),
        gte(roomNights.date, startDate),
        lt(roomNights.date, endDate),
      ));
  }

  async getRoomNightsByProperty(propertyId: string, startDate: string, endDate: string): Promise<RoomNight[]> {
    return await db.select()
      .from(roomNights)
      .where(and(
        eq(roomNights.propertyId, propertyId),
        gte(roomNights.date, startDate),
        lt(roomNights.date, endDate),
      ));
  }

  async deleteRoomNightsByBooking(bookingId: string): Promise<void> {
    await db.delete(roomNights).where(eq(roomNights.bookingId, bookingId));
  }

  async reconcileRoomNights(bookingId: string, unitId: string, checkIn: Date, checkOut: Date, tenantId?: string | null, propertyId?: string | null): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(roomNights).where(eq(roomNights.bookingId, bookingId));

      const nightDates = this.generateNightDates(checkIn, checkOut);
      if (nightDates.length > 0) {
        const rows = nightDates.map(dateStr => ({
          unitId,
          date: dateStr,
          bookingId,
          tenantId: tenantId || null,
          propertyId: propertyId || null,
        }));
        try {
          await tx.insert(roomNights).values(rows);
        } catch (err: any) {
          if (err.code === "23505") {
            throw new Error("ROOM_NOT_AVAILABLE: Room not available for the updated dates");
          }
          throw err;
        }
      }
    });
  }

  async searchAvailableUnits(propertyId: string, checkIn: string, checkOut: string, guests?: number, tenantId?: string): Promise<Unit[]> {
    const occupiedUnitIds = db
      .selectDistinct({ unitId: roomNights.unitId })
      .from(roomNights)
      .where(and(
        eq(roomNights.propertyId, propertyId),
        gte(roomNights.date, checkIn),
        lt(roomNights.date, checkOut),
      ));

    const conditions: any[] = [
      eq(units.propertyId, propertyId),
      eq(units.isActive, true),
      eq(units.unitCategory, "accommodation"),
      sql`${units.id} NOT IN (${occupiedUnitIds})`,
    ];

    if (tenantId) {
      conditions.push(eq(units.tenantId, tenantId));
    }

    if (guests && guests > 0) {
      conditions.push(gte(units.capacity, guests));
    }

    return await db.select()
      .from(units)
      .where(and(...conditions))
      .orderBy(asc(units.unitNumber));
  }

  async createApiUsageLog(tenantId: string, endpoint: string): Promise<void> {
    await db.insert(apiUsageLogs).values({ tenantId, endpoint });
  }

  async countApiUsageThisMonth(tenantId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await db.select({ total: count() })
      .from(apiUsageLogs)
      .where(and(
        eq(apiUsageLogs.tenantId, tenantId),
        gte(apiUsageLogs.createdAt, startOfMonth),
      ));
    return result[0]?.total ?? 0;
  }

  // ===================== DEPARTMENTS =====================
  async getDepartmentsByHotel(hotelId: string, tenantId: string): Promise<Department[]> {
    return db.select().from(departments).where(and(eq(departments.hotelId, hotelId), eq(departments.tenantId, tenantId))).orderBy(asc(departments.name));
  }
  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const [d] = await db.insert(departments).values(dept).returning();
    return d;
  }
  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined> {
    const [d] = await db.update(departments).set(updates).where(eq(departments.id, id)).returning();
    return d;
  }
  async deleteDepartment(id: string): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // ===================== COST CENTERS =====================
  async getCostCentersByHotel(hotelId: string, tenantId: string): Promise<CostCenter[]> {
    return db.select().from(costCenters).where(and(eq(costCenters.hotelId, hotelId), eq(costCenters.tenantId, tenantId))).orderBy(asc(costCenters.name));
  }
  async createCostCenter(cc: InsertCostCenter): Promise<CostCenter> {
    const [c] = await db.insert(costCenters).values(cc).returning();
    return c;
  }
  async updateCostCenter(id: string, updates: Partial<CostCenter>): Promise<CostCenter | undefined> {
    const [c] = await db.update(costCenters).set(updates).where(eq(costCenters.id, id)).returning();
    return c;
  }

  // ===================== TAX CONFIGURATIONS =====================
  async getTaxConfigsByHotel(hotelId: string, tenantId: string): Promise<TaxConfiguration[]> {
    return db.select().from(taxConfigurations).where(and(eq(taxConfigurations.hotelId, hotelId), eq(taxConfigurations.tenantId, tenantId), eq(taxConfigurations.isActive, true)));
  }
  async createTaxConfig(config: InsertTaxConfiguration): Promise<TaxConfiguration> {
    const [t] = await db.insert(taxConfigurations).values(config).returning();
    return t;
  }
  async updateTaxConfig(id: string, updates: Partial<TaxConfiguration>): Promise<TaxConfiguration | undefined> {
    const [t] = await db.update(taxConfigurations).set(updates).where(eq(taxConfigurations.id, id)).returning();
    return t;
  }

  // ===================== GUEST FOLIOS =====================
  async getGuestFolioByBooking(bookingId: string): Promise<GuestFolio | undefined> {
    const [f] = await db.select().from(guestFolios).where(eq(guestFolios.bookingId, bookingId));
    return f;
  }
  async getGuestFolio(id: string): Promise<GuestFolio | undefined> {
    const [f] = await db.select().from(guestFolios).where(eq(guestFolios.id, id));
    return f;
  }
  async getGuestFoliosByHotel(hotelId: string, tenantId: string): Promise<GuestFolio[]> {
    return db.select().from(guestFolios).where(and(eq(guestFolios.hotelId, hotelId), eq(guestFolios.tenantId, tenantId))).orderBy(desc(guestFolios.openedAt));
  }
  async createGuestFolio(folio: InsertGuestFolio): Promise<GuestFolio> {
    const [f] = await db.insert(guestFolios).values(folio).returning();
    return f;
  }
  async updateGuestFolio(id: string, updates: Partial<GuestFolio>): Promise<GuestFolio | undefined> {
    const [f] = await db.update(guestFolios).set(updates).where(eq(guestFolios.id, id)).returning();
    return f;
  }
  async recalculateFolioBalance(folioId: string): Promise<GuestFolio | undefined> {
    return db.transaction(async (tx) => {
      const charges = await tx.select().from(folioCharges).where(and(eq(folioCharges.folioId, folioId), eq(folioCharges.status, "posted")));
      const payments = await tx.select().from(folioPayments).where(and(eq(folioPayments.folioId, folioId), eq(folioPayments.status, "completed")));
      const adjustments = await tx.select().from(folioAdjustments).where(and(eq(folioAdjustments.folioId, folioId), eq(folioAdjustments.approvalStatus, "approved")));
      const totalCharges = charges.reduce((s, c) => s + (c.amountGross || 0), 0);
      const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const totalAdjustments = adjustments.reduce((s, a) => s + (a.amount || 0), 0);
      const taxTotal = charges.reduce((s, c) => s + (c.taxAmount || 0), 0);
      const balance = totalCharges - totalPayments + totalAdjustments;
      const [f] = await tx.update(guestFolios).set({ totalCharges, totalPayments, totalAdjustments, taxTotal, balance }).where(eq(guestFolios.id, folioId)).returning();
      return f;
    });
  }

  // ===================== FOLIO CHARGES =====================
  async getFolioCharges(folioId: string): Promise<FolioCharge[]> {
    return db.select().from(folioCharges).where(eq(folioCharges.folioId, folioId)).orderBy(desc(folioCharges.createdAt));
  }
  async createFolioCharge(charge: InsertFolioCharge): Promise<FolioCharge> {
    const [c] = await db.insert(folioCharges).values(charge).returning();
    return c;
  }
  async voidFolioCharge(id: string, voidedBy: string, reason: string): Promise<FolioCharge | undefined> {
    const [c] = await db.update(folioCharges).set({ status: "voided", voidedAt: new Date(), voidedBy, voidReason: reason }).where(eq(folioCharges.id, id)).returning();
    return c;
  }

  // ===================== FOLIO PAYMENTS =====================
  async getFolioPayments(folioId: string): Promise<FolioPayment[]> {
    return db.select().from(folioPayments).where(eq(folioPayments.folioId, folioId)).orderBy(desc(folioPayments.createdAt));
  }
  async createFolioPayment(payment: InsertFolioPayment): Promise<FolioPayment> {
    const [p] = await db.insert(folioPayments).values(payment).returning();
    return p;
  }
  async updateFolioPayment(id: string, updates: Partial<FolioPayment>): Promise<FolioPayment | undefined> {
    const [p] = await db.update(folioPayments).set(updates).where(eq(folioPayments.id, id)).returning();
    return p;
  }

  // ===================== FOLIO ADJUSTMENTS =====================
  async getFolioAdjustments(folioId: string): Promise<FolioAdjustment[]> {
    return db.select().from(folioAdjustments).where(eq(folioAdjustments.folioId, folioId)).orderBy(desc(folioAdjustments.createdAt));
  }
  async createFolioAdjustment(adj: InsertFolioAdjustment): Promise<FolioAdjustment> {
    const [a] = await db.insert(folioAdjustments).values(adj).returning();
    return a;
  }
  async updateFolioAdjustment(id: string, updates: Partial<FolioAdjustment>): Promise<FolioAdjustment | undefined> {
    const [a] = await db.update(folioAdjustments).set(updates).where(eq(folioAdjustments.id, id)).returning();
    return a;
  }

  // ===================== CANCELLATION POLICIES =====================
  async getCancellationPoliciesByHotel(hotelId: string): Promise<CancellationPolicy[]> {
    return db.select().from(cancellationPolicies).where(and(eq(cancellationPolicies.hotelId, hotelId), eq(cancellationPolicies.isActive, true)));
  }
  async getDefaultCancellationPolicy(hotelId: string): Promise<CancellationPolicy | undefined> {
    const [p] = await db.select().from(cancellationPolicies).where(and(eq(cancellationPolicies.hotelId, hotelId), eq(cancellationPolicies.isDefault, true), eq(cancellationPolicies.isActive, true)));
    return p;
  }
  async createCancellationPolicy(policy: InsertCancellationPolicy): Promise<CancellationPolicy> {
    const [p] = await db.insert(cancellationPolicies).values(policy).returning();
    return p;
  }
  async updateCancellationPolicy(id: string, updates: Partial<CancellationPolicy>): Promise<CancellationPolicy | undefined> {
    const [p] = await db.update(cancellationPolicies).set(updates).where(eq(cancellationPolicies.id, id)).returning();
    return p;
  }
  async deleteCancellationPolicy(id: string): Promise<void> {
    await db.delete(cancellationPolicies).where(eq(cancellationPolicies.id, id));
  }

  // ===================== NIGHT AUDIT — ACTIVE BOOKINGS QUERY =====================
  async getCheckedInBookingsByHotel(hotelId: string, tenantId: string): Promise<Booking[]> {
    const result = await db.select()
      .from(bookings)
      .innerJoin(users, eq(bookings.guestId, users.id))
      .where(and(eq(users.hotelId, hotelId), eq(bookings.tenantId, tenantId), eq(bookings.status, "checked_in")));
    return result.map(r => r.bookings);
  }

  // ===================== CHART OF ACCOUNTS =====================
  async getChartOfAccountsByHotel(hotelId: string, tenantId: string): Promise<ChartOfAccount[]> {
    return db.select().from(chartOfAccounts).where(and(eq(chartOfAccounts.hotelId, hotelId), eq(chartOfAccounts.tenantId, tenantId))).orderBy(asc(chartOfAccounts.accountCode));
  }
  async getChartOfAccountByCode(hotelId: string, accountCode: string): Promise<ChartOfAccount | undefined> {
    const [a] = await db.select().from(chartOfAccounts).where(and(eq(chartOfAccounts.hotelId, hotelId), eq(chartOfAccounts.accountCode, accountCode)));
    return a;
  }
  async createChartOfAccount(account: InsertChartOfAccount): Promise<ChartOfAccount> {
    const [a] = await db.insert(chartOfAccounts).values(account).returning();
    return a;
  }
  async updateChartOfAccount(id: string, updates: Partial<ChartOfAccount>): Promise<ChartOfAccount | undefined> {
    const [a] = await db.update(chartOfAccounts).set(updates).where(eq(chartOfAccounts.id, id)).returning();
    return a;
  }

  // ===================== JOURNAL ENTRIES =====================
  async getJournalEntriesByHotel(hotelId: string, tenantId: string, limit = 100): Promise<JournalEntry[]> {
    return db.select().from(journalEntries).where(and(eq(journalEntries.hotelId, hotelId), eq(journalEntries.tenantId, tenantId))).orderBy(desc(journalEntries.entryDate)).limit(limit);
  }
  async getJournalEntriesBySource(sourceType: string, sourceId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries).where(and(eq(journalEntries.sourceType, sourceType), eq(journalEntries.sourceId, sourceId)));
  }
  async createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalEntryLine[]): Promise<JournalEntry> {
    const [je] = await db.insert(journalEntries).values(entry).returning();
    if (lines.length > 0) {
      await db.insert(journalEntryLines).values(lines.map(l => ({ ...l, journalEntryId: je.id })));
    }
    return je;
  }
  async getJournalEntryLines(journalEntryId: string): Promise<JournalEntryLine[]> {
    return db.select().from(journalEntryLines).where(eq(journalEntryLines.journalEntryId, journalEntryId));
  }

  // ===================== NIGHT AUDITS =====================
  async getNightAuditsByHotel(hotelId: string, tenantId: string, limit = 30): Promise<NightAudit[]> {
    return db.select().from(nightAudits).where(and(eq(nightAudits.hotelId, hotelId), eq(nightAudits.tenantId, tenantId))).orderBy(desc(nightAudits.auditDate)).limit(limit);
  }
  async getNightAuditByDate(hotelId: string, date: Date): Promise<NightAudit | undefined> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const [na] = await db.select().from(nightAudits).where(and(eq(nightAudits.hotelId, hotelId), gte(nightAudits.auditDate, startOfDay), lt(nightAudits.auditDate, endOfDay)));
    return na;
  }
  async createNightAudit(audit: InsertNightAudit): Promise<NightAudit> {
    const [na] = await db.insert(nightAudits).values(audit).returning();
    return na;
  }
  async updateNightAudit(id: string, updates: Partial<NightAudit>): Promise<NightAudit | undefined> {
    const [na] = await db.update(nightAudits).set(updates).where(eq(nightAudits.id, id)).returning();
    return na;
  }

  // ===================== DAILY FINANCIAL SUMMARIES =====================
  async getDailyFinancialSummaries(hotelId: string, tenantId: string, limit = 30): Promise<DailyFinancialSummary[]> {
    return db.select().from(dailyFinancialSummaries).where(and(eq(dailyFinancialSummaries.hotelId, hotelId), eq(dailyFinancialSummaries.tenantId, tenantId))).orderBy(desc(dailyFinancialSummaries.summaryDate)).limit(limit);
  }
  async getDailyFinancialSummaryByDate(hotelId: string, date: Date): Promise<DailyFinancialSummary | undefined> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const [s] = await db.select().from(dailyFinancialSummaries).where(and(eq(dailyFinancialSummaries.hotelId, hotelId), gte(dailyFinancialSummaries.summaryDate, startOfDay), lt(dailyFinancialSummaries.summaryDate, endOfDay)));
    return s;
  }
  async upsertDailyFinancialSummary(data: InsertDailyFinancialSummary): Promise<DailyFinancialSummary> {
    const existing = await this.getDailyFinancialSummaryByDate(data.hotelId, data.summaryDate as Date);
    if (existing) {
      const [s] = await db.update(dailyFinancialSummaries).set({ ...data, updatedAt: new Date() }).where(eq(dailyFinancialSummaries.id, existing.id)).returning();
      return s;
    }
    const [s] = await db.insert(dailyFinancialSummaries).values(data).returning();
    return s;
  }
}

export const storage = new DatabaseStorage();
