-- Migration: Restaurant cleaning tasks and staff profiles

CREATE TABLE IF NOT EXISTS restaurant_cleaning_tasks (
  id             varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      varchar NOT NULL,
  property_id    varchar NOT NULL,
  description    text NOT NULL,
  location       varchar,
  assigned_to_id varchar,
  created_by_id  varchar,
  status         varchar NOT NULL DEFAULT 'pending',
  completed_at   timestamp,
  photo_url      text,
  created_at     timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restaurant_cleaning_tasks_property ON restaurant_cleaning_tasks (property_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_cleaning_tasks_tenant   ON restaurant_cleaning_tasks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_cleaning_tasks_assigned ON restaurant_cleaning_tasks (assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_cleaning_tasks_status   ON restaurant_cleaning_tasks (status);

CREATE TABLE IF NOT EXISTS restaurant_staff_profiles (
  id               varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          varchar NOT NULL,
  property_id      varchar NOT NULL,
  salary_amount    varchar DEFAULT '0',
  tax_rate         varchar DEFAULT '0',
  tables_assigned  text,
  notes            text,
  updated_at       timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_staff_profiles_user_property ON restaurant_staff_profiles (user_id, property_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_profiles_property ON restaurant_staff_profiles (property_id);
