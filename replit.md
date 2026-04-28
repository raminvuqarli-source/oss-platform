# O.S.S - Smart Hotel System

## Overview
O.S.S (Smart Hotel System) is a multi-tenant SaaS platform designed for comprehensive property management in the hospitality industry. Its primary purpose is to streamline hotel operations and enhance guest experiences across various property types. Key capabilities include smart room controls, efficient service request handling, role-based dashboards, IoT device tracking, flexible subscription plans, and cross-property analytics, providing a robust and scalable solution for property owners. The project aims to become a leading solution in hospitality tech, offering a unified platform for managing all aspects of hotel operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Wouter for routing, and TanStack React Query for state management.
- **UI/UX**: Minimalist, card-based design inspired by Airbnb, utilizing shadcn/ui and Tailwind CSS with theming (dark/light modes). Focus on touch-friendly elements and accessibility.
- **Internationalization**: i18n support for 10 languages, including RTL.
- **SEO**: Utilizes `react-helmet-async` for per-page SEO and JSON-LD structured data.

### Backend
- **Runtime**: Node.js with Express 5 and TypeScript.
- **API**: RESTful JSON API endpoints.
- **Authentication**: Secure HttpOnly session-cookie authentication via `express-session` and `bcryptjs`.
- **Security**: `helmet` for security headers, explicit CORS, `express-rate-limit` on authentication endpoints, and Zod for input validation.
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
- **Subscription Lifecycle Automation**: Full status machine (trial → active → past_due → expired/suspended) with daily cron job for auto-renewal. Idempotent webhook handling for renewal payments.
- **Subscription Management API**: Routes for status check, auto-renew toggle, cancel-at-period-end, and reactivation.

### Core Features
- **Property & Staff Management**: Includes onboarding and per-property staff management.
- **SaaS Features**: Feature flag engine, usage metering, audit logging, billing & subscription, device registry, and analytics.
- **Financial Management (Hotel-Grade)**: Guest Folio System with idempotent charges, multi-method payment splits, and a tax engine. Integrates with a double-entry General Ledger schema and supports departments/cost centers. Includes Night Audit Engine for automated room charge posting and daily financial summaries. Cancellation Policy Engine applies penalties. PDF invoice generation service.
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
- **Refund Management System**: Tracks refund workflow and updates invoice/transaction statuses.
- **Admin Finance Center**: Provides platform-wide financial metrics and data.

### AI Chat Widget
- **Floating Chat Bubble**: Fixed bottom-right widget visible on all pages.
- **AI-Powered Responses**: Integrates with OpenAI GPT-4o-mini.
- **Demo Lead Capture**: Detects demo/trial intent keywords and shows an inline lead form. Leads are saved to PostgreSQL.
- **Public Endpoints**: `POST /api/ai-chat` and `POST /api/ai-chat/lead` are whitelisted.

### Smart Restaurant Ecosystem
- **Roles**: `restaurant_manager`, `kitchen_staff`, `waiter`, `restaurant_cleaner` — each with their own dashboard and sidebar navigation.
- **Kitchen Display System**: Real-time KDS with WebSocket push; prominent "HAZIRDIR" button broadcasts readiness to all staff.
- **Waiter View**: Manages order delivery with prominent "HAZIRDIR — Çatdırıldı" button; waiter call acknowledgement.
- **Restaurant Manager Dashboard**: 8-tab panel: Sifarişlər, Hesablaşma, Otaqlar (room billing), Menyu, Qarsonlar (waiter profiles), Temizlik (cleaning tasks), Heyat (staff), Maliyyə (finance breakdown).
- **Waiter Profile Management**: Manager can set salary, tax rate, and table assignments per waiter via edit modal.
- **Cleaning Task System**: Manager creates tasks with location/assignment; cleaners mark done with optional photo upload.
- **Restaurant Cleaner Dashboard** (`/restaurant/cleaner`): Shows assigned tasks, mark in-progress/done, photo upload to prove completion.
- **Room Orders View**: Manager sees all rooms with pending restaurant bills, grouped by room, with settle button.
- **Restaurant Finance Tab**: Today/month revenue, all-time totals, breakdown by payment type (cash/card/room charge), order status distribution.
- **Hotel Owner/Manager Finance Integration**: `RestaurantRevenueCard` in owner dashboard performance tab showing restaurant revenue metrics.
- **Guest Ordering**: "Call Waiter" button and "Order Food" modal on guest dashboard.
- **Settlement Integration**: Restaurant charges can be posted to the guest's open folio.
- **New DB Tables**: `restaurant_cleaning_tasks`, `restaurant_staff_profiles`.
- **WebSocket Events**: Real-time events for new orders, order status changes, waiter calls, and cleaning task updates.

### Automated Systems
- **Marketing Referral System**: `referral_source`, `referral_staff_id`, `referral_notes` on `owners` table; `referral_commissions` table tracks pending/paid commissions. Registration form captures referral source + optional staff referral code (validated on register). New `marketing_staff` role: OSS super admin creates marketing accounts from **Marketing** tab in admin panel, assigns referral codes; staff log in and land at `/marketing` — dedicated panel showing only their referred hotels, subscription/trial status, and hotel details. APIs: `POST|GET /api/oss-admin/marketing-users`, `PATCH /api/oss-admin/marketing-users/:id/referral-code`, `GET /api/marketing/me|my-hotels|my-commissions`.
- **Multi-Property Business Entity Check**: Validates that new properties belong to the same legal business entity as the owner.
- **Password Reset Error Surface**: Improved error handling for `forgot-password` API.
- **Automated Database Backup**: Daily `pg_dump` backups with retention and monitoring.
- **Production Monitoring & Error Tracking**: Centralized alert tracking with admin email notifications.
- **Billing Email Notification System**: Sends transactional emails for payment and subscription events.

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
- **OpenAI**: AI-powered chat responses.

### Job Queue
- **pg-boss**: PostgreSQL-backed job queue for async background tasks, including booking and OTA synchronization.

### External OTA Bookings
- **Integration**: Supports importing bookings from platforms like Booking.com, Airbnb, Expedia into `external_bookings` table.
- **Sync**: API endpoint enqueues `booking-sync` jobs to fetch and parse iCal data.

### OTA Connector Layer
- **Components**: Manages `ota_integrations` and `ota_sync_logs`.
- **Services**: `otaSyncService.ts` to push availability/rates and pull reservations, `availabilityExportService.ts` and `rateExportService.ts` for data calculation.
- **Channel Manager Logic**: Maps OTA statuses, handles conflicts, and auto-creates internal bookings.