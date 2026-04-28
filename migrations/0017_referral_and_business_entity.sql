-- Migration: Add referral system + business entity fields

-- 1. Add business entity + referral columns to owners
ALTER TABLE owners ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS referral_staff_id varchar;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS referral_notes text;

-- 2. Add referral_code column to users (for marketing staff)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code) WHERE referral_code IS NOT NULL;

-- 3. Create referral_commissions table
CREATE TABLE IF NOT EXISTS referral_commissions (
  id            varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id varchar NOT NULL,
  owner_id      varchar NOT NULL,
  commission_pct text DEFAULT '10.00',
  status        text NOT NULL DEFAULT 'pending',
  amount_cents  integer,
  paid_at       timestamp,
  notes         text,
  created_at    timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_staff ON referral_commissions (staff_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_owner ON referral_commissions (owner_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions (status);
