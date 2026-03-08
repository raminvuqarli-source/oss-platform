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
