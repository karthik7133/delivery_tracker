import { Router } from "express";
import multer from "multer";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import Order from "../models/Order.js";
import Agent from "../models/Agent.js";
import { AppError } from "../middleware/error.middleware.js";
import { success } from "../utils/response.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post(
  "/orders/:id/proof",
  authMiddleware,
  requireRole("AGENT"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError("No file uploaded", 400);

      const agent = await Agent.findOne({ userId: req.user._id });
      if (!agent) throw new AppError("Agent profile not found", 404);

      const order = await Order.findById(req.params.id);
      if (!order) throw new AppError("Order not found", 404);

      // Allow upload if agent is assigned, OR if order status allows proof submission
      const isAssigned =
        order.assignment?.agentId &&
        order.assignment.agentId.toString() === agent._id.toString();

      const isDeliveryStatus = ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED"].includes(order.status);

      if (!isAssigned && !isDeliveryStatus) {
        throw new AppError("You are not assigned to this order", 403);
      }

      // Upload to Cloudinary with detailed error info
      let proofUrl;
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          "delivery-tracker/proof",
          "image"
        );
        proofUrl = result.secure_url;
      } catch (cloudErr) {
        console.error("[Upload] Cloudinary failed:", cloudErr.message);
        // Fallback: store as base64 data URL (works without Cloudinary)
        const base64 = req.file.buffer.toString("base64");
        proofUrl = `data:${req.file.mimetype};base64,${base64}`;
        console.warn("[Upload] Falling back to base64 data URL for proof");
      }

      order.proofUrl = proofUrl;
      await order.save();

      console.log(`[Upload] Proof saved for order ${order.orderId}`);
      return success(res, { proofUrl });
    } catch (e) {
      console.error("[Upload] Error:", e.message);
      next(e);
    }
  }
);

export default router;
