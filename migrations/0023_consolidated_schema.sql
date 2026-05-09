CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"property_id" varchar,
	"snapshot_type" text NOT NULL,
	"period" text NOT NULL,
	"data" jsonb NOT NULL,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"hotel_id" varchar,
	"owner_id" varchar,
	"event_type" varchar NOT NULL,
	"description" text,
	"amount_usd" numeric(10, 2) DEFAULT '0' NOT NULL,
	"messages_added" integer DEFAULT 0,
	"package_name" varchar,
	"status" varchar DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "board_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar NOT NULL,
	"room_number" text NOT NULL,
	"room_type" text NOT NULL,
	"check_in_date" timestamp NOT NULL,
	"check_out_date" timestamp NOT NULL,
	"status" text DEFAULT 'booked' NOT NULL,
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
	"payment_method" text,
	"guest_signature_base64" text,
	"id_document_base64" text,
	"owner_id" varchar,
	"property_id" varchar,
	"unit_id" varchar,
	"rate_plan_id" varchar,
	"tenant_id" varchar,
	"deposit_amount" integer,
	"deposit_due_date" timestamp,
	"deposit_paid_at" timestamp,
	"paid_amount" integer DEFAULT 0,
	"remaining_balance" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cancellation_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"free_cancellation_hours" integer DEFAULT 24,
	"no_show_penalty_type" text DEFAULT 'percent',
	"no_show_penalty_value" integer DEFAULT 10000,
	"late_cancellation_penalty_type" text DEFAULT 'percent',
	"late_cancellation_penalty_value" integer DEFAULT 10000,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"property_id" varchar,
	"owner_id" varchar,
	"account_type" text DEFAULT 'cash' NOT NULL,
	"account_name" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"tenant_id" varchar,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"account_code" text NOT NULL,
	"account_name" text NOT NULL,
	"account_type" text NOT NULL,
	"parent_id" varchar,
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"normal_balance" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_role" text NOT NULL,
	"message" text NOT NULL,
	"property_id" varchar,
	"tenant_id" varchar,
	"thread_type" text DEFAULT 'guest_service' NOT NULL,
	"escalated_by" varchar,
	"escalation_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contract_acceptances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"user_id" varchar NOT NULL,
	"plan_code" text NOT NULL,
	"plan_type" text NOT NULL,
	"smart_plan_type" text,
	"contract_version" text NOT NULL,
	"property_name" text,
	"monthly_price" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"accepted_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"contract_language" text DEFAULT 'EN' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" text NOT NULL,
	"country" text NOT NULL,
	"client_name" text NOT NULL,
	"contract_value" integer NOT NULL,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"partner_company" text,
	"partner_commission_percent" integer DEFAULT 20 NOT NULL,
	"tax_percent" integer DEFAULT 18 NOT NULL,
	"state_fee_percent" integer DEFAULT 10 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"signed_date" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_centers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar NOT NULL,
	"action" text NOT NULL,
	"performed_by" varchar NOT NULL,
	"performed_by_name" text NOT NULL,
	"notes" text,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_financial_summaries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"summary_date" timestamp NOT NULL,
	"room_revenue" integer DEFAULT 0,
	"fb_revenue" integer DEFAULT 0,
	"spa_revenue" integer DEFAULT 0,
	"other_revenue" integer DEFAULT 0,
	"total_revenue" integer DEFAULT 0,
	"total_tax" integer DEFAULT 0,
	"total_expenses" integer DEFAULT 0,
	"occupied_rooms" integer DEFAULT 0,
	"total_rooms" integer DEFAULT 0,
	"occupancy_rate" integer DEFAULT 0,
	"adr" integer DEFAULT 0,
	"revpar" integer DEFAULT 0,
	"total_payments_cash" integer DEFAULT 0,
	"total_payments_card" integer DEFAULT 0,
	"total_payments_bank" integer DEFAULT 0,
	"is_locked" boolean DEFAULT false,
	"locked_at" timestamp,
	"locked_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deleted_trial_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"hotel_name" varchar,
	"deleted_at" timestamp DEFAULT now(),
	"reason" varchar DEFAULT 'trial_expired'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_telemetry" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" real,
	"string_value" text,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" varchar,
	"property_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"device_type" text NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"status" text DEFAULT 'offline' NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "door_action_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"room_number" text NOT NULL,
	"action" text NOT NULL,
	"performed_by" text NOT NULL,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escalation_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escalation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escalations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"property_id" varchar,
	"owner_id" varchar,
	"recurring_expense_id" varchar,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"vendor" text,
	"receipt_url" text,
	"source_type" text DEFAULT 'staff_input' NOT NULL,
	"period_month" integer,
	"period_year" integer,
	"created_by" varchar,
	"created_by_name" text,
	"approved_by" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flag_overrides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"feature_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"reason" text,
	"expires_at" timestamp,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"guest_id" varchar,
	"booking_id" varchar,
	"room_number" text,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "folio_adjustments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"adjustment_type" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD',
	"approval_status" text DEFAULT 'approved' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "folio_charges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"department_id" varchar,
	"cost_center_id" varchar,
	"charge_type" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_price" integer NOT NULL,
	"amount_net" integer NOT NULL,
	"tax_rate" integer DEFAULT 0,
	"tax_amount" integer DEFAULT 0,
	"amount_gross" integer NOT NULL,
	"is_inclusive" boolean DEFAULT false,
	"currency" text DEFAULT 'USD',
	"service_date" timestamp,
	"idempotency_key" text,
	"status" text DEFAULT 'posted' NOT NULL,
	"voided_at" timestamp,
	"voided_by" varchar,
	"void_reason" text,
	"posted_by" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "folio_charges_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "folio_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"payment_type" text DEFAULT 'payment' NOT NULL,
	"payment_method" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD',
	"reference_number" text,
	"is_deposit" boolean DEFAULT false,
	"status" text DEFAULT 'completed' NOT NULL,
	"received_at" timestamp DEFAULT now(),
	"received_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guest_folios" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"guest_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"property_id" varchar,
	"tenant_id" varchar,
	"folio_number" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"currency" text DEFAULT 'USD',
	"total_charges" integer DEFAULT 0,
	"total_payments" integer DEFAULT 0,
	"total_adjustments" integer DEFAULT 0,
	"balance" integer DEFAULT 0,
	"tax_total" integer DEFAULT 0,
	"opened_at" timestamp DEFAULT now(),
	"closed_at" timestamp,
	"finalized_at" timestamp,
	"finalized_by" varchar,
	"invoice_generated_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "guest_folios_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hotels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"is_channex_enabled" boolean DEFAULT false,
	"channex_property_uuid" text,
	"channex_addon_price" integer,
	"channex_room_count" integer,
	"total_monthly_subscription_fee" numeric(10, 2),
	"is_whatsapp_enabled" boolean DEFAULT false,
	"whatsapp_balance" integer DEFAULT 0,
	"owner_id" varchar,
	"property_id" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "housekeeping_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"unit_id" varchar NOT NULL,
	"booking_id" varchar,
	"room_number" text NOT NULL,
	"task_type" text NOT NULL,
	"cleaning_type" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal',
	"assigned_to" varchar,
	"trigger_source" text NOT NULL,
	"notes" text,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"invoice_number" text,
	"stripe_invoice_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"entry_number" text NOT NULL,
	"entry_date" timestamp NOT NULL,
	"description" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" varchar,
	"status" text DEFAULT 'posted' NOT NULL,
	"total_debit" integer DEFAULT 0,
	"total_credit" integer DEFAULT 0,
	"currency" text DEFAULT 'USD',
	"created_by" varchar,
	"reversed_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entry_lines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"account_id" varchar NOT NULL,
	"department_id" varchar,
	"description" text,
	"debit" integer DEFAULT 0,
	"credit" integer DEFAULT 0,
	"currency" text DEFAULT 'USD',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_name" text NOT NULL,
	"country" text NOT NULL,
	"property_type" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "night_audits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"audit_date" timestamp NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"total_revenue" integer DEFAULT 0,
	"total_payments" integer DEFAULT 0,
	"total_adjustments" integer DEFAULT 0,
	"room_nights_posted" integer DEFAULT 0,
	"occupied_rooms" integer DEFAULT 0,
	"total_rooms" integer DEFAULT 0,
	"occupancy_rate" integer DEFAULT 0,
	"notes" text,
	"closed_at" timestamp,
	"closed_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "no_show_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tenant_id" varchar,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"read" boolean DEFAULT false,
	"action_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ota_conflicts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ota_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"tenant_id" varchar,
	"provider" text NOT NULL,
	"api_key" text,
	"api_secret" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ota_sync_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"property_id" varchar NOT NULL,
	"tenant_id" varchar,
	"action" text NOT NULL,
	"status" text NOT NULL,
	"response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "owners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company_name" text,
	"country" text,
	"city" text,
	"address" text,
	"logo_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"tenant_type" text DEFAULT 'hotel' NOT NULL,
	"tax_id" text,
	"legal_name" text,
	"registration_number" text,
	"referral_source" text,
	"referral_staff_id" varchar,
	"referral_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"plan_type" text NOT NULL,
	"order_type" text DEFAULT 'subscription',
	"reference_id" varchar,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method_id" varchar,
	"customer_note" text,
	"admin_note" text,
	"transfer_reference" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payroll_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"property_id" varchar,
	"owner_id" varchar,
	"staff_id" varchar NOT NULL,
	"staff_name" text NOT NULL,
	"staff_role" text NOT NULL,
	"base_salary" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"bonus_rules" text,
	"deduction_rules" text,
	"bank_details" text,
	"employee_tax_rate" integer DEFAULT 0,
	"additional_expenses_monthly" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payroll_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"currency" text DEFAULT 'USD' NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_menu_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_menu_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"category_id" varchar,
	"name" varchar NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"menu_item_id" varchar,
	"item_name" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"folio_id" varchar,
	"booking_id" varchar,
	"table_number" varchar,
	"room_number" varchar,
	"order_type" varchar DEFAULT 'dine_in',
	"guest_name" varchar,
	"waiter_id" varchar,
	"kitchen_status" varchar DEFAULT 'pending' NOT NULL,
	"settlement_status" varchar DEFAULT 'pending' NOT NULL,
	"notes" text,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"ready_at" timestamp,
	"delivered_at" timestamp,
	"settled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"rule_type" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb NOT NULL,
	"adjustment" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"type" text DEFAULT 'hotel' NOT NULL,
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
	"country_tax_rate" integer DEFAULT 0,
	"utility_expense_pct" integer DEFAULT 0,
	"cleaning_expense_monthly" integer DEFAULT 0,
	"default_employee_tax_rate" integer DEFAULT 0,
	"additional_expenses_monthly" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quote_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_request_id" varchar NOT NULL,
	"author_user_id" varchar NOT NULL,
	"note_text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quote_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"status" text DEFAULT 'NEW' NOT NULL,
	"internal_notes" text,
	"email_sent" boolean DEFAULT false,
	"assigned_to_user_id" varchar,
	"contacted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"refund_policy" text DEFAULT 'flexible' NOT NULL,
	"meal_plan" text DEFAULT 'none' NOT NULL,
	"price_modifier" real DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recurring_expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"property_id" varchar,
	"owner_id" varchar,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"vendor" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp,
	"last_run_at" timestamp,
	"created_by" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_commissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_user_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"commission_pct" text DEFAULT '10.00',
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_cents" integer,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refund_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"transaction_id" varchar,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'AZN' NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" varchar NOT NULL,
	"approved_by" varchar,
	"rejected_by" varchar,
	"rejection_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_cleaning_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"description" text NOT NULL,
	"location" varchar,
	"assigned_to_id" varchar,
	"created_by_id" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"photo_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_guest_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"table_number" varchar NOT NULL,
	"sender_name" varchar DEFAULT 'Qonaq',
	"message" text NOT NULL,
	"is_read_by_waiter" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_staff_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"salary_amount" varchar DEFAULT '0',
	"tax_rate" varchar DEFAULT '0',
	"tables_assigned" text,
	"notes" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_tables" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"capacity" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revenues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"property_id" varchar,
	"owner_id" varchar,
	"booking_id" varchar,
	"guest_id" varchar,
	"transaction_id" varchar,
	"room_number" text,
	"category" text DEFAULT 'room_booking' NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"source_type" text DEFAULT 'auto' NOT NULL,
	"created_by" varchar,
	"created_by_name" text,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_nights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" varchar NOT NULL,
	"date" date NOT NULL,
	"booking_id" varchar NOT NULL,
	"tenant_id" varchar,
	"property_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_preparation_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"room_number" text NOT NULL,
	"occasion_type" text NOT NULL,
	"decoration_style" text,
	"add_ons" text[],
	"notes" text,
	"budget_range" text DEFAULT 'medium' NOT NULL,
	"custom_budget" integer,
	"preferred_datetime" timestamp,
	"reference_image_url" text,
	"price" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"staff_assigned" varchar,
	"admin_notes" text,
	"rejection_reason" text,
	"owner_id" varchar,
	"property_id" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"room_number" text NOT NULL,
	"request_type" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal',
	"assigned_to" varchar,
	"notes" text,
	"owner_id" varchar,
	"property_id" varchar,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"type" text NOT NULL,
	"reason" text,
	"score_impact" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"email" text NOT NULL,
	"staff_role" text DEFAULT 'front_desk' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" varchar NOT NULL,
	"accepted_by" varchar,
	"invite_token" text,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_message_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"sender_role" text DEFAULT 'owner' NOT NULL,
	"sender_id" varchar NOT NULL,
	"message_text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_performance_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"plan_type" text DEFAULT 'starter' NOT NULL,
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
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp DEFAULT now(),
	"current_period_end" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"failed_payment_attempts" integer DEFAULT 0 NOT NULL,
	"last_payment_order_id" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tax_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" varchar NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"rate" integer NOT NULL,
	"is_inclusive" boolean DEFAULT false,
	"applies_to" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "units" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar,
	"unit_number" text NOT NULL,
	"unit_category" text DEFAULT 'accommodation' NOT NULL,
	"unit_type" text DEFAULT 'room' NOT NULL,
	"name" text,
	"floor" integer,
	"capacity" integer DEFAULT 2,
	"description" text,
	"amenities" text[],
	"price_per_night" integer,
	"status" text DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_meters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"metric_type" text NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"max_allowed" integer NOT NULL,
	"tenant_id" varchar,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'guest' NOT NULL,
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
	"referral_code" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waiter_calls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"booking_id" varchar,
	"table_number" varchar,
	"room_number" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"called_at" timestamp DEFAULT now(),
	"acknowledged_at" timestamp,
	"acknowledged_by" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "white_label_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_snapshots_tenant_id" ON "analytics_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_usage_tenant" ON "api_usage_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_usage_created_at" ON "api_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_id" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_info_tenant_id" ON "billing_info" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_logs_tenant_id" ON "billing_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_logs_hotel_id" ON "billing_logs" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_logs_created_at" ON "billing_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_tenant_id" ON "bookings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookings_guest_id" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cancel_policy_hotel_id" ON "cancellation_policies" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cancel_policy_tenant_id" ON "cancellation_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cash_accounts_tenant_id" ON "cash_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coa_hotel_id" ON "chart_of_accounts" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coa_tenant_id" ON "chart_of_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coa_account_code" ON "chart_of_accounts" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_messages_tenant_id" ON "chat_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_messages_hotel_id" ON "chat_messages" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_acceptances_owner_id" ON "contract_acceptances" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_acceptances_tenant_id" ON "contract_acceptances" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cost_centers_hotel_id" ON "cost_centers" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cost_centers_department_id" ON "cost_centers" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_credential_logs_tenant_id" ON "credential_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_summary_hotel_id" ON "daily_financial_summaries" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_summary_date" ON "daily_financial_summaries" USING btree ("summary_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_daily_summary_tenant_id" ON "daily_financial_summaries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_departments_hotel_id" ON "departments" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_departments_tenant_id" ON "departments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_device_telemetry_tenant_id" ON "device_telemetry" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_device_telemetry_device_id" ON "device_telemetry" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_devices_tenant_id" ON "devices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_devices_owner_id" ON "devices" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_devices_property_id" ON "devices" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_door_action_logs_tenant_id" ON "door_action_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escalation_replies_tenant_id" ON "escalation_replies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escalations_tenant_id" ON "escalations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escalations_hotel_id" ON "escalations" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expenses_tenant_id" ON "expenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expenses_hotel_id" ON "expenses" USING btree ("hotel_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_external_bookings_external_id_hotel_id" ON "external_bookings" USING btree ("external_id","hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_bookings_tenant_id" ON "external_bookings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_bookings_hotel_id" ON "external_bookings" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feature_flag_overrides_tenant_id" ON "feature_flag_overrides" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_audit_logs_tenant_id" ON "financial_audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_tenant_id" ON "financial_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_hotel_id" ON "financial_transactions" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_owner_id" ON "financial_transactions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_created_at" ON "financial_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_adjustments_folio_id" ON "folio_adjustments" USING btree ("folio_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_adjustments_hotel_id" ON "folio_adjustments" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_adjustments_tenant_id" ON "folio_adjustments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_adjustments_approval" ON "folio_adjustments" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_charges_folio_id" ON "folio_charges" USING btree ("folio_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_charges_booking_id" ON "folio_charges" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_charges_hotel_id" ON "folio_charges" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_charges_tenant_id" ON "folio_charges" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_charges_status" ON "folio_charges" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_charges_service_date" ON "folio_charges" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_payments_folio_id" ON "folio_payments" USING btree ("folio_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_payments_booking_id" ON "folio_payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_payments_hotel_id" ON "folio_payments" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folio_payments_tenant_id" ON "folio_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folios_booking_id" ON "guest_folios" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folios_guest_id" ON "guest_folios" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folios_hotel_id" ON "guest_folios" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folios_tenant_id" ON "guest_folios" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folios_status" ON "guest_folios" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hotels_tenant_id" ON "hotels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hotels_owner_id" ON "hotels" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hotels_property_id" ON "hotels" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_tenant_id" ON "housekeeping_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_property_id" ON "housekeeping_tasks" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_unit_id" ON "housekeeping_tasks" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_booking_id" ON "housekeeping_tasks" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_assigned_to" ON "housekeeping_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_housekeeping_tasks_status" ON "housekeeping_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_tenant_id" ON "invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_owner_id" ON "invoices" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_paid_at" ON "invoices" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_entries_hotel_id" ON "journal_entries" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_entries_tenant_id" ON "journal_entries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_entries_source" ON "journal_entries" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_entries_date" ON "journal_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_lines_entry_id" ON "journal_entry_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_lines_account_id" ON "journal_entry_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_journal_lines_hotel_id" ON "journal_entry_lines" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_email" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_created_at" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_night_audits_hotel_id" ON "night_audits" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_night_audits_date" ON "night_audits" USING btree ("audit_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_night_audits_tenant_id" ON "night_audits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_no_show_records_tenant_id" ON "no_show_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_no_show_records_hotel_id" ON "no_show_records" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_tenant_id" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_onboarding_progress_tenant_id" ON "onboarding_progress" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_conflicts_property_id" ON "ota_conflicts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_conflicts_tenant_id" ON "ota_conflicts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_integrations_property_id" ON "ota_integrations" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_integrations_tenant_id" ON "ota_integrations" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ota_integrations_property_provider" ON "ota_integrations" USING btree ("property_id","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_property_id" ON "ota_sync_logs" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_tenant_id" ON "ota_sync_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_provider" ON "ota_sync_logs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ota_sync_logs_created_at" ON "ota_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_owner_id" ON "payment_orders" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_status" ON "payment_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_tenant_id" ON "payment_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payroll_configs_tenant_id" ON "payroll_configs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payroll_entries_tenant_id" ON "payroll_entries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pricing_rules_property_id" ON "pricing_rules" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pricing_rules_tenant_id" ON "pricing_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_tenant_id" ON "properties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_owner_id" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rate_plans_property_id" ON "rate_plans" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rate_plans_tenant_id" ON "rate_plans" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recurring_expenses_tenant_id" ON "recurring_expenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refund_invoice" ON "refund_requests" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refund_status" ON "refund_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refund_owner" ON "refund_requests" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_revenues_tenant_id" ON "revenues" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_revenues_hotel_id" ON "revenues" USING btree ("hotel_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_room_nights_unit_date" ON "room_nights" USING btree ("unit_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_nights_booking_id" ON "room_nights" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_nights_tenant_id" ON "room_nights" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_nights_property_date" ON "room_nights" USING btree ("property_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_preparation_orders_tenant_id" ON "room_preparation_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_settings_tenant_id" ON "room_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_requests_tenant_id" ON "service_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_requests_booking_id" ON "service_requests" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_feedback_staff_id" ON "staff_feedback" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_feedback_hotel_id" ON "staff_feedback" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_invitations_tenant_id" ON "staff_invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_message_status_message_id" ON "staff_message_status" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_message_status_staff_id" ON "staff_message_status" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_messages_hotel_id" ON "staff_messages" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_messages_tenant_id" ON "staff_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_performance_staff_id" ON "staff_performance_scores" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_performance_hotel_id" ON "staff_performance_scores" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_tenant_id" ON "subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_period_end" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_owner_id" ON "subscriptions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_config_hotel_id" ON "tax_configurations" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_config_tenant_id" ON "tax_configurations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_units_tenant_id" ON "units" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_units_property_id" ON "units" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_meters_tenant_id" ON "usage_meters" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_hotel_id" ON "users" USING btree ("hotel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_white_label_settings_tenant_id" ON "white_label_settings" USING btree ("tenant_id");