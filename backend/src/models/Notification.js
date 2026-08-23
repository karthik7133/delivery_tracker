import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: { type: String, required: true, trim: true },
    channel: { type: String, enum: ["EMAIL", "SMS"], required: true },
    subject: { type: String, trim: true, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
