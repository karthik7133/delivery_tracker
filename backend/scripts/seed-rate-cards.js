/**
 * Seed comprehensive rate cards for all order/zone combinations.
 *
 * Covers:
 *   - B2C INTRA_ZONE (same zone delivery — most common for e-commerce)
 *   - B2C INTER_ZONE (cross-zone delivery)
 *   - B2B INTRA_ZONE
 *   - B2B INTER_ZONE
 *
 * Weight slabs: 0–0.5, 0.5–1, 1–2, 2–5, 5–10, 10–20, 20–50, 50–100 kg
 *
 * Pricing is realistic for a Tier-2 Indian city logistics operator.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import RateCard from "../src/models/RateCard.js";

const cards = [
  // ──────────────────────────────────────────────
  // B2C  ×  INTRA_ZONE (within same city/zone)
  // ──────────────────────────────────────────────
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 0,   maxWeight: 0.5,  baseCharge: 30,  ratePerKg: 10,  codSurcharge: 25 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 0.5, maxWeight: 1,    baseCharge: 35,  ratePerKg: 10,  codSurcharge: 25 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 1,   maxWeight: 2,    baseCharge: 45,  ratePerKg: 12,  codSurcharge: 30 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 2,   maxWeight: 5,    baseCharge: 60,  ratePerKg: 15,  codSurcharge: 35 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 5,   maxWeight: 10,   baseCharge: 90,  ratePerKg: 18,  codSurcharge: 40 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 10,  maxWeight: 20,   baseCharge: 150, ratePerKg: 20,  codSurcharge: 50 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 20,  maxWeight: 50,   baseCharge: 250, ratePerKg: 22,  codSurcharge: 60 },
  { orderType: "B2C", rateType: "INTRA_ZONE", minWeight: 50,  maxWeight: 100,  baseCharge: 500, ratePerKg: 25,  codSurcharge: 80 },

  // ──────────────────────────────────────────────
  // B2C  ×  INTER_ZONE (cross-zone delivery)
  // ──────────────────────────────────────────────
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 0,   maxWeight: 0.5,  baseCharge: 45,  ratePerKg: 15,  codSurcharge: 30 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 0.5, maxWeight: 1,    baseCharge: 55,  ratePerKg: 15,  codSurcharge: 30 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 1,   maxWeight: 2,    baseCharge: 70,  ratePerKg: 18,  codSurcharge: 35 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 2,   maxWeight: 5,    baseCharge: 100, ratePerKg: 20,  codSurcharge: 40 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 5,   maxWeight: 10,   baseCharge: 160, ratePerKg: 22,  codSurcharge: 50 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 10,  maxWeight: 20,   baseCharge: 250, ratePerKg: 25,  codSurcharge: 60 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 20,  maxWeight: 50,   baseCharge: 400, ratePerKg: 28,  codSurcharge: 75 },
  { orderType: "B2C", rateType: "INTER_ZONE", minWeight: 50,  maxWeight: 100,  baseCharge: 700, ratePerKg: 30,  codSurcharge: 100 },

  // ──────────────────────────────────────────────
  // B2B  ×  INTRA_ZONE
  // ──────────────────────────────────────────────
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 0,   maxWeight: 0.5,  baseCharge: 40,  ratePerKg: 12,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 0.5, maxWeight: 1,    baseCharge: 50,  ratePerKg: 12,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 1,   maxWeight: 2,    baseCharge: 65,  ratePerKg: 14,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 2,   maxWeight: 5,    baseCharge: 90,  ratePerKg: 16,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 5,   maxWeight: 10,   baseCharge: 140, ratePerKg: 18,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 10,  maxWeight: 20,   baseCharge: 220, ratePerKg: 20,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 20,  maxWeight: 50,   baseCharge: 350, ratePerKg: 22,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTRA_ZONE", minWeight: 50,  maxWeight: 100,  baseCharge: 600, ratePerKg: 24,  codSurcharge: 0 },

  // ──────────────────────────────────────────────
  // B2B  ×  INTER_ZONE
  // ──────────────────────────────────────────────
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 0,   maxWeight: 0.5,  baseCharge: 60,  ratePerKg: 16,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 0.5, maxWeight: 1,    baseCharge: 75,  ratePerKg: 16,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 1,   maxWeight: 2,    baseCharge: 95,  ratePerKg: 18,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 2,   maxWeight: 5,    baseCharge: 130, ratePerKg: 20,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 5,   maxWeight: 10,   baseCharge: 200, ratePerKg: 22,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 10,  maxWeight: 20,   baseCharge: 320, ratePerKg: 25,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 20,  maxWeight: 50,   baseCharge: 520, ratePerKg: 28,  codSurcharge: 0 },
  { orderType: "B2B", rateType: "INTER_ZONE", minWeight: 50,  maxWeight: 100,  baseCharge: 900, ratePerKg: 30,  codSurcharge: 0 },
].map(c => ({ ...c, isActive: true }));

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  // Clear existing rate cards first
  const deleted = await RateCard.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing rate cards.`);

  // Insert all new cards
  const inserted = await RateCard.insertMany(cards);
  console.log(`\n✅ Inserted ${inserted.length} rate cards:\n`);

  const summary = {};
  for (const c of inserted) {
    const key = `${c.orderType} × ${c.rateType}`;
    summary[key] = (summary[key] || 0) + 1;
  }
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k}: ${v} slabs`);
  }

  console.log("\nRate cards seeded successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
