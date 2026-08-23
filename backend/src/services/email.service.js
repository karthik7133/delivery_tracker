import { Resend } from "resend";
import crypto from "crypto";
import Otp from "../models/Otp.js";
import { AppError } from "../middleware/error.middleware.js";

/* ── Resend client (HTTP API — works on Render free tier) ── */
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new AppError("Email service is not configured. Contact support.", 503);
  return new Resend(apiKey);
}

/* ── Sender address — use onboarding@resend.dev until your domain is verified ── */
const FROM = process.env.RESEND_FROM || "SwiftKart <onboarding@resend.dev>";

/* ── Generate a cryptographically random 6-digit OTP ── */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Send OTP to the given email address.
 * Saves the OTP to MongoDB (auto-expires in 5 min).
 */
export async function sendOtpEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  // Delete any existing OTP for this email (avoid stale codes)
  await Otp.deleteMany({ email: normalizedEmail });

  const otp = generateOtp();

  // Persist OTP (expires automatically via TTL index)
  await Otp.create({ email: normalizedEmail, otp });

  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: normalizedEmail,
    subject: "Your SwiftKart Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">📦 SwiftKart</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Express Logistics</p>
        </div>
        <!-- Body -->
        <div style="padding: 32px 24px; background: #1e293b;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">Use the code below to verify your identity. It expires in <strong style="color: #fff;">5 minutes</strong>.</p>
          <!-- OTP Box -->
          <div style="background: #0f172a; border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #10b981; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.6;">
            If you didn't request this code, you can safely ignore this email.<br>
            Never share this code with anyone.
          </p>
        </div>
        <!-- Footer -->
        <div style="padding: 16px 24px; background: #0f172a; text-align: center;">
          <p style="color: #334155; font-size: 11px; margin: 0;">© 2025 SwiftKart Express Logistics</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[EMAIL] Resend error:", error);
    throw new AppError(`Failed to send OTP email: ${error.message}`, 502);
  }

  console.log(`[EMAIL] OTP sent to ${normalizedEmail} — id: ${data.id}`);
  return { messageId: data.id };
}

/**
 * Verify the OTP for a given email.
 * Deletes the OTP record on successful match (one-time use).
 * Throws if invalid or expired.
 */
export async function verifyOtpEmail(email, otp) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = await Otp.findOne({ email: normalizedEmail });

  if (!record) {
    throw new AppError("OTP has expired or was never sent. Please request a new one.", 400);
  }

  if (record.otp !== String(otp).trim()) {
    throw new AppError("Incorrect OTP. Please check and try again.", 400);
  }

  // Consume the OTP (delete it so it can't be reused)
  await Otp.deleteOne({ _id: record._id });
}

/**
 * Send a transit status update email to the customer.
 */
export async function sendTransitNotificationEmail(email, { orderId, status, note }) {
  try {
    const resend = getResend();
    const statusLabel = {
      PICKED_UP: "📦 Picked Up",
      IN_TRANSIT: "🚛 In Transit",
      OUT_FOR_DELIVERY: "🛵 Out for Delivery",
      DELIVERED: "✅ Delivered",
    }[status] || status;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `SwiftKart Order Update: ${statusLabel}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;">📦 SwiftKart</h1>
          </div>
          <div style="padding:28px 24px;background:#1e293b;">
            <p style="color:#10b981;font-size:18px;font-weight:800;margin:0 0 12px;">${statusLabel}</p>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 16px;">${note}</p>
            <div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:16px;">
              <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px;">Order ID</p>
              <p style="color:#fff;font-size:15px;font-weight:700;margin:0;font-family:monospace;">${orderId}</p>
            </div>
            <p style="color:#64748b;font-size:12px;margin:0;">Track your order live on the SwiftKart app.</p>
          </div>
          <div style="padding:14px 24px;background:#0f172a;text-align:center;">
            <p style="color:#334155;font-size:11px;margin:0;">© 2025 SwiftKart Express Logistics</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn(`[EMAIL] Transit notification failed to ${email}:`, err.message);
  }
}

/**
 * Notify customer that their order is out for delivery with agent details.
 */
export async function sendAgentAssignedEmail(email, { orderId, agentName, agentPhone, zone }) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `SwiftKart: Your order is Out for Delivery! 🛵`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;">📦 SwiftKart</h1>
          </div>
          <div style="padding:28px 24px;background:#1e293b;">
            <p style="color:#10b981;font-size:18px;font-weight:800;margin:0 0 8px;">🛵 Out for Delivery!</p>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Your order is on its way. Here's your delivery agent's details:</p>
            <div style="background:#0f172a;border-radius:10px;padding:16px;margin-bottom:16px;">
              <p style="color:#64748b;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Delivery Agent</p>
              <p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 6px;">👤 ${agentName}</p>
              <p style="color:#10b981;font-size:15px;font-weight:600;margin:0 0 6px;">📱 ${agentPhone}</p>
              ${zone ? `<p style="color:#64748b;font-size:13px;margin:0;">📍 ${zone}</p>` : ""}
            </div>
            <div style="background:#0f172a;border-radius:10px;padding:14px;margin-bottom:16px;">
              <p style="color:#64748b;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px;">Order ID</p>
              <p style="color:#fff;font-size:15px;font-weight:700;margin:0;font-family:monospace;">${orderId}</p>
            </div>
            <p style="color:#64748b;font-size:12px;margin:0;">Expected delivery today. Keep your phone handy!</p>
          </div>
          <div style="padding:14px 24px;background:#0f172a;text-align:center;">
            <p style="color:#334155;font-size:11px;margin:0;">© 2025 SwiftKart Express Logistics</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn(`[EMAIL] Agent-assigned notification failed to ${email}:`, err.message);
  }
}
