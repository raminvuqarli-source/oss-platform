import axios from "axios";

const API_KEY = "uxKRgzEichDNbB9SuUyXPQ7egabJqcTcAA2hyxmnj4YOi2/SfmtupQLyICwC491N";
const PROPERTY_ID = "070a5be1-503a-466f-b3fb-005b352cb256";
const BASE_URL = "https://staging.channex.io/api/v1";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "user-api-key": API_KEY,
    "Content-Type": "application/json",
  },
});

// ─── Task A: Get all room types for the property ──────────────────────────────
async function getRoomTypes() {
  console.log("\n━━━ Task A: Fetching room types ━━━");
  try {
    const response = await client.get("/room_types", {
      params: { property_id: PROPERTY_ID },
    });

    const roomTypes = response.data?.data ?? [];

    if (roomTypes.length === 0) {
      console.log("⚠️  No room types found for this property.");
      return null;
    }

    console.log(`✅ Found ${roomTypes.length} room type(s):\n`);
    roomTypes.forEach((rt, i) => {
      console.log(`  [${i + 1}] Title    : ${rt.attributes?.title ?? "N/A"}`);
      console.log(`       ID       : ${rt.id}`);
      console.log(`       Capacity : ${rt.attributes?.occ_adults ?? "N/A"} adults`);
      console.log("");
    });

    // Find the "Standart" room specifically
    const standart = roomTypes.find((rt) =>
      (rt.attributes?.title ?? "").toLowerCase().includes("standart")
    );

    if (standart) {
      console.log(`🏨 "Standart" room found!`);
      console.log(`   Room Type ID : ${standart.id}`);
      console.log(`   Title        : ${standart.attributes?.title}`);
      return standart.id;
    } else {
      console.log('ℹ️  No room type with title "Standart" found.');
      console.log("   Using first room type ID:", roomTypes[0].id);
      return roomTypes[0].id;
    }
  } catch (error) {
    console.error("❌ Failed to fetch room types:");
    if (error.response) {
      console.error("   Status :", error.response.status);
      console.error("   Body   :", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("   Error  :", error.message);
    }
    return null;
  }
}

// ─── Task B: Update availability ─────────────────────────────────────────────
async function updateAvailability(roomTypeId) {
  console.log("\n━━━ Task B: Updating availability ━━━");

  if (!roomTypeId) {
    console.error("❌ Cannot update availability — no room type ID available.");
    return;
  }

  const payload = {
    values: [
      {
        property_id: PROPERTY_ID,
        room_type_id: roomTypeId,
        date: "2026-05-01",
        availability: 3,
      },
    ],
  };

  console.log("📤 Sending payload:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await client.post("/availability", payload);

    console.log("\n✅ Availability updated successfully!");
    console.log("   Status :", response.status);
    console.log("   Body   :", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("\n❌ Failed to update availability:");
    if (error.response) {
      console.error("   Status :", error.response.status);
      console.error("   Body   :", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("   Error  :", error.message);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log("🔌 Channex.io Staging API — Integration Test");
console.log(`   Property ID : ${PROPERTY_ID}`);
console.log(`   Base URL    : ${BASE_URL}`);

const roomTypeId = await getRoomTypes();
await updateAvailability(roomTypeId);

console.log("\n✔  Done.\n");
