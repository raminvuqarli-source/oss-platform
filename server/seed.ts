import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { applyPlanFeatures } from "@shared/planFeatures";
import { logger } from "./utils/logger";

const BCRYPT_ROUNDS = 12;

export async function ensureDemoUser(role: string) {
  const ownerUser = await storage.getUserByUsername("demo_owner");
  if (!ownerUser) return;

  const ownerId = ownerUser.ownerId;
  let hotelId = ownerUser.hotelId;
  let propertyId = ownerUser.propertyId;

  if (!hotelId || !propertyId) {
    const receptionUser = await storage.getUserByUsername("demo_reception");
    if (receptionUser) {
      hotelId = hotelId || receptionUser.hotelId;
      propertyId = propertyId || receptionUser.propertyId;
    }
  }

  const userDefs: Record<string, { username: string; password: string; fullName: string; email: string; phone: string; dbRole: string }> = {
    admin: { username: "demo_admin", password: "admin123!", fullName: "James Wilson", email: "james@grandriviera.com", phone: "+14155550103", dbRole: "admin" },
    reception: { username: "demo_reception", password: "reception123!", fullName: "Maria Santos", email: "maria@grandriviera.com", phone: "+14155550102", dbRole: "reception" },
    guest: { username: "demo_guest1", password: "guest123!", fullName: "Sarah Johnson", email: "sarah@example.com", phone: "+14155550200", dbRole: "guest" },
    housekeeping: { username: "demo_housekeeping", password: "hk123!", fullName: "Nina Torres", email: "nina@grandriviera.com", phone: "+14155550104", dbRole: "staff" },
    kitchen: { username: "demo_kitchen", password: "kitchen123!", fullName: "Carlos Mendez", email: "carlos@grandriviera.com", phone: "+14155550105", dbRole: "kitchen_staff" },
    maintenance: { username: "demo_maintenance", password: "maint123!", fullName: "Dave Park", email: "dave@grandriviera.com", phone: "+14155550106", dbRole: "staff" },
    restaurant_manager: { username: "demo_restaurant_manager", password: "restmgr123!", fullName: "Sofia Reyes", email: "sofia@grandriviera.com", phone: "+14155550107", dbRole: "restaurant_manager" },
    waiter: { username: "demo_waiter", password: "waiter123!", fullName: "Luca Bianchi", email: "luca@grandriviera.com", phone: "+14155550108", dbRole: "waiter" },
    restaurant_cleaner: { username: "demo_restaurant_cleaner", password: "restclean123!", fullName: "Ana Lima", email: "ana@grandriviera.com", phone: "+14155550109", dbRole: "restaurant_cleaner" },
    restaurant_cashier: { username: "demo_restaurant_cashier", password: "cashier123!", fullName: "Omar Faruk", email: "omar@grandriviera.com", phone: "+14155550110", dbRole: "restaurant_cashier" },
  };

  const def = userDefs[role];
  if (!def) return;

  const existing = await storage.getUserByUsername(def.username);
  if (existing) return;

  const hashedPw = await bcrypt.hash(def.password, BCRYPT_ROUNDS);
  await storage.createUser({
    username: def.username,
    password: hashedPw,
    fullName: def.fullName,
    email: def.email,
    phone: def.phone,
    role: def.dbRole,
    hotelId: hotelId,
    ownerId: ownerId,
    propertyId: propertyId,
  });
  logger.info({ username: def.username }, "Created missing demo user");
}

export async function seedDemoData() {
  logger.info("Starting demo data generation...");

  const existingOwner = await storage.getUserByUsername("demo_owner");
  if (existingOwner) {
    logger.info("Demo data already exists, skipping");
    return { message: "Demo data already exists", skipped: true };
  }

  const ownerPassword = await bcrypt.hash("demo123!", BCRYPT_ROUNDS);
  const receptionPassword = await bcrypt.hash("reception123!", BCRYPT_ROUNDS);
  const adminPassword = await bcrypt.hash("admin123!", BCRYPT_ROUNDS);
  const guestPassword = await bcrypt.hash("guest123!", BCRYPT_ROUNDS);

  const owner = await storage.createOwner({
    name: "Alex Rivera",
    email: "alex@rivierahotels.com",
    phone: "+14155550100",
    companyName: "Riviera Hotels Group",
  });

  const hotel = await storage.createHotel({
    name: "Grand Riviera Resort & Spa",
    address: "123 Oceanview Boulevard, Miami Beach, FL 33139",
    phone: "+14155550101",
    email: "info@grandriviera.com",
    ownerId: owner.id,
    totalRooms: 50,
    country: "United States",
    city: "Miami Beach",
    starRating: "5",
  });

  const property = await storage.createProperty({
    name: "Grand Riviera Resort & Spa",
    ownerId: owner.id,
    type: "resort",
    address: "123 Oceanview Boulevard, Miami Beach, FL 33139",
    phone: "+14155550101",
    email: "info@grandriviera.com",
    country: "United States",
    city: "Miami Beach",
    timezone: "America/New_York",
  });

  const ownerUser = await storage.createUser({
    username: "demo_owner",
    password: ownerPassword,
    fullName: "Alex Rivera",
    email: "alex@rivierahotels.com",
    phone: "+14155550100",
    role: "owner_admin",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const receptionUser = await storage.createUser({
    username: "demo_reception",
    password: receptionPassword,
    fullName: "Maria Santos",
    email: "maria@grandriviera.com",
    phone: "+14155550102",
    role: "reception",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const adminUser = await storage.createUser({
    username: "demo_admin",
    password: adminPassword,
    fullName: "James Wilson",
    email: "james@grandriviera.com",
    phone: "+14155550103",
    role: "admin",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const hkPassword = await bcrypt.hash("hk123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_housekeeping",
    password: hkPassword,
    fullName: "Nina Torres",
    email: "nina@grandriviera.com",
    phone: "+14155550104",
    role: "staff",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const kitchenPassword = await bcrypt.hash("kitchen123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_kitchen",
    password: kitchenPassword,
    fullName: "Carlos Mendez",
    email: "carlos@grandriviera.com",
    phone: "+14155550105",
    role: "kitchen_staff",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const maintPassword = await bcrypt.hash("maint123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_maintenance",
    password: maintPassword,
    fullName: "Dave Park",
    email: "dave@grandriviera.com",
    phone: "+14155550106",
    role: "staff",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const restMgrPassword = await bcrypt.hash("restmgr123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_restaurant_manager",
    password: restMgrPassword,
    fullName: "Sofia Reyes",
    email: "sofia@grandriviera.com",
    phone: "+14155550107",
    role: "restaurant_manager",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const waiterPassword = await bcrypt.hash("waiter123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_waiter",
    password: waiterPassword,
    fullName: "Luca Bianchi",
    email: "luca@grandriviera.com",
    phone: "+14155550108",
    role: "waiter",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const restCleanerPassword = await bcrypt.hash("restclean123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_restaurant_cleaner",
    password: restCleanerPassword,
    fullName: "Ana Lima",
    email: "ana@grandriviera.com",
    phone: "+14155550109",
    role: "restaurant_cleaner",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const cashierPassword = await bcrypt.hash("cashier123!", BCRYPT_ROUNDS);
  await storage.createUser({
    username: "demo_restaurant_cashier",
    password: cashierPassword,
    fullName: "Omar Faruk",
    email: "omar@grandriviera.com",
    phone: "+14155550110",
    role: "restaurant_cashier",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const proDefaults = applyPlanFeatures("pro");
  await storage.createSubscription({
    ownerId: owner.id,
    planType: "pro",
    planCode: "CORE_PRO",
    smartPlanType: "smart_ai",
    ...proDefaults,
    isActive: true,
  });

  const roomTypes = [
    { unitNumber: "101", unitCategory: "accommodation", unitType: "standard", status: "available", floor: 1, pricePerNight: 15000, capacity: 2 },
    { unitNumber: "102", unitCategory: "accommodation", unitType: "standard", status: "available", floor: 1, pricePerNight: 15000, capacity: 2 },
    { unitNumber: "201", unitCategory: "accommodation", unitType: "deluxe", status: "available", floor: 2, pricePerNight: 25000, capacity: 3 },
    { unitNumber: "202", unitCategory: "accommodation", unitType: "deluxe", status: "occupied", floor: 2, pricePerNight: 25000, capacity: 3 },
    { unitNumber: "301", unitCategory: "accommodation", unitType: "suite", status: "available", floor: 3, pricePerNight: 45000, capacity: 4 },
    { unitNumber: "302", unitCategory: "accommodation", unitType: "presidential_suite", status: "maintenance", floor: 3, pricePerNight: 75000, capacity: 4 },
    { unitNumber: "Pool Deck", unitCategory: "wellness", unitType: "pool", status: "available", floor: 0, pricePerNight: 0, capacity: 50 },
    { unitNumber: "Conference A", unitCategory: "meeting", unitType: "meeting_room", status: "available", floor: 1, pricePerNight: 50000, capacity: 30 },
    { unitNumber: "Restaurant", unitCategory: "dining", unitType: "restaurant", status: "available", floor: 0, pricePerNight: 0, capacity: 100 },
    { unitNumber: "Parking B1", unitCategory: "parking", unitType: "parking_spot", status: "available", floor: -1, pricePerNight: 2000, capacity: 1 },
  ];

  const units = [];
  for (const room of roomTypes) {
    const unit = await storage.createUnit({
      propertyId: property.id,
      ownerId: owner.id,
      unitNumber: room.unitNumber,
      unitCategory: room.unitCategory,
      unitType: room.unitType,
      status: room.status,
      floor: room.floor,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      amenities: ["wifi", "tv", "minibar", "safe"],
    });
    units.push(unit);
  }

  const guest1 = await storage.createUser({
    username: "demo_guest1",
    password: guestPassword,
    fullName: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+14155550200",
    role: "guest",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const guest2 = await storage.createUser({
    username: "demo_guest2",
    password: guestPassword,
    fullName: "Michael Chen",
    email: "michael@example.com",
    phone: "+14155550201",
    role: "guest",
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
  });

  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const booking1 = await storage.createBooking({
    guestId: guest1.id,
    roomNumber: "202",
    roomType: "deluxe",
    checkInDate: yesterday,
    checkOutDate: tomorrow,
    status: "booked",
    numberOfGuests: 2,
    specialRequests: "Extra pillows, late checkout if possible",
    nightlyRate: 25000,
    totalPrice: 50000,
    currency: "USD",
    ownerId: owner.id,
    propertyId: property.id,
  });

  const booking2 = await storage.createBooking({
    guestId: guest2.id,
    roomNumber: "301",
    roomType: "suite",
    checkInDate: tomorrow,
    checkOutDate: nextWeek,
    status: "confirmed",
    numberOfGuests: 3,
    specialRequests: "Airport pickup requested",
    nightlyRate: 45000,
    totalPrice: 270000,
    currency: "USD",
    ownerId: owner.id,
    propertyId: property.id,
  });

  await storage.createFinancialTransaction({
    hotelId: hotel.id,
    bookingId: booking1.id,
    guestId: guest1.id,
    createdBy: receptionUser.id,
    createdByName: receptionUser.fullName,
    category: "room_charge",
    amount: 50000,
    paymentStatus: "completed",
    paymentMethod: "credit_card",
    description: "Room 202 - 2 nights",
  });

  await storage.createServiceRequest({
    guestId: guest1.id,
    bookingId: booking1.id,
    roomNumber: "202",
    requestType: "housekeeping",
    description: "Extra towels and toiletries for Room 202",
    status: "in_progress",
    priority: "medium",
    ownerId: owner.id,
    propertyId: property.id,
  });

  await storage.createServiceRequest({
    guestId: guest1.id,
    bookingId: booking1.id,
    roomNumber: "202",
    requestType: "room_service",
    description: "Breakfast delivery to Room 202 at 8:00 AM",
    status: "pending",
    priority: "normal",
    ownerId: owner.id,
    propertyId: property.id,
  });

  await storage.createRevenue({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Room 202 - Sarah Johnson (2 nights)",
    category: "room_booking",
    amount: 50000,
    paymentMethod: "credit_card",
    paymentStatus: "paid",
    sourceType: "auto",
  });

  await storage.createRevenue({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Conference Room A - Corporate Event",
    category: "event_revenue",
    amount: 150000,
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    sourceType: "staff_input",
  });

  await storage.createRevenue({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Spa Services - Week Total",
    category: "service_revenue",
    amount: 85000,
    paymentMethod: "mixed",
    paymentStatus: "paid",
    sourceType: "staff_input",
  });

  await storage.createExpense({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Cleaning supplies restock",
    category: "supplies",
    vendor: "CleanPro Supplies Inc.",
    amount: 12500,
    sourceType: "staff_input",
  });

  await storage.createExpense({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Pool maintenance service",
    category: "maintenance",
    vendor: "AquaCare Services",
    amount: 35000,
    sourceType: "staff_input",
  });

  await storage.createPayrollConfig({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    staffId: receptionUser.id,
    staffName: "Maria Santos",
    staffRole: "reception",
    baseSalary: 350000,
    frequency: "monthly",
  });

  await storage.createPayrollConfig({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    staffId: adminUser.id,
    staffName: "James Wilson",
    staffRole: "admin",
    baseSalary: 550000,
    frequency: "monthly",
  });

  const now = new Date();
  await storage.createRecurringExpense({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Property insurance premium",
    category: "insurance",
    vendor: "SecureGuard Insurance",
    amount: 250000,
    frequency: "monthly",
    isActive: true,
    nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  });

  await storage.createRecurringExpense({
    hotelId: hotel.id,
    ownerId: owner.id,
    propertyId: property.id,
    description: "Internet & WiFi service",
    category: "utilities",
    vendor: "FastNet ISP",
    amount: 45000,
    frequency: "monthly",
    isActive: true,
    nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  });

  const deviceTypes = [
    { name: "Lobby Thermostat", deviceType: "thermostat", location: "Main Lobby" },
    { name: "Room 202 Lock", deviceType: "smart_lock", location: "Room 202" },
    { name: "Pool Camera", deviceType: "camera", location: "Pool Deck" },
    { name: "Room 301 AC", deviceType: "hvac", location: "Room 301" },
  ];

  for (const dev of deviceTypes) {
    await storage.createDevice({
      propertyId: property.id,
      ownerId: owner.id,
      name: dev.name,
      deviceType: dev.deviceType,
      status: "online",
      firmwareVersion: "2.1.0",
      configuration: {},
    });
  }

  // ─── Payroll configs for all remaining demo staff ─────────────────────────
  const hkUser = await storage.getUserByUsername("demo_housekeeping");
  const maintUser = await storage.getUserByUsername("demo_maintenance");
  const restMgrUser = await storage.getUserByUsername("demo_restaurant_manager");
  const waiterUser = await storage.getUserByUsername("demo_waiter");
  const kitchenUser = await storage.getUserByUsername("demo_kitchen");
  const restCleanerUser = await storage.getUserByUsername("demo_restaurant_cleaner");
  const cashierUser = await storage.getUserByUsername("demo_restaurant_cashier");

  const remainingPayrolls = [
    hkUser && { staffId: hkUser.id, staffName: "Nina Torres", staffRole: "staff", baseSalary: 250000, employeeTaxRate: 0 },
    maintUser && { staffId: maintUser.id, staffName: "Dave Park", staffRole: "staff", baseSalary: 270000, employeeTaxRate: 0 },
    restMgrUser && { staffId: restMgrUser.id, staffName: "Sofia Reyes", staffRole: "restaurant_manager", baseSalary: 480000, employeeTaxRate: 140 },
    waiterUser && { staffId: waiterUser.id, staffName: "Luca Bianchi", staffRole: "waiter", baseSalary: 280000, employeeTaxRate: 140 },
    kitchenUser && { staffId: kitchenUser.id, staffName: "Carlos Mendez", staffRole: "kitchen_staff", baseSalary: 320000, employeeTaxRate: 140 },
    restCleanerUser && { staffId: restCleanerUser.id, staffName: "Ana Lima", staffRole: "restaurant_cleaner", baseSalary: 220000, employeeTaxRate: 0 },
    cashierUser && { staffId: cashierUser.id, staffName: "Omar Faruk", staffRole: "restaurant_cashier", baseSalary: 300000, employeeTaxRate: 140 },
  ].filter(Boolean) as Array<{ staffId: string; staffName: string; staffRole: string; baseSalary: number; employeeTaxRate: number }>;

  for (const p of remainingPayrolls) {
    await storage.createPayrollConfig({
      hotelId: hotel.id, ownerId: owner.id, propertyId: property.id,
      staffId: p.staffId, staffName: p.staffName, staffRole: p.staffRole,
      baseSalary: p.baseSalary, frequency: "monthly", employeeTaxRate: p.employeeTaxRate,
    });
  }

  // ─── Restaurant menu ───────────────────────────────────────────────────────
  const DEMO_TENANT = owner.id;
  const cat1 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: property.id, name: "Breakfast", sortOrder: 0 });
  const cat2 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: property.id, name: "Main Dishes", sortOrder: 1 });
  const cat3 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: property.id, name: "Drinks", sortOrder: 2 });
  const cat4 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: property.id, name: "Desserts", sortOrder: 3 });

  const menuItems = [
    { categoryId: cat1.id, name: "Full English Breakfast", priceCents: 2500, description: "Eggs, sausage, toast" },
    { categoryId: cat1.id, name: "Pancakes", priceCents: 1800, description: "With maple syrup" },
    { categoryId: cat1.id, name: "Granola & Yogurt", priceCents: 1200, description: "With fresh fruit" },
    { categoryId: cat2.id, name: "Grilled Chicken", priceCents: 3500, description: "With mashed potato" },
    { categoryId: cat2.id, name: "Steak", priceCents: 5500, description: "With roasted vegetables" },
    { categoryId: cat2.id, name: "Grilled Fish", priceCents: 4200, description: "With lemon butter" },
    { categoryId: cat2.id, name: "Vegetarian Pasta", priceCents: 2800, description: "With seasonal vegetables" },
    { categoryId: cat3.id, name: "Lemonade", priceCents: 600, description: "Homemade" },
    { categoryId: cat3.id, name: "Tea", priceCents: 400, description: "With milk" },
    { categoryId: cat3.id, name: "Espresso", priceCents: 700, description: "Italian roast" },
    { categoryId: cat3.id, name: "Mineral Water", priceCents: 350, description: "0.5L" },
    { categoryId: cat4.id, name: "Chocolate Cake", priceCents: 1400, description: "With chocolate sauce" },
    { categoryId: cat4.id, name: "Ice Cream", priceCents: 900, description: "3 scoops" },
    { categoryId: cat4.id, name: "Tiramisu", priceCents: 1800, description: "Classic Italian" },
  ];
  for (const item of menuItems) {
    await storage.createPosMenuItem({ tenantId: DEMO_TENANT, propertyId: property.id, ...item });
  }

  // ─── Demo POS orders ───────────────────────────────────────────────────────
  if (waiterUser) {
    await storage.createPosOrder({
      tenantId: DEMO_TENANT, propertyId: property.id,
      tableNumber: "3", guestName: "Sarah Johnson",
      orderType: "dine_in", waiterId: waiterUser.id,
      kitchenStatus: "cooking", settlementStatus: "pending",
      totalCents: 8700,
    }, [
      { itemName: "Steak", quantity: 1, unitPriceCents: 5500, totalCents: 5500 },
      { itemName: "Lemonade", quantity: 2, unitPriceCents: 600, totalCents: 1200 },
      { itemName: "Tiramisu", quantity: 1, unitPriceCents: 1800, totalCents: 1800 },
    ]);
    await storage.createPosOrder({
      tenantId: DEMO_TENANT, propertyId: property.id,
      tableNumber: "7", guestName: "Michael Chen",
      orderType: "dine_in", waiterId: waiterUser.id,
      kitchenStatus: "ready", settlementStatus: "pending",
      totalCents: 4550,
    }, [
      { itemName: "Grilled Fish", quantity: 1, unitPriceCents: 4200, totalCents: 4200 },
      { itemName: "Mineral Water", quantity: 1, unitPriceCents: 350, totalCents: 350 },
    ]);
    await storage.createPosOrder({
      tenantId: DEMO_TENANT, propertyId: property.id,
      roomNumber: "202", guestName: "Sarah Johnson",
      orderType: "room_service", waiterId: waiterUser.id,
      kitchenStatus: "delivered", settlementStatus: "pending",
      totalCents: 3900,
    }, [
      { itemName: "Grilled Chicken", quantity: 1, unitPriceCents: 3500, totalCents: 3500 },
      { itemName: "Tea", quantity: 1, unitPriceCents: 400, totalCents: 400 },
    ]);
  }

  // ─── Restaurant cleaning tasks ─────────────────────────────────────────────
  if (restCleanerUser && restMgrUser) {
    await storage.createRestaurantCleaningTask({ tenantId: DEMO_TENANT, propertyId: property.id, description: "Wipe down tables — East hall", location: "East Hall", assignedToId: restCleanerUser.id, createdById: restMgrUser.id, status: "pending" });
    await storage.createRestaurantCleaningTask({ tenantId: DEMO_TENANT, propertyId: property.id, description: "Mop kitchen floor", location: "Kitchen", assignedToId: restCleanerUser.id, createdById: restMgrUser.id, status: "in_progress" });
    await storage.createRestaurantCleaningTask({ tenantId: DEMO_TENANT, propertyId: property.id, description: "Disinfect bar area", location: "Bar", assignedToId: restCleanerUser.id, createdById: restMgrUser.id, status: "done" });
  }

  // ─── Notifications for all demo users ─────────────────────────────────────
  const allDemoUsers = [ownerUser, receptionUser, adminUser, hkUser, restMgrUser, waiterUser, kitchenUser, restCleanerUser, cashierUser].filter(Boolean) as typeof ownerUser[];
  for (const u of allDemoUsers) {
    await storage.createNotification({
      userId: u.id,
      title: "New Booking",
      message: `Michael Chen reserved room 301 for ${tomorrow.toLocaleDateString("en-GB")} - ${nextWeek.toLocaleDateString("en-GB")}`,
      type: "booking", read: false,
    });
    await storage.createNotification({
      userId: u.id,
      title: "Service Request",
      message: "Sarah Johnson (Room 202) requested extra towels",
      type: "service_request", read: false,
    });
  }

  logger.info("Demo data generated successfully");

  return {
    message: "Demo data generated successfully",
    skipped: false,
    credentials: {
      owner: { username: "demo_owner", password: "demo123!" },
      reception: { username: "demo_reception", password: "reception123!" },
      admin: { username: "demo_admin", password: "admin123!" },
      guest1: { username: "demo_guest1", password: "guest123!" },
      guest2: { username: "demo_guest2", password: "guest123!" },
    },
    property: { name: "Grand Riviera Resort & Spa", units: units.length },
  };
}
