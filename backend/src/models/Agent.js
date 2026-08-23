import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const agentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    vehicleType: { type: String, trim: true, default: "BIKE" },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: ["AVAILABLE", "BUSY", "OFFLINE"], default: "OFFLINE", index: true },
    currentLocation: { type: locationSchema, default: null },
    currentZoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", default: null, index: true },
    assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

agentSchema.index({ currentLocation: "2dsphere" });

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
