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
