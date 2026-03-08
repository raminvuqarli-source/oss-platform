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
