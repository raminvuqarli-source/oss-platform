-- ==================================================================================
-- O.S.S Smart Hotel System - Initial Database Schema
-- Creates ALL base tables from scratch for a fresh PostgreSQL installation
-- Generated from shared/schema.ts
-- ==================================================================================

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. owners
-- ============================================================
CREATE TABLE IF NOT EXISTS "owners" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "company_name" text,
  "country" text,
  "city" text,
  "address" text,
  "logo_url" text,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp DEFAULT now()
);

-- ============================================================
-- 2. properties
-- ============================================================
CREATE TABLE IF NOT EXISTS "properties" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "name" text NOT NULL,
  "type" text NOT NULL DEFAULT 'hotel',
  "address" text,
  "phone" text,
  "email" text,
  "logo_url" text,
  "country" text,
  "city" text,
  "postal_code" text,
  "website" text,
  "star_rating" text,
  "total_units" integer,
  "number_of_floors" integer,
  "building_type" text,
  "primary_guest_type" text,
  "has_smart_devices" boolean DEFAULT false,
  "smart_door_locks" boolean DEFAULT false,
  "smart_hvac" boolean DEFAULT false,
  "smart_lighting" boolean DEFAULT false,
  "pms_system" boolean DEFAULT false,
  "bms_system" boolean DEFAULT false,
  "iot_sensors" boolean DEFAULT false,
  "pms_software" text,
  "pms_other" text,
  "expected_smart_room_count" integer,
  "billing_currency" text,
  "billing_contact_email" text,
  "timezone" text,
  "image_url" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_properties_tenant_id" ON "properties" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_properties_owner_id" ON "properties" ("owner_id");

-- ============================================================
-- 3. units
-- ============================================================
CREATE TABLE IF NOT EXISTS "units" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" varchar NOT NULL,
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "unit_number" text NOT NULL,
  "unit_category" text NOT NULL DEFAULT 'accommodation',
  "unit_type" text NOT NULL DEFAULT 'room',
  "name" text,
  "floor" integer,
  "capacity" integer DEFAULT 2,
  "description" text,
  "amenities" text[],
  "price_per_night" integer,
  "status" text NOT NULL DEFAULT 'available',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_units_tenant_id" ON "units" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_units_property_id" ON "units" ("property_id");

-- ============================================================
-- 4. devices
-- ============================================================
CREATE TABLE IF NOT EXISTS "devices" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "unit_id" varchar,
  "property_id" varchar NOT NULL,
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "device_type" text NOT NULL,
  "name" text NOT NULL,
  "manufacturer" text,
  "model" text,
  "serial_number" text,
  "status" text NOT NULL DEFAULT 'offline',
  "ip_address" text,
  "mac_address" text,
  "firmware_version" text,
  "hardware_version" text,
  "last_online" timestamp,
  "last_ping" timestamp,
  "battery_level" integer,
  "signal_strength" integer,
  "capabilities" text[],
  "configuration" jsonb,
  "metadata" jsonb,
  "is_active" boolean DEFAULT true,
  "installed_at" timestamp,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_devices_tenant_id" ON "devices" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_devices_owner_id" ON "devices" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_devices_property_id" ON "devices" ("property_id");

-- ============================================================
-- 5. subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "plan_type" text NOT NULL DEFAULT 'starter',
  "plan_code" text DEFAULT 'CORE_STARTER',
  "smart_plan_type" text DEFAULT 'none',
  "feature_flags" jsonb DEFAULT '{"smart_room": true, "ai_concierge": false, "analytics": true, "iot_devices": false}'::jsonb,
  "max_properties" integer DEFAULT 1,
  "max_units_per_property" integer DEFAULT 50,
  "max_staff" integer DEFAULT 5,
  "multi_property" boolean DEFAULT false,
  "performance_enabled" boolean DEFAULT false,
  "staff_performance_enabled" boolean DEFAULT false,
  "advanced_analytics" boolean DEFAULT false,
  "priority_support" boolean DEFAULT false,
  "custom_integrations" boolean DEFAULT false,
  "smart_rooms_enabled" boolean DEFAULT false,
  "guest_management" boolean DEFAULT true,
  "staff_management" boolean DEFAULT false,
  "start_date" timestamp DEFAULT now(),
  "end_date" timestamp,
  "trial_ends_at" timestamp,
  "is_active" boolean DEFAULT true,
  "status" text NOT NULL DEFAULT 'active',
  "current_period_start" timestamp DEFAULT now(),
  "current_period_end" timestamp,
  "auto_renew" boolean NOT NULL DEFAULT true,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "failed_payment_attempts" integer NOT NULL DEFAULT 0,
  "last_payment_order_id" varchar,
  "updated_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_subscriptions_tenant_id" ON "subscriptions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_period_end" ON "subscriptions" ("current_period_end");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_owner_id" ON "subscriptions" ("owner_id");

-- ============================================================
-- 6. hotels (legacy, kept for backward compatibility)
-- ============================================================
CREATE TABLE IF NOT EXISTS "hotels" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "address" text,
  "phone" text,
  "email" text,
  "logo_url" text,
  "country" text,
  "city" text,
  "postal_code" text,
  "website" text,
  "star_rating" text,
  "total_rooms" integer,
  "number_of_floors" integer,
  "building_type" text,
  "primary_guest_type" text,
  "has_smart_devices" boolean DEFAULT false,
  "smart_door_locks" boolean DEFAULT false,
  "smart_hvac" boolean DEFAULT false,
  "smart_lighting" boolean DEFAULT false,
  "pms_system" boolean DEFAULT false,
  "bms_system" boolean DEFAULT false,
  "iot_sensors" boolean DEFAULT false,
  "pms_software" text,
  "pms_other" text,
  "expected_smart_room_count" integer,
  "billing_currency" text,
  "billing_contact_email" text,
  "owner_id" varchar,
  "property_id" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_hotels_tenant_id" ON "hotels" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_hotels_owner_id" ON "hotels" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_hotels_property_id" ON "hotels" ("property_id");

-- ============================================================
-- 7. users
-- ============================================================
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "role" text NOT NULL DEFAULT 'guest',
  "full_name" text NOT NULL,
  "email" text,
  "phone" text,
  "phone_country_code" text,
  "avatar_url" text,
  "hotel_id" varchar,
  "owner_id" varchar,
  "property_id" varchar,
  "tenant_id" varchar,
  "language" text DEFAULT 'en',
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_users_hotel_id" ON "users" ("hotel_id");

-- ============================================================
-- 8. room_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS "room_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" varchar NOT NULL,
  "temperature" integer DEFAULT 22,
  "lights_on" boolean DEFAULT false,
  "lights_brightness" integer DEFAULT 50,
  "bathroom_lights_on" boolean DEFAULT false,
  "bathroom_lights_brightness" integer DEFAULT 50,
  "hall_lights_on" boolean DEFAULT false,
  "hall_lights_brightness" integer DEFAULT 50,
  "non_dimmable_lights_on" boolean DEFAULT false,
  "curtains_open" boolean DEFAULT false,
  "curtains_position" integer DEFAULT 0,
  "jacuzzi_on" boolean DEFAULT false,
  "jacuzzi_temperature" integer DEFAULT 38,
  "welcome_mode" boolean DEFAULT true,
  "door_locked" boolean DEFAULT true,
  "tenant_id" varchar,
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_room_settings_tenant_id" ON "room_settings" ("tenant_id");

-- ============================================================
-- 9. bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "guest_id" varchar NOT NULL,
  "room_number" text NOT NULL,
  "room_type" text NOT NULL,
  "check_in_date" timestamp NOT NULL,
  "check_out_date" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'booked',
  "pre_checked_in" boolean DEFAULT false,
  "special_requests" text,
  "booking_number" text,
  "booking_source" text,
  "number_of_guests" integer,
  "nationality" text,
  "passport_number" text,
  "date_of_birth" text,
  "guest_address" text,
  "arrival_time" text,
  "pre_check_notes" text,
  "rejection_reason" text,
  "special_notes" text,
  "nightly_rate" integer,
  "total_price" integer,
  "currency" text DEFAULT 'USD',
  "discount" integer,
  "travel_agency_name" text,
  "payment_status" text DEFAULT 'unpaid',
  "guest_signature_base64" text,
  "id_document_base64" text,
  "owner_id" varchar,
  "property_id" varchar,
  "unit_id" varchar,
  "rate_plan_id" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_bookings_tenant_id" ON "bookings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_guest_id" ON "bookings" ("guest_id");

-- ============================================================
-- 10. service_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS "service_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "guest_id" varchar NOT NULL,
  "booking_id" varchar NOT NULL,
  "room_number" text NOT NULL,
  "request_type" text NOT NULL,
  "description" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "priority" text DEFAULT 'normal',
  "assigned_to" varchar,
  "notes" text,
  "owner_id" varchar,
  "property_id" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_service_requests_tenant_id" ON "service_requests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_service_requests_booking_id" ON "service_requests" ("booking_id");

-- ============================================================
-- 11. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "tenant_id" varchar,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "type" text NOT NULL DEFAULT 'info',
  "read" boolean DEFAULT false,
  "action_url" text,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_notifications_tenant_id" ON "notifications" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");

-- ============================================================
-- 12. door_action_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS "door_action_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" varchar NOT NULL,
  "guest_id" varchar NOT NULL,
  "room_number" text NOT NULL,
  "action" text NOT NULL,
  "performed_by" text NOT NULL,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_door_action_logs_tenant_id" ON "door_action_logs" ("tenant_id");

-- ============================================================
-- 13. credential_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS "credential_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "guest_id" varchar NOT NULL,
  "action" text NOT NULL,
  "performed_by" varchar NOT NULL,
  "performed_by_name" text NOT NULL,
  "notes" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_credential_logs_tenant_id" ON "credential_logs" ("tenant_id");

-- ============================================================
-- 14. chat_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "guest_id" varchar NOT NULL,
  "sender_id" varchar NOT NULL,
  "sender_role" text NOT NULL,
  "message" text NOT NULL,
  "property_id" varchar,
  "tenant_id" varchar,
  "thread_type" text NOT NULL DEFAULT 'guest_service',
  "escalated_by" varchar,
  "escalation_note" text,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_chat_messages_tenant_id" ON "chat_messages" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_hotel_id" ON "chat_messages" ("hotel_id");

-- ============================================================
-- 15. escalation_replies
-- ============================================================
CREATE TABLE IF NOT EXISTS "escalation_replies" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "escalation_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "message" text NOT NULL,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_escalation_replies_tenant_id" ON "escalation_replies" ("tenant_id");

-- ============================================================
-- 16. escalations
-- ============================================================
CREATE TABLE IF NOT EXISTS "escalations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" varchar NOT NULL,
  "hotel_id" varchar NOT NULL,
  "guest_id" varchar NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "assigned_to" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_escalations_tenant_id" ON "escalations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_escalations_hotel_id" ON "escalations" ("hotel_id");

-- ============================================================
-- 17. financial_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS "financial_transactions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "guest_id" varchar,
  "booking_id" varchar,
  "room_number" text,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "payment_status" text NOT NULL DEFAULT 'pending',
  "payment_method" text,
  "transaction_reference" text,
  "notes" text,
  "created_by" varchar NOT NULL,
  "created_by_name" text NOT NULL,
  "voided_at" timestamp,
  "voided_by" varchar,
  "void_reason" text,
  "owner_id" varchar,
  "property_id" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_tenant_id" ON "financial_transactions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_hotel_id" ON "financial_transactions" ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_owner_id" ON "financial_transactions" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_created_at" ON "financial_transactions" ("created_at");

-- ============================================================
-- 18. financial_audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS "financial_audit_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "transaction_id" varchar NOT NULL,
  "action" text NOT NULL,
  "performed_by" varchar NOT NULL,
  "performed_by_name" text NOT NULL,
  "previous_values" jsonb,
  "new_values" jsonb,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_financial_audit_logs_tenant_id" ON "financial_audit_logs" ("tenant_id");

-- ============================================================
-- 19. no_show_records
-- ============================================================
CREATE TABLE IF NOT EXISTS "no_show_records" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "booking_id" varchar NOT NULL,
  "guest_id" varchar NOT NULL,
  "room_number" text NOT NULL,
  "expected_check_in" timestamp NOT NULL,
  "estimated_revenue_loss" integer,
  "recorded_by" varchar NOT NULL,
  "recorded_by_name" text NOT NULL,
  "notes" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_no_show_records_tenant_id" ON "no_show_records" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_no_show_records_hotel_id" ON "no_show_records" ("hotel_id");

-- ============================================================
-- 20. quote_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS "quote_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_name" text NOT NULL,
  "contact_name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text NOT NULL,
  "country" text NOT NULL,
  "city" text NOT NULL,
  "preferred_contact_hours" text,
  "timezone" text,
  "preferred_contact_method" text,
  "total_rooms" integer,
  "expected_smart_rooms" integer,
  "interested_features" text[],
  "message" text,
  "source_page" text NOT NULL,
  "language" text DEFAULT 'en',
  "status" text NOT NULL DEFAULT 'NEW',
  "internal_notes" text,
  "email_sent" boolean DEFAULT false,
  "assigned_to_user_id" varchar,
  "contacted_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ============================================================
-- 21. quote_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS "quote_notes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_request_id" varchar NOT NULL,
  "author_user_id" varchar NOT NULL,
  "note_text" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- ============================================================
-- 22. room_preparation_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS "room_preparation_orders" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "guest_id" varchar NOT NULL,
  "hotel_id" varchar NOT NULL,
  "room_number" text NOT NULL,
  "occasion_type" text NOT NULL,
  "decoration_style" text,
  "add_ons" text[],
  "notes" text,
  "budget_range" text NOT NULL DEFAULT 'medium',
  "custom_budget" integer,
  "preferred_datetime" timestamp,
  "reference_image_url" text,
  "price" integer,
  "status" text NOT NULL DEFAULT 'pending',
  "staff_assigned" varchar,
  "admin_notes" text,
  "rejection_reason" text,
  "owner_id" varchar,
  "property_id" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_room_preparation_orders_tenant_id" ON "room_preparation_orders" ("tenant_id");

-- ============================================================
-- 23. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar,
  "property_id" varchar,
  "user_id" varchar,
  "user_role" text,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" varchar,
  "description" text,
  "previous_values" jsonb,
  "new_values" jsonb,
  "ip_address" text,
  "user_agent" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_id" ON "audit_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_logs" ("action");

-- ============================================================
-- 24. feature_flag_overrides
-- ============================================================
CREATE TABLE IF NOT EXISTS "feature_flag_overrides" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "feature_name" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "reason" text,
  "expires_at" timestamp,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_feature_flag_overrides_tenant_id" ON "feature_flag_overrides" ("tenant_id");

-- ============================================================
-- 25. usage_meters
-- ============================================================
CREATE TABLE IF NOT EXISTS "usage_meters" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "metric_type" text NOT NULL,
  "current_value" integer NOT NULL DEFAULT 0,
  "max_allowed" integer NOT NULL,
  "tenant_id" varchar,
  "last_updated" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_usage_meters_tenant_id" ON "usage_meters" ("tenant_id");

-- ============================================================
-- 26. white_label_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS "white_label_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "logo_url" text,
  "favicon_url" text,
  "primary_color" text,
  "secondary_color" text,
  "accent_color" text,
  "custom_domain" text,
  "company_name" text,
  "hide_branding" boolean DEFAULT false,
  "custom_css" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_white_label_settings_tenant_id" ON "white_label_settings" ("tenant_id");

-- ============================================================
-- 27. onboarding_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS "onboarding_progress" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "current_step" integer NOT NULL DEFAULT 1,
  "completed_steps" integer[] DEFAULT '{}'::integer[],
  "account_completed" boolean DEFAULT false,
  "property_completed" boolean DEFAULT false,
  "units_completed" boolean DEFAULT false,
  "smart_system_completed" boolean DEFAULT false,
  "staff_completed" boolean DEFAULT false,
  "subscription_completed" boolean DEFAULT false,
  "devices_completed" boolean DEFAULT false,
  "is_complete" boolean DEFAULT false,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_onboarding_progress_tenant_id" ON "onboarding_progress" ("tenant_id");

-- ============================================================
-- 28. billing_info
-- ============================================================
CREATE TABLE IF NOT EXISTS "billing_info" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "payment_method_last4" text,
  "payment_method_brand" text,
  "billing_email" text,
  "billing_name" text,
  "billing_address" jsonb,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_billing_info_tenant_id" ON "billing_info" ("tenant_id");

-- ============================================================
-- 29. invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "invoice_number" text,
  "stripe_invoice_id" text,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'usd',
  "status" text NOT NULL DEFAULT 'draft',
  "description" text,
  "invoice_url" text,
  "pdf_url" text,
  "pdf_path" text,
  "period_start" timestamp,
  "period_end" timestamp,
  "paid_at" timestamp,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_invoices_tenant_id" ON "invoices" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_owner_id" ON "invoices" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "idx_invoices_paid_at" ON "invoices" ("paid_at");

-- ============================================================
-- 30. payment_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS "payment_orders" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "plan_type" text NOT NULL,
  "order_type" text DEFAULT 'subscription',
  "reference_id" varchar,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'AZN',
  "status" text NOT NULL DEFAULT 'pending',
  "payment_method_id" varchar,
  "customer_note" text,
  "admin_note" text,
  "transfer_reference" text,
  "reviewed_by" varchar,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_payment_orders_owner_id" ON "payment_orders" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_payment_orders_status" ON "payment_orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_payment_orders_tenant_id" ON "payment_orders" ("tenant_id");

-- ============================================================
-- 31. device_telemetry
-- ============================================================
CREATE TABLE IF NOT EXISTS "device_telemetry" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "device_id" varchar NOT NULL,
  "metric_name" text NOT NULL,
  "metric_value" real,
  "string_value" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_device_telemetry_tenant_id" ON "device_telemetry" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_device_telemetry_device_id" ON "device_telemetry" ("device_id");

-- ============================================================
-- 32. analytics_snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "property_id" varchar,
  "snapshot_type" text NOT NULL,
  "period" text NOT NULL,
  "data" jsonb NOT NULL,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_analytics_snapshots_tenant_id" ON "analytics_snapshots" ("tenant_id");

-- ============================================================
-- 33. staff_invitations
-- ============================================================
CREATE TABLE IF NOT EXISTS "staff_invitations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" varchar NOT NULL,
  "owner_id" varchar NOT NULL,
  "email" text NOT NULL,
  "staff_role" text NOT NULL DEFAULT 'front_desk',
  "status" text NOT NULL DEFAULT 'pending',
  "invited_by" varchar NOT NULL,
  "accepted_by" varchar,
  "invite_token" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_staff_invitations_tenant_id" ON "staff_invitations" ("tenant_id");

-- ============================================================
-- 34. revenues
-- ============================================================
CREATE TABLE IF NOT EXISTS "revenues" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "property_id" varchar,
  "owner_id" varchar,
  "booking_id" varchar,
  "guest_id" varchar,
  "transaction_id" varchar,
  "room_number" text,
  "category" text NOT NULL DEFAULT 'room_booking',
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "payment_method" text,
  "payment_status" text NOT NULL DEFAULT 'pending',
  "source_type" text NOT NULL DEFAULT 'auto',
  "created_by" varchar,
  "created_by_name" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_revenues_tenant_id" ON "revenues" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_revenues_hotel_id" ON "revenues" ("hotel_id");

-- ============================================================
-- 35. expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "property_id" varchar,
  "owner_id" varchar,
  "recurring_expense_id" varchar,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "vendor" text,
  "receipt_url" text,
  "source_type" text NOT NULL DEFAULT 'staff_input',
  "period_month" integer,
  "period_year" integer,
  "created_by" varchar,
  "created_by_name" text,
  "approved_by" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_expenses_tenant_id" ON "expenses" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_expenses_hotel_id" ON "expenses" ("hotel_id");

-- ============================================================
-- 36. payroll_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS "payroll_configs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "property_id" varchar,
  "owner_id" varchar,
  "staff_id" varchar NOT NULL,
  "staff_name" text NOT NULL,
  "staff_role" text NOT NULL,
  "base_salary" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "frequency" text NOT NULL DEFAULT 'monthly',
  "bonus_rules" text,
  "deduction_rules" text,
  "bank_details" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_payroll_configs_tenant_id" ON "payroll_configs" ("tenant_id");

-- ============================================================
-- 37. payroll_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS "payroll_entries" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "property_id" varchar,
  "owner_id" varchar,
  "payroll_config_id" varchar NOT NULL,
  "staff_id" varchar NOT NULL,
  "staff_name" text NOT NULL,
  "amount" integer NOT NULL,
  "bonus_amount" integer DEFAULT 0,
  "deduction_amount" integer DEFAULT 0,
  "net_amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "period_month" integer NOT NULL,
  "period_year" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'scheduled',
  "paid_at" timestamp,
  "notes" text,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_payroll_entries_tenant_id" ON "payroll_entries" ("tenant_id");

-- ============================================================
-- 38. cash_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS "cash_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "property_id" varchar,
  "owner_id" varchar,
  "account_type" text NOT NULL DEFAULT 'cash',
  "account_name" text NOT NULL,
  "balance" integer NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'USD',
  "tenant_id" varchar,
  "last_updated" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_cash_accounts_tenant_id" ON "cash_accounts" ("tenant_id");

-- ============================================================
-- 39. recurring_expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS "recurring_expenses" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "property_id" varchar,
  "owner_id" varchar,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "frequency" text NOT NULL DEFAULT 'monthly',
  "vendor" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "next_run_at" timestamp,
  "last_run_at" timestamp,
  "created_by" varchar,
  "tenant_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_recurring_expenses_tenant_id" ON "recurring_expenses" ("tenant_id");

-- ============================================================
-- 40. password_reset_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- ============================================================
-- 41. contracts
-- ============================================================
CREATE TABLE IF NOT EXISTS "contracts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "region" text NOT NULL,
  "country" text NOT NULL,
  "client_name" text NOT NULL,
  "contract_value" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'AZN',
  "partner_company" text,
  "partner_commission_percent" integer NOT NULL DEFAULT 20,
  "tax_percent" integer NOT NULL DEFAULT 18,
  "state_fee_percent" integer NOT NULL DEFAULT 10,
  "status" text NOT NULL DEFAULT 'draft',
  "notes" text,
  "signed_date" timestamp,
  "created_by" varchar,
  "created_at" timestamp DEFAULT now()
);

-- ============================================================
-- 42. board_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS "board_reports" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporter_name" text NOT NULL,
  "region" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "contract_ids" text[],
  "period_start" timestamp,
  "period_end" timestamp,
  "created_by" varchar,
  "created_at" timestamp DEFAULT now()
);

-- ============================================================
-- 43. staff_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS "staff_messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar NOT NULL,
  "tenant_id" varchar,
  "sender_role" text NOT NULL DEFAULT 'owner',
  "sender_id" varchar NOT NULL,
  "message_text" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_staff_messages_hotel_id" ON "staff_messages" ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_staff_messages_tenant_id" ON "staff_messages" ("tenant_id");

-- ============================================================
-- 44. staff_message_status
-- ============================================================
CREATE TABLE IF NOT EXISTS "staff_message_status" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" varchar NOT NULL,
  "staff_id" varchar NOT NULL,
  "is_read" boolean DEFAULT false,
  "read_at" timestamp
);
CREATE INDEX IF NOT EXISTS "idx_staff_message_status_message_id" ON "staff_message_status" ("message_id");
CREATE INDEX IF NOT EXISTS "idx_staff_message_status_staff_id" ON "staff_message_status" ("staff_id");

-- ============================================================
-- 45. staff_performance_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS "staff_performance_scores" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "staff_id" varchar NOT NULL,
  "hotel_id" varchar NOT NULL,
  "tenant_id" varchar,
  "message_response_score" real DEFAULT 0,
  "task_completion_score" real DEFAULT 0,
  "service_quality_score" real DEFAULT 0,
  "activity_score" real DEFAULT 0,
  "manual_adjustment" real DEFAULT 0,
  "total_score" real DEFAULT 0,
  "period" text NOT NULL,
  "calculated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_staff_performance_staff_id" ON "staff_performance_scores" ("staff_id");
CREATE INDEX IF NOT EXISTS "idx_staff_performance_hotel_id" ON "staff_performance_scores" ("hotel_id");

-- ============================================================
-- 46. staff_feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS "staff_feedback" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "staff_id" varchar NOT NULL,
  "hotel_id" varchar NOT NULL,
  "tenant_id" varchar,
  "type" text NOT NULL,
  "reason" text,
  "score_impact" real NOT NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_staff_feedback_staff_id" ON "staff_feedback" ("staff_id");
CREATE INDEX IF NOT EXISTS "idx_staff_feedback_hotel_id" ON "staff_feedback" ("hotel_id");

-- ============================================================
-- 47. contract_acceptances
-- ============================================================
CREATE TABLE IF NOT EXISTS "contract_acceptances" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "user_id" varchar NOT NULL,
  "plan_code" text NOT NULL,
  "plan_type" text NOT NULL,
  "smart_plan_type" text,
  "contract_version" text NOT NULL,
  "property_name" text,
  "monthly_price" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "accepted_at" timestamp NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "contract_language" text NOT NULL DEFAULT 'EN',
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_contract_acceptances_owner_id" ON "contract_acceptances" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_contract_acceptances_tenant_id" ON "contract_acceptances" ("tenant_id");

-- ============================================================
-- 48. housekeeping_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS "housekeeping_tasks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" varchar NOT NULL,
  "property_id" varchar NOT NULL,
  "unit_id" varchar NOT NULL,
  "booking_id" varchar,
  "room_number" text NOT NULL,
  "task_type" text NOT NULL,
  "cleaning_type" text,
  "status" text NOT NULL DEFAULT 'pending',
  "priority" text DEFAULT 'normal',
  "assigned_to" varchar,
  "trigger_source" text NOT NULL,
  "notes" text,
  "due_date" timestamp,
  "created_at" timestamp DEFAULT now(),
  "completed_at" timestamp
);
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_tenant_id" ON "housekeeping_tasks" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_property_id" ON "housekeeping_tasks" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_unit_id" ON "housekeeping_tasks" ("unit_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_booking_id" ON "housekeeping_tasks" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_assigned_to" ON "housekeeping_tasks" ("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_status" ON "housekeeping_tasks" ("status");

-- ============================================================
-- 49. external_bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS "external_bookings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "hotel_id" varchar,
  "tenant_id" varchar,
  "source" text,
  "external_id" text,
  "guest_name" text,
  "checkin_date" text,
  "checkout_date" text,
  "room_name" text,
  "price" real,
  "status" text DEFAULT 'confirmed',
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_external_bookings_external_id_hotel_id" ON "external_bookings" ("external_id", "hotel_id");
CREATE INDEX IF NOT EXISTS "idx_external_bookings_tenant_id" ON "external_bookings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_external_bookings_hotel_id" ON "external_bookings" ("hotel_id");

-- ============================================================
-- 50. room_nights
-- ============================================================
CREATE TABLE IF NOT EXISTS "room_nights" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "unit_id" varchar NOT NULL,
  "date" date NOT NULL,
  "booking_id" varchar NOT NULL,
  "tenant_id" varchar,
  "property_id" varchar,
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_room_nights_unit_date" ON "room_nights" ("unit_id", "date");
CREATE INDEX IF NOT EXISTS "idx_room_nights_booking_id" ON "room_nights" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_room_nights_tenant_id" ON "room_nights" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_room_nights_property_date" ON "room_nights" ("property_id", "date");

-- ============================================================
-- 51. rate_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS "rate_plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" varchar NOT NULL,
  "tenant_id" varchar,
  "name" text NOT NULL,
  "refund_policy" text NOT NULL DEFAULT 'flexible',
  "meal_plan" text NOT NULL DEFAULT 'none',
  "price_modifier" real NOT NULL DEFAULT 0,
  "is_default" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_rate_plans_property_id" ON "rate_plans" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_rate_plans_tenant_id" ON "rate_plans" ("tenant_id");

-- ============================================================
-- 52. ota_integrations
-- ============================================================
CREATE TABLE IF NOT EXISTS "ota_integrations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" varchar NOT NULL,
  "tenant_id" varchar,
  "provider" text NOT NULL,
  "api_key" text,
  "api_secret" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_ota_integrations_property_id" ON "ota_integrations" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_ota_integrations_tenant_id" ON "ota_integrations" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ota_integrations_property_provider" ON "ota_integrations" ("property_id", "provider");

-- ============================================================
-- 53. ota_sync_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS "ota_sync_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" text NOT NULL,
  "property_id" varchar NOT NULL,
  "tenant_id" varchar,
  "action" text NOT NULL,
  "status" text NOT NULL,
  "response" text,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_property_id" ON "ota_sync_logs" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_tenant_id" ON "ota_sync_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_provider" ON "ota_sync_logs" ("provider");
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_created_at" ON "ota_sync_logs" ("created_at");

-- ============================================================
-- 54. ota_conflicts
-- ============================================================
CREATE TABLE IF NOT EXISTS "ota_conflicts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" text NOT NULL,
  "external_id" text NOT NULL,
  "property_id" varchar NOT NULL,
  "tenant_id" varchar,
  "unit_id" varchar,
  "check_in" text,
  "check_out" text,
  "guest_name" text,
  "reason" text NOT NULL,
  "resolved" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_ota_conflicts_property_id" ON "ota_conflicts" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_ota_conflicts_tenant_id" ON "ota_conflicts" ("tenant_id");

-- ============================================================
-- 55. pricing_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" varchar NOT NULL,
  "tenant_id" varchar,
  "name" text NOT NULL,
  "rule_type" text NOT NULL,
  "priority" integer NOT NULL DEFAULT 0,
  "conditions" jsonb NOT NULL,
  "adjustment" jsonb NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_pricing_rules_property_id" ON "pricing_rules" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_pricing_rules_tenant_id" ON "pricing_rules" ("tenant_id");

-- ============================================================
-- 56. refund_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS "refund_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" varchar NOT NULL,
  "transaction_id" varchar,
  "owner_id" varchar NOT NULL,
  "tenant_id" varchar,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'AZN',
  "reason" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "requested_by" varchar NOT NULL,
  "approved_by" varchar,
  "rejected_by" varchar,
  "rejection_reason" text,
  "processed_at" timestamp,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_refund_invoice" ON "refund_requests" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_refund_status" ON "refund_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_refund_owner" ON "refund_requests" ("owner_id");

-- ============================================================
-- 57. api_usage_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS "api_usage_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" varchar NOT NULL,
  "endpoint" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_api_usage_tenant" ON "api_usage_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_api_usage_created_at" ON "api_usage_logs" ("created_at");
