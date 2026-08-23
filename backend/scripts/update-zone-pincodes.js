/**
 * Comprehensive zone pincode update using targeted district slugs.
 * Falls back gracefully if a district API call fails (rate limit, bad slug).
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Zone from "../src/models/Zone.js";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllPincodes(districtSlug) {
  const all = new Set();
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `https://api.pincodeapi.in/api/v1/district/${districtSlug}?limit=${limit}&offset=${offset}`;
    let json;
    try {
      const res = await fetch(url);
      const text = await res.text();
      json = JSON.parse(text);
    } catch {
      console.log(`    ⚠️  Failed to parse response for ${districtSlug} at offset ${offset} — stopping`);
      break;
    }

    if (!json.success || !json.data?.post_offices?.length) break;

    for (const po of json.data.post_offices) {
      all.add(po.pincode);
    }

    const total = json.meta?.total_records ?? json.data.total_records;
    offset += json.data.post_offices.length;

    if (offset >= total) break;
    await sleep(300); // be gentle with the API
  }

  return [...all].sort();
}

async function fetchMultipleDistricts(slugs) {
  const combined = new Set();
  for (const slug of slugs) {
    console.log(`  Fetching district: ${slug}`);
    const pincodes = await fetchAllPincodes(slug);
    console.log(`    → ${pincodes.length} unique pincodes`);
    pincodes.forEach((p) => combined.add(p));
    await sleep(500);
  }
  return [...combined].sort();
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.\n");

  /**
   * Guntur Zone (GNT) — covers old Guntur district area:
   *   - guntur (main city + surrounding mandals)
   *   - bapatla (carved out 2022 from Guntur)
   *   - narasaraopet (main town of Palnadu; slug to try)
   *
   * Vijayawada Zone (VJA) — covers old Krishna district:
   *   - krishna (the base district)
   *   - ntr (NTR district carved out 2022 from Krishna)
   */
  const tasks = [
    {
      zoneCode: "GNT",
      districts: ["guntur", "bapatla", "narasaraopet"],
      extraAreas: ["Guntur", "Tenali", "Mangalagiri", "Bapatla", "Narasaraopet", "Piduguralla", "Macherla"],
    },
    {
      zoneCode: "VJA",
      districts: ["krishna", "ntr"],
      extraAreas: ["Vijayawada", "Machilipatnam", "Gudivada", "Nuzvid"],
    },
  ];

  for (const { zoneCode, districts, extraAreas } of tasks) {
    console.log(`\n── Processing ${zoneCode} ──`);
    const pincodes = await fetchMultipleDistricts(districts);
    console.log(`  Total unique pincodes: ${pincodes.length}`);
    console.log(`  Sample: ${pincodes.slice(0, 15).join(", ")} ...`);

    const zone = await Zone.findOne({ code: zoneCode });
    if (!zone) {
      console.log(`  ⚠️  Zone ${zoneCode} not found in DB, skipping.`);
      continue;
    }

    zone.pincodes = pincodes;
    zone.areas = [...new Set([...zone.areas, ...extraAreas])];
    await zone.save();
    console.log(`  ✅ Zone "${zone.name}" updated with ${pincodes.length} pincodes`);
  }

  console.log("\n✅ All zones updated.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
