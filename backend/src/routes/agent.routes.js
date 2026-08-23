import { Router } from "express";
import { locationValidator, agentStatusValidator } from "../validators/agent.validator.js";
import { statusUpdateValidator } from "../validators/order.validator.js";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import Agent from "../models/Agent.js";
import Order from "../models/Order.js";
import Zone from "../models/Zone.js";
import { updateOrderStatusByAgent, getClaimableOrdersForAgent } from "../services/order.service.js";
import { appendTracking } from "../services/tracking.service.js";
import { sendAgentAssignedEmail } from "../services/email.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { success } from "../utils/response.js";
import User from "../models/User.js";

const router = Router();

router.use(authMiddleware, requireRole("AGENT"));

async function getAgentForUser(userId) {
  let agent = await Agent.findOne({ userId })
    .populate("userId", "name email phone")
    .populate("currentZoneId", "name code pincodes areas");
  if (!agent) {
    // Auto-create Agent profile for AGENT-role users missing one
    const user = await User.findById(userId);
    if (!user || user.role !== "AGENT") throw new AppError("Agent profile not found", 404);
    agent = await Agent.create({
      userId,
      phone: user.phone || "",
      vehicleType: "BIKE",
      status: "OFFLINE",
    });
    await agent.populate("userId", "name email phone");
    console.log(`[AGENT] Auto-created missing Agent profile for user ${user.email}`);
  }
  return agent;
}

/* ── GET /agent/profile — full agent profile with zone info ── */
router.get("/profile", async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);
    return success(res, agent);
  } catch (e) { next(e); }
});

/* ── PATCH /agent/zone — agent selects/changes their own zone ── */
router.patch("/zone", async (req, res, next) => {
  try {
    const { zoneId } = req.body;
    const agent = await getAgentForUser(req.user._id);

    if (zoneId) {
      const zone = await Zone.findById(zoneId);
      if (!zone || !zone.isActive) throw new AppError("Zone not found or inactive", 404);
      agent.currentZoneId = zone._id;
    } else {
      agent.currentZoneId = null;
    }

    await agent.save();
    await agent.populate("currentZoneId", "name code pincodes areas");
    return success(res, { message: "Zone updated", agent });
  } catch (e) { next(e); }
});

/* ── GET /agent/zones — list all active zones for zone picker ── */
router.get("/zones", async (req, res, next) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 }).lean();
    return success(res, zones);
  } catch (e) { next(e); }
});

router.patch("/location", locationValidator, validate, async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);
    agent.currentLocation = {
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    };
    await agent.save();
    return success(res, { message: "Location updated" });
  } catch (e) { next(e); }
});

/* ── GET /agent/status — fetch current agent status ── */
router.get("/status", async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);
    return success(res, { status: agent.status });
  } catch (e) { next(e); }
});

router.patch("/status", agentStatusValidator, validate, async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);
    agent.status = req.body.status;
    await agent.save();
    return success(res, { message: "Agent status updated", status: agent.status });
  } catch (e) { next(e); }
});

router.get("/orders", async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);
    const orders = await Order.find({ "assignment.agentId": agent._id })
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
    return success(res, orders);
  } catch (e) { next(e); }
});

/* ── GET /agent/orders/claimable — orders at agent's zone hub awaiting pickup ── */
router.get("/orders/claimable", async (req, res, next) => {
  try {
    const result = await getClaimableOrdersForAgent(req.user._id);
    return success(res, result);
  } catch (e) { next(e); }
});

/* ── POST /agent/orders/:id/claim — agent claims an order to deliver ── */
router.post("/orders/:id/claim", async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);

    const order = await Order.findById(req.params.id).populate("customerId", "name email phone");
    if (!order) throw new AppError("Order not found", 404);
    if (order.status !== "IN_TRANSIT") throw new AppError("This order is not available for claiming", 400);
    if (order.assignment?.agentId) throw new AppError("This order has already been claimed by another agent", 409);

    // Assign agent and set OUT_FOR_DELIVERY
    agent.status = "BUSY";
    agent.assignedOrders.push(order._id);
    await agent.save();

    order.assignment = { agentId: agent._id, assignedAt: new Date(), assignmentType: "MANUAL" };
    order.status = "OUT_FOR_DELIVERY";
    await order.save();

    await appendTracking({
      orderId: order._id,
      status: "OUT_FOR_DELIVERY",
      actorId: req.user._id,
      actorRole: "AGENT",
      note: `Out for delivery with agent ${agent.userId?.name || "agent"}`,
    });

    // Email customer with agent details
    const agentUser = await User.findById(agent.userId);
    if (order.customerId?.email) {
      sendAgentAssignedEmail(order.customerId.email, {
        orderId: order.orderId,
        agentName: agentUser?.name || "Delivery Agent",
        agentPhone: agent.phone || agentUser?.phone || "N/A",
        zone: null,
      }).catch(() => {});
    }

    return success(res, { message: "Order claimed successfully", order });
  } catch (e) { next(e); }
});

/* ── GET /agent/orders/:id — get single order with customer details ── */
router.get("/orders/:id", async (req, res, next) => {
  try {
    const agent = await getAgentForUser(req.user._id);
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email phone")
      .lean();
    if (!order) throw new AppError("Order not found", 404);
    if (!order.assignment?.agentId || order.assignment.agentId.toString() !== agent._id.toString()) {
      throw new AppError("You are not assigned to this order", 403);
    }
    return success(res, order);
  } catch (e) { next(e); }
});

/* ── PATCH /agent/orders/:id/status ── agent updates delivery status ── */
router.patch("/orders/:id/status", statusUpdateValidator, validate, async (req, res, next) => {
  try {
    const order = await updateOrderStatusByAgent(req.params.id, req.user._id, req.body.status, req.body.note);
    return success(res, order);
  } catch (e) { next(e); }
});

export default router;
