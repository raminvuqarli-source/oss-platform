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

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "rate_plan_id" varchar;
