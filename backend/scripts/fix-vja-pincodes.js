import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Zone from "../src/models/Zone.js";

const missing = [
  "520001","520002","520003","520004","520005","520006",
  "520008","520009","520010","520011","520012","520013","520014","520015"
];

await mongoose.connect(process.env.MONGODB_URI);
const z = await Zone.findOne({ code: "VJA" });
const combined = [...new Set([...z.pincodes, ...missing])].sort();
z.pincodes = combined;
await z.save();
console.log("VJA now has", combined.length, "pincodes");
console.log("Includes 520001:", combined.includes("520001"));
await mongoose.disconnect();
