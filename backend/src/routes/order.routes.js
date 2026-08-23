import { Router } from "express";
import { quoteValidator, createOrderValidator, rescheduleValidator } from "../validators/order.validator.js";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import {
  quoteOrder,
  createOrder,
  listMyOrders,
  getOrderForCustomer,
  getOrderWithTracking,
  rescheduleOrder,
  checkPincodeDeliverability,
} from "../services/order.service.js";
import { success } from "../utils/response.js";

const router = Router();

router.use(authMiddleware);

/* ── Public(ish) pincode deliverability check ── */
router.get("/check-pincode", async (req, res, next) => {
  try {
    const { pincode } = req.query;
    if (!pincode) return success(res, { deliverable: false, message: "Pincode is required" });
    return success(res, await checkPincodeDeliverability(String(pincode).trim()));
  } catch (e) { next(e); }
});

router.post("/quote", quoteValidator, validate, async (req, res, next) => {
  try { return success(res, await quoteOrder(req.body)); } catch (e) { next(e); }
});

router.post("/", createOrderValidator, validate, requireRole("CUSTOMER", "ADMIN"), async (req, res, next) => {
  try {
    const order = await createOrder(req.user._id, req.body);
    return success(res, order, 201);
  } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try { return success(res, await listMyOrders(req.user._id, req.query)); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { return success(res, await getOrderForCustomer(req.params.id, req.user._id)); } catch (e) { next(e); }
});

router.get("/:id/tracking", async (req, res, next) => {
  try { return success(res, await getOrderWithTracking(req.params.id, req.user._id)); } catch (e) { next(e); }
});

router.post("/:id/reschedule", rescheduleValidator, validate, requireRole("CUSTOMER"), async (req, res, next) => {
  try { return success(res, await rescheduleOrder(req.params.id, req.user._id, req.body.newDate)); } catch (e) { next(e); }
});

export default router;
