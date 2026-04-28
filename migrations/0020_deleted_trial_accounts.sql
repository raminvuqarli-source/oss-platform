CREATE TABLE IF NOT EXISTS "deleted_trial_accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar NOT NULL,
  "hotel_name" varchar,
  "deleted_at" timestamp DEFAULT now(),
  "reason" varchar DEFAULT 'trial_expired'
);

CREATE INDEX IF NOT EXISTS "idx_deleted_trial_email" ON "deleted_trial_accounts"("email");
