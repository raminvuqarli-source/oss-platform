CREATE UNIQUE INDEX IF NOT EXISTS "idx_external_bookings_external_id_hotel_id" ON "external_bookings" ("external_id", "hotel_id");
