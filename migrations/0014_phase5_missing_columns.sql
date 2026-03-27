-- Phase 5: Add missing columns and tables for VPS compatibility
-- Safe to run multiple times (IF NOT EXISTS / column add checks)

-- 1. Add missing columns to bookings table
DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN deposit_amount integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN deposit_due_date timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN deposit_paid_at timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN paid_amount integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN remaining_balance integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 2. Add approval workflow columns to folio_adjustments
DO $$ BEGIN
  ALTER TABLE folio_adjustments ADD COLUMN approved_by varchar;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE folio_adjustments ADD COLUMN approved_at timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE folio_adjustments ADD COLUMN rejected_by varchar;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE folio_adjustments ADD COLUMN rejected_at timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE folio_adjustments ADD COLUMN rejection_reason text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE folio_adjustments ADD COLUMN created_by varchar;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Update approval_status default if column exists with wrong default
DO $$ BEGIN
  ALTER TABLE folio_adjustments ALTER COLUMN approval_status SET DEFAULT 'approved';
EXCEPTION WHEN undefined_column THEN
  ALTER TABLE folio_adjustments ADD COLUMN approval_status text NOT NULL DEFAULT 'approved';
END $$;

-- 3. Create credential_logs table if missing
CREATE TABLE IF NOT EXISTS credential_logs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id varchar NOT NULL,
  action text NOT NULL,
  performed_by varchar NOT NULL,
  performed_by_name text NOT NULL,
  notes text,
  tenant_id varchar,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credential_logs_tenant_id ON credential_logs(tenant_id);

-- 4. Create cancellation_policies table if missing
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id varchar NOT NULL,
  tenant_id varchar,
  name text NOT NULL,
  free_cancellation_hours integer DEFAULT 24,
  no_show_penalty_type text DEFAULT 'percent',
  no_show_penalty_value integer DEFAULT 10000,
  late_cancellation_penalty_type text DEFAULT 'percent',
  late_cancellation_penalty_value integer DEFAULT 10000,
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_policies_hotel_id ON cancellation_policies(hotel_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_policies_tenant_id ON cancellation_policies(tenant_id);

-- 5. Add rate_plan_id to bookings if missing (OTA rate plans)
DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN rate_plan_id varchar;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
