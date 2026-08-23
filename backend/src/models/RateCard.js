import mongoose from "mongoose";

const rateCardSchema = new mongoose.Schema(
  {
    orderType: { type: String, enum: ["B2B", "B2C"], required: true, index: true },
    rateType: { type: String, enum: ["INTRA_ZONE", "INTER_ZONE"], required: true, index: true },
    minWeight: { type: Number, required: true, min: 0 },
    maxWeight: { type: Number, required: true, min: 0 },
    ratePerKg: { type: Number, required: true, min: 0 },
    baseCharge: { type: Number, required: true, min: 0 },
    codSurcharge: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rateCardSchema.index({ orderType: 1, rateType: 1, isActive: 1 });

const RateCard = mongoose.model("RateCard", rateCardSchema);
export default RateCard;
