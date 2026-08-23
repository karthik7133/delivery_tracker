import mongoose from "mongoose";

const trackingHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    status: {
      type: String,
      enum: ["CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"],
      required: true,
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, enum: ["CUSTOMER", "AGENT", "ADMIN", "SYSTEM"], required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: false }
);

trackingHistorySchema.set("strict", true);

const TrackingHistory = mongoose.model("TrackingHistory", trackingHistorySchema);
export default TrackingHistory;
