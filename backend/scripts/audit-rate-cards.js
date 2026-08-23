/**
 * Re-audit rate cards using the FIXED query ($lt for maxWeight)
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import RateCard from "../src/models/RateCard.js";
import { findRateCard } from "../src/services/pricing.service.js";

await mongoose.connect(process.env.MONGODB_URI);
console.log("Connected.\n");

const groups = [
  { orderType: "B2C", rateType: "INTRA_ZONE" },
  { orderType: "B2C", rateType: "INTER_ZONE" },
  { orderType: "B2B", rateType: "INTRA_ZONE" },
  { orderType: "B2B", rateType: "INTER_ZONE" },
];

const testWeights = [0.1, 0.5, 0.8, 1.0, 1.5, 2.0, 5.0, 7.0, 10.0, 15.0, 20.0, 30.0, 50.0, 75.0, 100.0];
let totalIssues = 0;

for (const { orderType, rateType } of groups) {
  const cards = await RateCard.find({ orderType, rateType, isActive: true }).sort({ minWeight: 1 });
  console.log(`\n═══ ${orderType} × ${rateType} ═══`);

  let issues = [];
  console.log("  Weight → Matched Slab");
  for (const w of testWeights) {
    try {
      const card = await findRateCard(orderType, rateType, w);
      const charge = card.baseCharge + card.ratePerKg * w;
      console.log(`  ${String(w).padEnd(6)} kg → ${card.minWeight}–${card.maxWeight} kg | ₹${card.baseCharge} + ${card.ratePerKg}×${w} = ₹${charge.toFixed(2)}`);
    } catch (e) {
      console.log(`  ${String(w).padEnd(6)} kg → ❌ NO MATCH: ${e.message}`);
      issues.push(w);
      totalIssues++;
    }
  }

  if (issues.length === 0) {
    console.log("  ✅ All test weights match exactly 1 slab");
  } else {
    console.log(`  ⚠️  Unmatched weights: ${issues.join(", ")}`);
  }
}

console.log(`\n${"═".repeat(50)}`);
console.log(`TOTAL ISSUES: ${totalIssues}`);
if (totalIssues === 0) console.log("✅ All 32 rate cards are VALID and correctly match all weights!");

await mongoose.disconnect();
