CREATE TABLE IF NOT EXISTS "api_usage_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" varchar NOT NULL,
  "endpoint" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_api_usage_tenant" ON "api_usage_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_api_usage_created_at" ON "api_usage_logs" ("created_at");
