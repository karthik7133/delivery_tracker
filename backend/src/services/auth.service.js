import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Agent from "../models/Agent.js";
import { sendOtpEmail, verifyOtpEmail } from "./email.service.js";
import { detectZoneByPincode } from "./zone.service.js";
import { AppError } from "../middleware/error.middleware.js";

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export async function registerUser({ name, email, phone, password, role }) {
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw new AppError("Email or phone already registered", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const userRole = role === "AGENT" ? "AGENT" : role === "ADMIN" ? "ADMIN" : "CUSTOMER";
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: userRole,
  });

  // Auto-create Agent profile when role is AGENT
  if (userRole === "AGENT") {
    await Agent.create({
      userId: user._id,
      phone: phone ? phone.replace(/\D/g, "").slice(-10) : "",
      vehicleType: "BIKE",
      status: "AVAILABLE",
    });
  }

  const token = signToken(user);
  return { token, user };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid credentials", 401);
  if (!user.isActive) throw new AppError("Account is deactivated", 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError("Invalid credentials", 401);

  const token = signToken(user);
  return { token, user };
}

/**
 * Step 1: Send OTP via Email.
 * Generates OTP locally, stores in MongoDB, sends branded email.
 */
export async function requestOtp(email) {
  if (!email) throw new AppError("Email address is required", 400);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new AppError("Enter a valid email address", 400);

  await sendOtpEmail(email);
  return { message: "OTP sent to your email address" };
}

/**
 * Step 2: Verify OTP
 * mode = "login"    → user must already exist (lookup by email)
 * mode = "register" → create the user if OTP is valid (requires name, phone, role)
 */
export async function verifyOtp({ email, otp, name, phone, role, pincode, vehicleType, mode = "login" }) {
  if (!email || !otp) throw new AppError("Email and OTP are required", 400);

  // Verify OTP against DB — throws if invalid or expired
  await verifyOtpEmail(email, otp);

  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    if (mode === "login") {
      throw new AppError("No account found with this email. Please register first.", 404);
    }

    // Register mode: create the account now
    if (!name) throw new AppError("Name is required to register", 400);

    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : "";
    const userRole = role === "AGENT" ? "AGENT" : "CUSTOMER";

    const passwordHash = await bcrypt.hash("OtpUser@123", 10);
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: cleanPhone,
      passwordHash,
      role: userRole,
    });

    // Auto-create Agent profile when role is AGENT
    if (userRole === "AGENT") {
      // Find matching zone by home pincode (if provided)
      const homePincode = (pincode || "").toString().trim();
      const zone = homePincode ? await detectZoneByPincode(homePincode) : null;

      await Agent.create({
        userId: user._id,
        phone: cleanPhone,
        vehicleType: vehicleType || "BIKE",
        status: "AVAILABLE",
        currentZoneId: zone?._id || null,
      });

      console.log(`[AUTH] Agent profile created for ${user.email}${zone ? ` → Zone: ${zone.name}` : " (no zone matched)"}`);
    }
  } else if (mode === "register") {
    throw new AppError("This email is already registered. Please login instead.", 409);
  }

  if (!user.isActive) throw new AppError("Your account has been deactivated. Contact support.", 403);

  const token = signToken(user);
  return { token, user };
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
}
