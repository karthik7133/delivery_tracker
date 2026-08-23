import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    areas: [{ type: String, trim: true }],
    pincodes: [{ type: String, trim: true, index: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Zone = mongoose.model("Zone", zoneSchema);
export default Zone;
