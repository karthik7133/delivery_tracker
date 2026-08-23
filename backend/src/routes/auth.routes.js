import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { registerUser, loginUser, getMe } from "../services/auth.service.js";
import { success, fail } from "../utils/response.js";

export async function register(req, res, next) {
  try {
    const { token, user } = await registerUser(req.body);
    return success(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { token, user } = await loginUser(req.body);
    return success(res, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getMe(req.user._id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

export async function sendOtp(req, res, next) {
  try {
    const result = await requestOtp(req.body.email);
    return success(res, result);
  } catch (err) { next(err); }
}

export async function verifyOtpHandler(req, res, next) {
  try {
    const { token, user } = await verifyOtp(req.body);
    return success(res, { token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) { next(err); }
}

import { Router } from "express";
import { requestOtp, verifyOtp } from "../services/auth.service.js";

const router = Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpHandler);
router.get("/me", authMiddleware, me);

export default router;
