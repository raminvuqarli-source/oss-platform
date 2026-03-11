ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_path" text;
CREATE INDEX IF NOT EXISTS "idx_invoices_owner_id" ON "invoices" ("owner_id");
