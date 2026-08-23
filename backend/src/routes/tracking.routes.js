import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getTrackingHistory } from "../services/tracking.service.js";
import Order from "../models/Order.js";
import { AppError } from "../middleware/error.middleware.js";
import { success } from "../utils/response.js";

const router = Router();

router.get("/orders/:id/tracking", authMiddleware, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new AppError("Order not found", 404);
    if (req.user.role === "CUSTOMER" && order.customerId.toString() !== req.user._id.toString()) {
      throw new AppError("You do not have access to this order", 403);
    }
    const tracking = await getTrackingHistory(order._id);
    return success(res, { orderId: order.orderId, status: order.status, tracking });
  } catch (e) { next(e); }
});

export default router;
