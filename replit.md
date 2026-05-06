# O.S.S - Smart Hotel & Restaurant System

## Overview
O.S.S is a multi-tenant SaaS platform covering two verticals: (1) **Hotel** — full property management (rooms, bookings, staff, IoT, analytics, financials) and (2) **Restaurant** — standalone POS system (orders, KDS, digital menu, cashier, analytics). The `/` landing page lets visitors choose their module; `/hotel` → hotel landing, `/restaurant` → restaurant POS landing. Both offer 14-day trials and full i18n across 10 languages.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Wouter for routing, and TanStack React Query for state management.
- **UI/UX**: Minimalist, card-based design (Airbnb inspired) using shadcn/ui and Tailwind CSS with theming (dark/light modes). Focus on touch-friendly elements and accessibility.
- **Internationalization**: i18n support for 10 languages, including RTL.
- **SEO**: `react-helmet-async` for per-page SEO and JSON-LD structured data.

### Backend
- **Runtime**: Node.js with Express 5 and TypeScript.
- **API**: RESTful JSON API.
- **Authentication**: Secure HttpOnly session-cookie authentication (`express-session`, `bcryptjs`).
- **Security**: `helmet` for security headers, explicit CORS, rate limiting on authentication endpoints, Zod for input validation.
- **Logging**: Structured production logging via `pino` + `pino-http`.
- **Error Handling**: Centralized error handling with i18n-translated messages.
- **WebSocket Server**: Real-time IoT device communication with session-cookie-based authentication and tenant ownership validation.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Schema**: Comprehensive schema with nullable `tenantId` for universal tenant isolation.
- **Migrations**: Drizzle Kit for database schema management.

### Multi-Tenant Architecture
- **Tenant Isolation**: Global middleware resolves `tenantId`.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions.
- **Demo Data Reset**: Automatic cleanup and fresh state creation for demo users.

### Feature Gating & Subscription Management
- **Plan-Based Feature Gating**: `PLAN_CODE_FEATURES` as the sole source of truth, enforced by backend middleware.
- **Usage Limits Enforcement**: Checks limits for rooms, staff, integrations, and monthly API calls.
- **Smart Plan Hardware Enforcement**: Validates hardware actions against subscription tiers.
- **Onboarding Wizard**: 4-step flow for property setup with plan selection. New registrations default to a trial.
- **Subscription Lifecycle Automation**: Full status machine (trial → active → past_due → expired/suspended) with daily cron job for auto-renewal. Idempotent webhook handling for renewal payments.
- **Subscription Management API**: Routes for status check, auto-renew toggle, cancel-at-period-end, and reactivation.
- **Auto-Trial on Registration**: `POST /api/auth/register-hotel` creates a 14-day trial.
- **OSS Admin Activate Trial**: `POST /api/oss-admin/owners/:ownerId/activate-trial` for creating or updating subscriptions.

### Core Features
- **Property & Staff Management**: Onboarding and per-property staff management.
- **SaaS Features**: Feature flag engine, usage metering, audit logging, billing & subscription, device registry, and analytics.
- **Financial Management (Hotel-Grade)**: Guest Folio System with idempotent charges, multi-method payment splits, tax engine. Integrates with double-entry General Ledger schema and supports departments/cost centers. Includes Night Audit Engine and Cancellation Policy Engine. PDF invoice generation service.
- **Communication Layer**: Two-layer internal (Owner↔Staff) and Guest Service (Guest↔Staff) communication with escalation.
- **Notification Service**: Interactive notification center with action buttons.
- **Escalation System**: Full escalation management with reply threading and status tracking.
- **Smart Room Controls**: Brightness, curtain position, and AI wake-up time selection.
- **Guest Experience Services**: Centralized guest communication and service management.
- **Dashboards**: TasksView, CalendarView, and Performance Dashboard.
- **Prepare My Stay Workflow**: Guests submit arrival info.
- **Online Check-in (MVP)**: Guests submit personal details, digital signature, and optional ID upload.
- **Auto Housekeeping Engine (PRO)**: MEWS-level housekeeping with auto-creation of tasks, duplicate prevention, priority engine, balanced staff assignment, and inspection flow.
- **Room Status Engine**: Automatic unit status updates based on booking state changes and manual override.
- **Availability Engine**: `room_nights` table with unique constraint; atomic booking creation.
- **Rate Plans**: `rate_plans` table for OTA-compatible pricing with refund policies and meal plans.
- **Hotel Analytics**: Key hotel metrics like occupancy rate, ADR, RevPAR, total revenue.
- **Dynamic Pricing Engine**: `pricing_rules` table with various rule types and cumulative adjustments.
- **SaaS Metrics Dashboard**: Calculates MRR, ARR, churn rate, ARPU, LTV.
- **Refund Management System**: Tracks refund workflow.
- **Admin Finance Center**: Platform-wide financial metrics.

### AI Chat Widget
- **Floating Chat Bubble**: Fixed bottom-right widget.
- **AI-Powered Responses**: Integrates with OpenAI GPT-4o-mini.
- **Demo Lead Capture**: Detects demo/trial intent keywords and shows an inline lead form.

### Smart Restaurant Ecosystem
- **Roles**: `restaurant_manager`, `kitchen_staff`, `waiter`, `restaurant_cleaner`, `restaurant_cashier` with dedicated dashboards.
- **Kitchen Display System**: Real-time KDS with WebSocket push.
- **Waiter View**: Manages order delivery.
- **Restaurant Manager Dashboard**: 8-tab panel: Sifarişlər, Hesablaşma, Otaqlar, Menyu, Qarsonlar, Temizlik, Heyat, Maliyyə.
- **Waiter Profile Management**: Manager sets salary, tax, table assignments.
- **Cleaning Task System**: Manager creates tasks; cleaners mark done with optional photo upload.
- **Restaurant Cleaner Dashboard**: Shows assigned tasks, mark in-progress/done, photo upload.
- **Restaurant Cashier Dashboard**: Tables & open bills view, settle by cash/card/room-charge, print receipt, history tab, and today's revenue stats.
- **Room Orders View**: Manager sees rooms with pending restaurant bills.
- **Restaurant Finance Tab**: Today/month revenue, all-time totals, breakdown by payment type, order status distribution.
- **Guest Ordering**: "Call Waiter" button and "Order Food" modal on guest dashboard.
- **Settlement Integration**: Restaurant charges can be posted to the guest's open folio.
- **WebSocket Events**: Real-time events for new orders, status changes, waiter calls, cleaning tasks.

### Billing & Add-on Management
- **Billing Logs Table**: `billing_logs` tracks add-on purchases and payment events.
- **Hotels WhatsApp Fields**: `is_whatsapp_enabled` and `whatsapp_balance` control WhatsApp notification gating.
- **Owner Dashboard — Billing & Add-ons View**: Displays add-on grid (Channel Manager, WhatsApp Notifications, Smart Room) and package-specific WhatsApp purchase options. Recent billing history.
- **WhatsApp Balance Guard**: `is_whatsapp_enabled` and `whatsapp_balance > 0` required for sending messages; balance decrements.
- **OSS Super Admin — Billing Reports Tab**: Includes Revenue Overview, Channex Report, and WhatsApp Report with manual credit dialog.

### Automated Systems
- **Marketing Referral System**: `referral_source`, `referral_staff_id`, `referral_notes` on `owners` table; `referral_commissions` table tracks commissions. Registration captures referral source. `marketing_staff` role with dedicated panel.
- **Multi-Property Business Entity Check**: Validates new properties belong to the same legal business entity.
- **Password Reset Error Surface**: Improved error handling for `forgot-password` API.
- **Automated Database Backup**: Daily `pg_dump` backups with retention and monitoring.
- **Production Monitoring & Error Tracking**: Centralized alert tracking with admin email notifications.
- **Billing Email Notification System**: Sends transactional emails for payment and subscription events.
- **Real-Time Calendar View**: Owner Dashboard CalendarView shows a full month grid with local and Channex OTA bookings. WebSocket push triggers toast and auto-refresh on new Channex bookings.

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database.

### UI Framework Dependencies
- **Radix UI**: Accessible UI primitives.
- **shadcn/ui**: Reusable UI components built on Radix UI.
- **Lucide React**: Icon library.

### Integrations
- **Resend**: Transactional email services.
- **Epoint.az**: Local payment gateway for Azerbaijan.
- **Channex.io**: Channel manager integration. Webhook at `POST /api/webhooks/channex` handles booking events.
- **OpenAI**: AI-powered chat responses.

### Job Queue
- **pg-boss**: PostgreSQL-backed job queue for async background tasks (e.g., booking and OTA synchronization).

### External OTA Bookings
- **Integration**: Supports importing bookings from platforms like Booking.com, Airbnb, Expedia into `external_bookings` table.
- **Sync**: API endpoint enqueues `booking-sync` jobs to fetch and parse iCal data.

### OTA Connector Layer
- **Components**: Manages `ota_integrations` and `ota_sync_logs`.
- **Services**: `otaSyncService.ts` to push availability/rates and pull reservations, `availabilityExportService.ts` and `rateExportService.ts` for data calculation.
- **Channel Manager Logic**: Maps OTA statuses, handles conflicts, and auto-creates internal bookings.