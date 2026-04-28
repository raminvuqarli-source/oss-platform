# O.S.S - Smart Hotel System

## Overview
O.S.S (Smart Hotel System) is a multi-tenant SaaS platform for comprehensive property management in the hospitality industry. It aims to streamline operations and enhance guest experiences across diverse property types. Key capabilities include smart room controls, service request handling, role-based dashboards, IoT device tracking, subscription plans, and cross-property analytics, providing a robust and scalable solution for property owners.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Wouter for routing, and TanStack React Query for state management.
- **UI/UX**: Minimalist, card-based design inspired by Airbnb, using shadcn/ui and Tailwind CSS with theming (dark/light modes). Focus on touch-friendly elements and accessibility.
- **Internationalization**: i18n support for 10 languages (including RTL).
- **SEO**: Utilizes `react-helmet-async` for per-page SEO and JSON-LD structured data.

### Backend
- **Runtime**: Node.js with Express 5 and TypeScript.
- **API**: RESTful JSON API endpoints.
- **Authentication**: Secure HttpOnly session-cookie authentication via `express-session` and `bcryptjs`.
- **Security**: `helmet` for security headers, explicit CORS (production: `ossaiproapp.com` only, dev: all origins), `express-rate-limit` on all authentication endpoints (login, register, register-hotel, demo-login, forgot-password, reset-password). Centralized rate limit middleware in `server/middleware/rateLimit.ts` (15min window, 20 max requests). Zod input validation via `server/middleware/validateBody.ts` on all POST/PATCH routes in bookings, units, and staff. Validator schemas in `server/validators/`.
- **Logging**: Structured production logging via `pino` + `pino-http`.
- **Error Handling**: Centralized error handling with i18n-translated messages.
- **WebSocket Server**: Dedicated for real-time IoT device communication with session-cookie-based authentication and tenant ownership validation.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Schema**: Comprehensive schema with a nullable `tenantId` column for universal tenant isolation.
- **Migrations**: Drizzle Kit for database schema management.

### Multi-Tenant Architecture
- **Tenant Isolation**: Global middleware resolves `tenantId` for authenticated requests.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions.
- **Demo Data Reset**: Automatic cleanup and fresh state creation for demo users.

### Feature Gating & Subscription Management
- **Plan-Based Feature Gating**: `PLAN_CODE_FEATURES` as the sole source of truth for feature access and limits, enforced by backend middleware.
- **Plan Usage Limits Enforcement**: Checks limits for rooms, staff, integrations, and monthly API calls.
- **Smart Plan Hardware Enforcement**: Validates hardware actions against subscription tiers.
- **Onboarding Wizard**: 4-step flow for property setup with plan selection. New registrations default to a trial.
- **Subscription Lifecycle Automation**: Full status machine (trial → active → past_due → expired/suspended) with daily cron job for auto-renewal via Epoint. Idempotent webhook handling for renewal payments.
- **Subscription Management API**: Routes for status check, auto-renew toggle, cancel-at-period-end, and reactivation.

### Core Features
- **Property & Staff Management**: Includes onboarding and per-property staff management.
- **SaaS Features**: Feature flag engine, usage metering, audit logging, billing & subscription, device registry, and analytics.
- **Financial Management (Hotel-Grade, Phase 1-5+)**: Guest Folio System complete — `guest_folios`, `folio_charges`, `folio_payments`, `folio_adjustments`. Folio auto-opens on `checked_in` (empty — room charges posted by night audit), auto-closes on `checked_out` (status→"closed"), finalized on demand (status→"finalized"). Idempotency-protected charges. Multi-method payment splits and deposits. Tax engine schema (`tax_configurations` — VAT, inclusive/exclusive per charge; taxRate stored as basis points × 100, e.g. 18%=1800). Double-entry GL schema (`chart_of_accounts`, `journal_entries`, `journal_entry_lines`). Departments & cost centers (`departments`, `cost_centers`). Night audit (`night_audits`). Pre-aggregated KPI analytics (`daily_financial_summaries`). Legacy `financial_transactions`/`revenues` remain but are soft-deprecated — `guest_folios` is the canonical source of truth. `bookings` extended with `depositAmount`, `depositDueDate`, `depositPaidAt`, `paidAmount`, `remainingBalance`. **Phase 5+ additions**: `folio_adjustments` extended with `approvalStatus` (pending/approved/rejected), `approvedAt`, `rejectedBy`, `rejectedAt`, `rejectionReason` — reception staff create pending adjustments, managers approve/reject. `cancellation_policies` table with free-cancellation window, no-show penalty and late-cancellation penalty (percent or fixed). Night Audit Engine (`server/services/nightAuditEngine.ts`) posts per-night room charges with idempotency keys, updates daily financial summaries. Cancellation Policy Engine (`server/services/cancellationPolicyEngine.ts`) auto-applies penalties on `cancelled`/`no_show` booking status. Night Audit Worker runs daily at 2:00 AM Baku time via PgBoss cron. PDF invoice service (`server/services/folioPdfService.ts`) generates hotel-grade A4 PDFs via PDFKit. APIs: `/api/folios/*`, `/api/departments`, `/api/tax-configs`, `/api/accounting/*`, `/api/night-audits`, `/api/night-audit/run` (manual trigger), `/api/finance/kpi`, `/api/finance/daily-summaries`, `/api/folios/:id/invoice/pdf` (PDF download), `/api/folios/:id/adjustments/:adjId/approve|reject`, `/api/cancellation-policies` (CRUD). **Special endpoint**: `POST /api/folios/booking/:bookingId/open` — manually opens a folio for no-show/cancellation penalty billing (idempotent). Invoice endpoint includes `guestName` (from fullName), `roomNumber`, `checkInDate`, `checkOutDate`, `taxRatePercent` per charge.
- **Communication Layer**: Two-layer internal (Owner↔Staff) and Guest Service (Guest↔Staff) communication with escalation.
- **Notification Service**: Interactive notification center with action buttons.
- **Escalation System**: Full escalation management with reply threading and status tracking.
- **Smart Room Controls**: Brightness, curtain position, and AI wake-up time selection.
- **Guest Experience Services**: Centralized guest communication and service management.
- **Dashboards**: TasksView, CalendarView, and Performance Dashboard.
- **Prepare My Stay Workflow**: Guests submit arrival info for reception confirmation.
- **Online Check-in (MVP)**: Guests submit personal details, digital signature, and optional ID upload.
- **Auto Housekeeping Engine (PRO)**: MEWS-level housekeeping with auto-creation of tasks, duplicate prevention, priority engine, balanced staff assignment, and inspection flow.
- **Room Status Engine**: Automatic unit status updates based on booking state changes and manual override.
- **Availability Engine**: `room_nights` table with unique constraint to prevent double bookings; atomic booking creation.
- **Rate Plans**: `rate_plans` table for OTA-compatible pricing with refund policies and meal plans.
- **Hotel Analytics**: Provides key hotel metrics like occupancy rate, ADR, RevPAR, total revenue, sold nights, and available nights.
- **Dynamic Pricing Engine**: `pricing_rules` table with various rule types and cumulative adjustments.
- **SaaS Metrics Dashboard**: Calculates MRR, ARR, churn rate, ARPU, LTV from subscriptions and invoices.
- **Refund Management System**: Tracks refund workflow (pending → approved → processed, or rejected) and updates invoice/transaction statuses.
- **Admin Finance Center**: Provides platform-wide financial metrics and data.

### AI Chat Widget
- **Floating Chat Bubble**: Fixed bottom-right widget visible on all pages (Intercom/Drift style).
- **AI-Powered Responses**: Integrates with OpenAI GPT-4o-mini via `OPENAI_API_KEY` env var (gracefully falls back to offline message if not set).
- **Demo Lead Capture**: Detects demo/trial intent keywords, shows inline lead form (property name, country, type, email). Leads saved to `leads` PostgreSQL table.
- **Public Endpoints**: `POST /api/ai-chat` and `POST /api/ai-chat/lead` are whitelisted as public (no auth required).
- **Files**: `client/src/components/ai-chat-widget.tsx`, `server/routes/ai-chat.routes.ts`.

### Smart Restaurant Ecosystem
- **Waiter-Kitchen-Guest Loop**: Full POS-style restaurant management. Tables: `pos_menu_categories`, `pos_menu_items`, `pos_orders`, `pos_order_items`, `waiter_calls`. New user roles: `restaurant_manager`, `kitchen_staff`, `waiter`.
- **Kitchen Display System** (`/restaurant/kitchen`): Real-time KDS with WebSocket push, order cards with status flow (pending→cooking→ready).
- **Waiter View** (`/restaurant/waiter`): Picks up ready orders, marks delivered, acknowledges waiter calls with real-time notifications.
- **Restaurant Manager** (`/restaurant/manager`): Menu CRUD (categories + items), live order board, settlement flow (cash/card/room charge → folio post), today's analytics.
- **Guest Ordering**: "Call Waiter" one-tap button and "Order Food" modal with categorized menu + quantity picker added to guest dashboard.
- **Settlement Integration**: If `bookingId` present, restaurant charges are posted to the guest's open folio as `chargeType: "restaurant"` with idempotency key.
- **APIs**: `/api/restaurant/menu`, `/api/restaurant/menu/categories`, `/api/restaurant/menu/items`, `/api/restaurant/orders`, `/api/restaurant/orders/:id/kitchen-status`, `/api/restaurant/orders/:id/deliver`, `/api/restaurant/orders/:id/settle`, `/api/restaurant/waiter-call`, `/api/restaurant/waiter-calls`, `/api/restaurant/waiter-calls/:id/acknowledge`, `/api/restaurant/analytics`.
- **WebSocket Events**: `RESTAURANT_NEW_ORDER`, `RESTAURANT_ORDER_READY`, `RESTAURANT_ORDER_DELIVERED`, `RESTAURANT_CALL_WAITER`, `RESTAURANT_WAITER_ACKNOWLEDGED` — broadcast via `broadcastToProperty()`.

### Automated Systems
- **Marketing Referral System**: `referral_source`, `referral_staff_id`, `referral_notes` fields on `owners` table. New `referral_commissions` table tracks pending/paid commissions per referring staff member. Registration form includes "How did you hear about us?" with optional staff referral code validation (code stored as `referral_code` on `users`). Backend validates staff referral code on `POST /api/auth/register-hotel` and creates a commission record automatically.
- **Multi-Property Business Entity Check**: `POST /api/properties` validates that if the owner has a `tax_id` on file and the new property provides a different `tax_id`, creation is blocked with message: "New properties must belong to the same legal business entity." Super admins are exempt.
- **Password Reset Error Surface**: `POST /api/auth/forgot-password` no longer silently swallows email failures. If the email delivery returns an error (e.g. missing API key), the API now returns HTTP 500 with a descriptive message so the issue is visible during debugging.
- **Automated Database Backup**: Daily `pg_dump` backups, retaining the last 7, with monitoring for failures.
- **Production Monitoring & Error Tracking**: Centralized alert tracking with admin email notifications for critical system events.
- **Billing Email Notification System**: Sends transactional emails for payment success/failure, trial ending, subscription suspension, and refund approvals.

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database.

### UI Framework Dependencies
- **Radix UI**: Provides accessible UI primitives.
- **shadcn/ui**: Reusable UI components built on Radix UI.
- **Lucide React**: Icon library.

### Integrations
- **Resend**: Transactional email services.
- **Epoint.az**: Local payment gateway integration for Azerbaijan.

### Job Queue
- **pg-boss**: PostgreSQL-backed job queue for async background tasks and workers for booking and OTA synchronization.

### External OTA Bookings
- **Integration**: Supports importing bookings from platforms like Booking.com, Airbnb, Expedia into `external_bookings` table.
- **Sync**: API endpoint enqueues `booking-sync` jobs to fetch and parse iCal data.

### OTA Connector Layer
- **Components**: Manages `ota_integrations` and `ota_sync_logs`.
- **Services**: `otaSyncService.ts` to push availability/rates and pull reservations, `availabilityExportService.ts` and `rateExportService.ts` for data calculation.
- **Channel Manager Logic**: Maps OTA statuses, handles conflicts, and auto-creates internal bookings.

### Audit Log UI
- **Table**: `audit_logs` stores security/admin events with `previousValues`/`newValues` for change tracking.