CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_logs" ("action");
