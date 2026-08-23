import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", default: null },
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    length: { type: Number, required: true, min: 0 },
    breadth: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    actualWeight: { type: Number, required: true, min: 0 },
    volumetricWeight: { type: Number, required: true, min: 0 },
    chargeableWeight: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    baseCharge: { type: Number, required: true, min: 0 },
    codSurcharge: { type: Number, default: 0, min: 0 },
    totalCharge: { type: Number, required: true, min: 0 },
    rateCardId: { type: mongoose.Schema.Types.ObjectId, ref: "RateCard", required: true },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", default: null },
    assignedAt: { type: Date, default: null },
    assignmentType: { type: String, enum: ["MANUAL", "AUTO"], default: null },
  },
  { _id: false }
);

const rescheduleSchema = new mongoose.Schema(
  {
    requested: { type: Boolean, default: false },
    newDate: { type: Date, default: null },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    category: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pickup: { type: addressSchema, required: true },
    drop: { type: addressSchema, required: true },
    package: { type: packageSchema, required: true },
    items: { type: [orderItemSchema], default: [] },
    orderImage: { type: String, default: null },
    orderType: { type: String, enum: ["B2B", "B2C"], required: true },
    paymentType: { type: String, enum: ["PREPAID", "COD"], required: true },
    pricing: { type: pricingSchema, required: true },
    assignment: { type: assignmentSchema, default: {} },
    status: {
      type: String,
      enum: ["CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"],
      default: "CREATED",
      index: true,
    },
    deliveryAttempt: { type: Number, default: 1, min: 1 },
    reschedule: { type: rescheduleSchema, default: {} },
    proofUrl: { type: String, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ "pickup.zoneId": 1 });
orderSchema.index({ "drop.zoneId": 1 });
orderSchema.index({ "assignment.agentId": 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
