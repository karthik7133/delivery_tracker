import Order from "../models/Order.js";
import User from "../models/User.js";
import Agent from "../models/Agent.js";
import Zone from "../models/Zone.js";
import { AppError } from "../middleware/error.middleware.js";
import { calculateQuote } from "./pricing.service.js";
import { detectZoneByPincode } from "./zone.service.js";
import { appendTracking, getTrackingHistory, assertValidTransition } from "./tracking.service.js";
import { autoAssignAgent, assignAgent, releaseAgent } from "./assignment.service.js";
import { sendOrderStatusNotification } from "./notification.service.js";
import { generateOrderId } from "../utils/generateOrderId.js";
import { startTransitSimulation } from "./transit.simulator.js";

export async function quoteOrder(payload) {
  return calculateQuote(payload);
}

export async function createOrder(customerId, payload) {
  const quote = await calculateQuote(payload);

  const pickupZone = await detectZoneByPincode(payload.pickup.pincode);
  const dropZone = await detectZoneByPincode(payload.drop.pincode);

  const order = await Order.create({
    orderId: generateOrderId(),
    customerId,
    pickup: { ...payload.pickup, zoneId: pickupZone?._id || null },
    drop: { ...payload.drop, zoneId: dropZone?._id || null },
    package: {
      length: payload.package?.length ?? payload.length,
      breadth: payload.package?.breadth ?? payload.breadth,
      height: payload.package?.height ?? payload.height,
      actualWeight: payload.package?.actualWeight ?? payload.actualWeight,
      volumetricWeight: quote.volumetricWeight,
      chargeableWeight: quote.chargeableWeight,
    },
    items: Array.isArray(payload.items) ? payload.items : [],
    orderImage: payload.orderImage || (payload.items && payload.items[0]?.image) || null,
    orderType: payload.orderType,
    paymentType: payload.paymentType,
    pricing: {
      baseCharge: payload.totalAmount ? Math.max(0, payload.totalAmount - quote.codSurcharge) : quote.baseCharge,
      codSurcharge: quote.codSurcharge,
      totalCharge: payload.totalAmount ? payload.totalAmount : quote.totalCharge,
      rateCardId: quote.rateCardId,
    },
    status: "CREATED",
  });

  await appendTracking({
    orderId: order._id,
    status: "CREATED",
    actorId: customerId,
    actorRole: "CUSTOMER",
    note: "Order created",
  });

  const customer = await User.findById(customerId);
  setImmediate(() => sendOrderStatusNotification(order, "CREATED", customer));

  // Start simulated transit journey
  setImmediate(() => startTransitSimulation(order._id));

  return order;
}

export async function listMyOrders(customerId, { status, page = 1, limit = 20 }) {
  const filter = { customerId };
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Order.countDocuments(filter),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

export async function getOrderForCustomer(orderId, customerId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw new AppError("Order not found", 404);
  if (order.customerId.toString() !== customerId.toString()) {
    throw new AppError("You do not have access to this order", 403);
  }
  return order;
}

export async function getOrderWithTracking(orderId, customerId) {
  const order = await Order.findById(orderId)
    .populate({ path: "assignment.agentId", select: "phone userId", populate: { path: "userId", select: "name phone" } })
    .lean();
  if (!order) throw new AppError("Order not found", 404);
  if (order.customerId.toString() !== customerId.toString()) {
    throw new AppError("You do not have access to this order", 403);
  }
  const tracking = await getTrackingHistory(order._id);
  return { ...order, tracking };
}


export async function rescheduleOrder(orderId, customerId, newDate) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.customerId.toString() !== customerId.toString()) {
    throw new AppError("You do not have access to this order", 403);
  }
  if (order.status !== "FAILED") throw new AppError("Only failed orders can be rescheduled", 400);

  const date = new Date(newDate);
  if (date <= new Date()) throw new AppError("New date must be in the future", 400);

  await releaseAgent(order._id);

  order.reschedule = { requested: true, newDate: date };
  order.deliveryAttempt += 1;
  order.status = "CREATED";
  await order.save();

  await appendTracking({
    orderId: order._id,
    status: "CREATED",
    actorId: customerId,
    actorRole: "CUSTOMER",
    note: `Rescheduled to ${date.toISOString().slice(0, 10)}`,
  });

  setImmediate(async () => {
    try {
      await autoAssignAgent(order._id, customerId);
    } catch (err) {
      console.error("Auto-assign during reschedule failed:", err.message);
    }
  });

  const customer = await User.findById(customerId);
  setImmediate(() => sendOrderStatusNotification(order, "CREATED", customer));

  return order;
}

export async function updateOrderStatusByAgent(orderId, agentUserId, newStatus, note = "") {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (!order.assignment?.agentId) throw new AppError("No agent assigned to this order", 400);

  const Agent = (await import("../models/Agent.js")).default;
  const agent = await Agent.findById(order.assignment.agentId);
  if (!agent) throw new AppError("Agent not found", 404);
  if (!agent.userId.equals(agentUserId)) throw new AppError("You are not assigned to this order", 403);

  assertValidTransition(order.status, newStatus);
  const previousStatus = order.status;
  order.status = newStatus;
  await order.save();

  await appendTracking({
    orderId: order._id,
    status: newStatus,
    actorId: agentUserId,
    actorRole: "AGENT",
    note,
  });

  if (newStatus === "DELIVERED" || newStatus === "FAILED") {
    await releaseAgent(order._id);
  }

  const customer = await User.findById(order.customerId);
  setImmediate(() => sendOrderStatusNotification(order, newStatus, customer));

  return order;
}

export async function updateOrderStatusByAdmin(orderId, adminId, newStatus, note = "") {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  order.status = newStatus;
  await order.save();

  await appendTracking({
    orderId: order._id,
    status: newStatus,
    actorId: adminId,
    actorRole: "ADMIN",
    note: note || "Admin override",
  });

  if (newStatus === "DELIVERED" || newStatus === "FAILED" || newStatus === "CANCELLED") {
    await releaseAgent(order._id);
  }

  const customer = await User.findById(order.customerId);
  setImmediate(() => sendOrderStatusNotification(order, newStatus, customer));

  return order;
}

export async function listAllOrders({ status, zoneId, agentId, page = 1, limit = 20 }) {
  const filter = {};
  if (status) filter.status = status;
  if (agentId) filter["assignment.agentId"] = agentId;
  if (zoneId) filter.$or = [{ "pickup.zoneId": zoneId }, { "drop.zoneId": zoneId }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("customerId", "name email phone")
      .populate("assignment.agentId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(filter),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

export async function adminGetOrder(orderId) {
  const order = await Order.findById(orderId)
    .populate("customerId", "name email phone")
    .populate("assignment.agentId")
    .populate("pickup.zoneId", "name code")
    .populate("drop.zoneId", "name code")
    .lean();
  if (!order) throw new AppError("Order not found", 404);
  const tracking = await getTrackingHistory(order._id);
  return { ...order, tracking };
}

/**
 * Check if a pincode is serviceable:
 * - Zone must exist for that pincode (HARD block if not)
 * - Agent availability is informational only — never blocks order placement
 *   because agents can go AVAILABLE after the check
 */
export async function checkPincodeDeliverability(pincode) {
  const zone = await Zone.findOne({ pincodes: pincode, isActive: true });
  if (!zone) {
    return { deliverable: false, message: `Sorry, we don't deliver to pincode ${pincode} yet.` };
  }

  // Agent availability is advisory only — show status but never block
  const agentInZone = await Agent.findOne({ currentZoneId: zone._id, status: "AVAILABLE" });

  return {
    deliverable: true,
    zone: { name: zone.name, code: zone.code },
    agentAvailable: !!agentInZone,
    message: agentInZone
      ? `Delivery available in ${zone.name}`
      : `Delivery available in ${zone.name} — agent will be assigned before pickup`,
  };
}


/**
 * Get orders that are at the drop zone hub and awaiting an agent to claim them.
 * Used by agents to see available deliveries in their zone.
 */
export async function getClaimableOrdersForAgent(agentUserId) {
  // Find the agent's zone
  const agent = await Agent.findOne({ userId: agentUserId });
  if (!agent) throw new AppError("Agent profile not found", 404);

  if (!agent.currentZoneId) {
    return { items: [], message: "You are not assigned to any zone yet. Contact admin." };
  }

  // Orders that are IN_TRANSIT, not assigned to any agent, drop zone = agent's zone
  const items = await Order.find({
    status: "IN_TRANSIT",
    $or: [
      { "assignment.agentId": null },
      { "assignment.agentId": { $exists: false } },
    ],
    "drop.zoneId": agent.currentZoneId,
  })
    .populate("customerId", "name email phone")
    .sort({ createdAt: 1 })
    .lean();

  return { items, zoneId: agent.currentZoneId };
}
