DELETE FROM "service_requests"
  WHERE "booking_id" IS NOT NULL
  AND "booking_id" NOT IN (SELECT "id" FROM "bookings");

DELETE FROM "bookings"
  WHERE "owner_id" IS NOT NULL
  AND "owner_id" NOT IN (SELECT "id" FROM "owners");

DELETE FROM "bookings"
  WHERE "property_id" IS NOT NULL
  AND "property_id" NOT IN (SELECT "id" FROM "properties");

DELETE FROM "external_bookings"
  WHERE "hotel_id" IS NOT NULL
  AND "hotel_id" NOT IN (SELECT "id" FROM "hotels");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_owner_id') THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_bookings_owner_id"
      FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_property_id') THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_bookings_property_id"
      FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_service_requests_booking_id') THEN
    ALTER TABLE "service_requests"
      ADD CONSTRAINT "fk_service_requests_booking_id"
      FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_external_bookings_hotel_id') THEN
    ALTER TABLE "external_bookings"
      ADD CONSTRAINT "fk_external_bookings_hotel_id"
      FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT;
  END IF;
END $$;
