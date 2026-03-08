import { storage } from "../storage";
import { logger } from "../utils/logger";

const exportLogger = logger.child({ module: "availability-export" });

export interface AvailabilityEntry {
  unitId: string;
  unitNumber: string;
  roomType: string;
  date: string;
  available: boolean;
  price: number;
}

const NON_AVAILABLE_STATUSES = new Set(["out_of_order", "occupied", "dirty", "cleaning"]);

export async function exportAvailability(propertyId: string): Promise<AvailabilityEntry[]> {
  const units = await storage.getUnitsByProperty(propertyId);

  if (units.length === 0) {
    exportLogger.debug({ propertyId }, "No units found for property");
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 365);

  const startDateStr = formatDate(today);
  const endDateStr = formatDate(endDate);

  const allRoomNights = await storage.getRoomNightsByProperty(propertyId, startDateStr, endDateStr);

  const occupiedMap = new Map<string, Set<string>>();
  for (const rn of allRoomNights) {
    if (!occupiedMap.has(rn.unitId)) {
      occupiedMap.set(rn.unitId, new Set());
    }
    occupiedMap.get(rn.unitId)!.add(rn.date);
  }

  const entries: AvailabilityEntry[] = [];

  for (const unit of units) {
    const unitOccupied = occupiedMap.get(unit.id) || new Set();
    const isStatusBlocked = NON_AVAILABLE_STATUSES.has(unit.status || "");

    const cursor = new Date(today);
    while (cursor < endDate) {
      const dateStr = formatDate(cursor);
      const isOccupied = unitOccupied.has(dateStr);

      entries.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber || "",
        roomType: unit.unitType || "Standard",
        date: dateStr,
        available: !isOccupied && !isStatusBlocked,
        price: unit.pricePerNight || 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  exportLogger.info(
    { propertyId, unitCount: units.length, entryCount: entries.length, occupiedNights: allRoomNights.length },
    "Availability export generated"
  );

  return entries;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
