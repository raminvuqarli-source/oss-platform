-- Migration: Restaurant / POS Ecosystem tables

CREATE TABLE IF NOT EXISTS pos_menu_categories (
  id            varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     varchar NOT NULL,
  property_id   varchar NOT NULL,
  name          varchar NOT NULL,
  sort_order    integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos_menu_cat_property ON pos_menu_categories (property_id);
CREATE INDEX IF NOT EXISTS idx_pos_menu_cat_tenant   ON pos_menu_categories (tenant_id);

CREATE TABLE IF NOT EXISTS pos_menu_items (
  id            varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     varchar NOT NULL,
  property_id   varchar NOT NULL,
  category_id   varchar REFERENCES pos_menu_categories(id) ON DELETE SET NULL,
  name          varchar NOT NULL,
  description   text,
  price_cents   integer NOT NULL,
  image_url     text,
  is_available  boolean DEFAULT true,
  created_at    timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos_menu_items_property  ON pos_menu_items (property_id);
CREATE INDEX IF NOT EXISTS idx_pos_menu_items_category  ON pos_menu_items (category_id);

CREATE TABLE IF NOT EXISTS pos_orders (
  id                 varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          varchar NOT NULL,
  property_id        varchar NOT NULL,
  folio_id           varchar,
  booking_id         varchar,
  table_number       varchar,
  guest_name         varchar,
  waiter_id          varchar,
  kitchen_status     varchar NOT NULL DEFAULT 'pending',
  settlement_status  varchar NOT NULL DEFAULT 'pending',
  notes              text,
  total_cents        integer NOT NULL DEFAULT 0,
  created_at         timestamp DEFAULT now(),
  ready_at           timestamp,
  delivered_at       timestamp,
  settled_at         timestamp
);
CREATE INDEX IF NOT EXISTS idx_pos_orders_property        ON pos_orders (property_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_tenant          ON pos_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_kitchen_status  ON pos_orders (kitchen_status);
CREATE INDEX IF NOT EXISTS idx_pos_orders_settlement      ON pos_orders (settlement_status);
CREATE INDEX IF NOT EXISTS idx_pos_orders_waiter          ON pos_orders (waiter_id);

CREATE TABLE IF NOT EXISTS pos_order_items (
  id               varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         varchar NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  menu_item_id     varchar,
  item_name        varchar NOT NULL,
  quantity         integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL,
  total_cents      integer NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_order ON pos_order_items (order_id);

CREATE TABLE IF NOT EXISTS waiter_calls (
  id               varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        varchar NOT NULL,
  property_id      varchar NOT NULL,
  booking_id       varchar,
  table_number     varchar,
  room_number      varchar,
  status           varchar NOT NULL DEFAULT 'pending',
  called_at        timestamp DEFAULT now(),
  acknowledged_at  timestamp,
  acknowledged_by  varchar
);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_property ON waiter_calls (property_id);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_status   ON waiter_calls (status);
