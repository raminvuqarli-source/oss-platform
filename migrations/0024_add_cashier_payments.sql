CREATE TABLE IF NOT EXISTS "cashier_payments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar NOT NULL,
  "property_id" varchar NOT NULL,
  "cashier_id" varchar NOT NULL,
  "cashier_name" varchar,
  "payment_type" varchar NOT NULL,
  "amount_cents" integer NOT NULL,
  "recipient_name" varchar,
  "recipient_id" varchar,
  "description" text NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cashier_payments_property_id" ON "cashier_payments" ("property_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cashier_payments_created_at" ON "cashier_payments" ("created_at");
