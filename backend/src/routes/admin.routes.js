import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { statusUpdateValidator } from "../validators/order.validator.js";
import Agent from "../models/Agent.js";
import User from "../models/User.js";
import {
  listAllOrders,
  adminGetOrder,
  updateOrderStatusByAdmin,
} from "../services/order.service.js";
import { assignAgent, autoAssignAgent } from "../services/assignment.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { success } from "../utils/response.js";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

const assignValidator = [
  body("agentId").notEmpty().withMessage("agentId is required"),
];

router.get("/orders", async (req, res, next) => {
  try { return success(res, await listAllOrders(req.query)); } catch (e) { next(e); }
});

router.get("/orders/:id", async (req, res, next) => {
  try { return success(res, await adminGetOrder(req.params.id)); } catch (e) { next(e); }
});

router.post("/orders/:id/assign", assignValidator, validate, async (req, res, next) => {
  try {
    const result = await assignAgent(req.params.id, req.body.agentId, "MANUAL", req.user._id);
    return success(res, result.order);
  } catch (e) { next(e); }
});

router.post("/orders/:id/auto-assign", async (req, res, next) => {
  try {
    const result = await autoAssignAgent(req.params.id, req.user._id);
    return success(res, result.order);
  } catch (e) { next(e); }
});

router.patch("/orders/:id/status", statusUpdateValidator, validate, async (req, res, next) => {
  try {
    const order = await updateOrderStatusByAdmin(req.params.id, req.user._id, req.body.status, req.body.note);
    return success(res, order);
  } catch (e) { next(e); }
});

router.get("/agents", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const agents = await Agent.find(filter)
      .populate("userId", "name email phone")
      .populate("currentZoneId", "name code")
      .lean();
    return success(res, agents);
  } catch (e) { next(e); }
});

router.get("/agents/:id", async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id).populate("userId", "name email phone").lean();
    if (!agent) throw new AppError("Agent not found", 404);
    return success(res, agent);
  } catch (e) { next(e); }
});

router.patch("/agents/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["AVAILABLE", "BUSY", "OFFLINE"].includes(status)) {
      throw new AppError("Invalid status", 400);
    }
    const agent = await Agent.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!agent) throw new AppError("Agent not found", 404);
    return success(res, agent);
  } catch (e) { next(e); }
});

/* ── PATCH /admin/agents/:id/zone ── assign/change agent zone ── */
router.patch("/agents/:id/zone", async (req, res, next) => {
  try {
    const { zoneId } = req.body;
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { currentZoneId: zoneId || null },
      { new: true }
    ).populate("userId", "name email phone").populate("currentZoneId", "name code");
    if (!agent) throw new AppError("Agent not found", 404);
    return success(res, agent);
  } catch (e) { next(e); }
});

router.get("/customers", async (req, res, next) => {
  try {
    const customers = await User.find({ role: "CUSTOMER" }).select("-passwordHash").lean();
    return success(res, customers);
  } catch (e) { next(e); }
});

export default router;
