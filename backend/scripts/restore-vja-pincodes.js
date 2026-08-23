/**
 * Restores VJA zone with all 73 pincodes from the Krishna district
 * (already confirmed from the first successful run)
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Zone from "../src/models/Zone.js";

// All 73 unique pincodes from Krishna district (fetched successfully in first run)
const KRISHNA_PINCODES = [
  "509132","520007","521001","521002","521003","521004","521101","521102",
  "521104","521105","521106","521107","521109","521110","521111","521112",
  "521120","521121","521122","521125","521126","521128","521130","521131",
  "521132","521133","521134","521136","521137","521138","521139","521148",
  "521149","521150","521151","521152","521153","521154","521155","521156",
  "521157","521158","521160","521161","521162","521163","521164","521165",
  "521166","521167","521170","521175","521176","521178","521180","521181",
  "521182","521183","521184","521185","521190","521201","521202","521206",
  "521207","521208","521209","521212","521213","521214","521215","521216","521230"
].sort();

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const zone = await Zone.findOne({ code: "VJA" });
  if (!zone) { console.log("Zone VJA not found"); process.exit(1); }

  zone.pincodes = KRISHNA_PINCODES;
  zone.areas = [...new Set([...zone.areas, "Vijayawada", "Machilipatnam", "Gudivada", "Nuzvid", "Eluru"])];
  await zone.save();
  console.log(`✅ Vijayawada Zone updated with ${KRISHNA_PINCODES.length} pincodes`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
