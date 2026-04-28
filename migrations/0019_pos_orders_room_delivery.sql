-- Add room_number and order_type columns to pos_orders for room delivery support
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS room_number varchar;
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS order_type varchar DEFAULT 'dine_in';
