ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS current_period_start timestamp DEFAULT now(),
  ADD COLUMN IF NOT EXISTS current_period_end timestamp,
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_payment_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_order_id varchar,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

UPDATE subscriptions
  SET status = CASE
    WHEN plan_type = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now() THEN 'expired'
    WHEN is_active = false THEN 'expired'
    WHEN plan_type = 'trial' THEN 'trial'
    ELSE 'active'
  END,
  current_period_start = COALESCE(start_date, created_at),
  current_period_end = COALESCE(end_date, trial_ends_at)
WHERE status = 'active' AND (plan_type = 'trial' OR end_date IS NOT NULL OR start_date IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON subscriptions(owner_id);
