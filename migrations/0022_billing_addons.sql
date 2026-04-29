-- Migration: Billing add-ons — WhatsApp balance fields and billing_logs table

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS is_whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_balance     integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS billing_logs (
  id              varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       varchar,
  hotel_id        varchar,
  owner_id        varchar,
  event_type      varchar NOT NULL,
  description     text,
  amount_usd      integer NOT NULL DEFAULT 0,
  messages_added  integer NOT NULL DEFAULT 0,
  package_name    varchar,
  status          varchar NOT NULL DEFAULT 'completed',
  created_at      timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_logs_hotel_id  ON billing_logs (hotel_id);
CREATE INDEX IF NOT EXISTS idx_billing_logs_tenant_id ON billing_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_logs_owner_id  ON billing_logs (owner_id);
CREATE INDEX IF NOT EXISTS idx_billing_logs_created   ON billing_logs (created_at DESC);
