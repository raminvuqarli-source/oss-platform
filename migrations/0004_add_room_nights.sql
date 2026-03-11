CREATE TABLE IF NOT EXISTS "room_nights" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "unit_id" varchar NOT NULL,
  "date" date NOT NULL,
  "booking_id" varchar NOT NULL,
  "tenant_id" varchar,
  "property_id" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_room_nights_unit_date" ON "room_nights" ("unit_id", "date");
CREATE INDEX IF NOT EXISTS "idx_room_nights_booking_id" ON "room_nights" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_room_nights_tenant_id" ON "room_nights" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_room_nights_property_date" ON "room_nights" ("property_id", "date");
