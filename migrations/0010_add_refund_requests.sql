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

-- Billing performance indexes (audit finding)
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "idx_invoices_paid_at" ON "invoices" ("paid_at");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_owner_id" ON "financial_transactions" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_financial_transactions_created_at" ON "financial_transactions" ("created_at");
