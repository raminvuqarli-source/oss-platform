CREATE INDEX IF NOT EXISTS "idx_external_bookings_tenant_id" ON "external_bookings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_external_bookings_hotel_id" ON "external_bookings" ("hotel_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_guest_id" ON "bookings" ("guest_id");
CREATE INDEX IF NOT EXISTS "idx_service_requests_booking_id" ON "service_requests" ("booking_id");
