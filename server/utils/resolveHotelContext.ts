import { storage } from "../storage";

export interface HotelContext {
  hotelId?: string;
  hotelIds: string[];
  propertyId?: string;
  ownerId?: string;
  tenantId?: string;
  user: any;
}

/**
 * Resolves hotel context for any user role.
 *
 * - staff / reception / admin: uses user.hotelId directly
 * - property_manager: tries user.hotelId, then user.propertyId → hotel lookup
 * - owner_admin: collects all hotels across owned properties
 *
 * Returns `hotelId` (first/primary hotel) and `hotelIds` (all hotels).
 */
export async function resolveHotelContext(userId: string): Promise<HotelContext> {
  const user = await storage.getUser(userId);
  if (!user) return { hotelIds: [], user: null };

  let hotelId: string | undefined = user.hotelId || undefined;
  const hotelIds: string[] = [];

  if (hotelId) {
    hotelIds.push(hotelId);
  } else if (user.propertyId) {
    const hotel = await storage.getHotelByPropertyId(user.propertyId);
    if (hotel) {
      hotelId = hotel.id;
      hotelIds.push(hotel.id);
      await storage.updateUser(user.id, { hotelId });
    }
  }

  if (hotelIds.length === 0 && (user.role === "owner_admin" || user.role === "property_manager") && user.ownerId) {
    const properties = await storage.getPropertiesByOwner(user.ownerId);
    for (const prop of properties) {
      const hotel = await storage.getHotelByPropertyId(prop.id);
      if (hotel && !hotelIds.includes(hotel.id)) {
        hotelIds.push(hotel.id);
      }
    }
    if (hotelIds.length > 0) hotelId = hotelIds[0];
  }

  return {
    hotelId,
    hotelIds,
    propertyId: user.propertyId || undefined,
    ownerId: user.ownerId || undefined,
    tenantId: user.tenantId || undefined,
    user,
  };
}
