/**
 * Read MSG91 auth key at call-time (after dotenv has loaded).
 */
function getAuthKey() {
  const key = process.env.MSG_AUTH_KEY || process.env.msg_auth_key;
  if (!key) throw new Error("MSG91 auth key not set. Add msg_auth_key to backend/.env");
  return key;
}

function getTemplateId() {
  const id = process.env.MSG91_TEMPLATE_ID;
  if (!id || id === "YOUR_TEMPLATE_ID_HERE") {
    throw new Error(
      "MSG91 template ID not configured. Set MSG91_TEMPLATE_ID in backend/.env"
    );
  }
  return id;
}

/**
 * Send OTP via MSG91 v5 API.
 * MSG91 generates, stores, delivers, and expires the OTP — we do nothing local.
 *
 * POST https://control.msg91.com/api/v5/otp
 *   Headers: authkey, content-type: application/json
 *   Query:   template_id, mobile (with country code prefix e.g. 91)
 */
export async function sendOtpSMS(phone) {
  const AUTH_KEY = getAuthKey();
  const TEMPLATE_ID = getTemplateId();
  const mobile = `91${phone.replace(/\D/g, "").slice(-10)}`;
  const url = `https://control.msg91.com/api/v5/otp?template_id=${TEMPLATE_ID}&mobile=${mobile}`;

  console.log(`[MSG91] Sending OTP → mobile: ${mobile}, template: ${TEMPLATE_ID}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { authkey: AUTH_KEY, "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = await res.json().catch(() => ({}));
  console.log(`[MSG91] Send OTP response:`, JSON.stringify(data));

  // { type: "success", message: "..." } or { type: "error", message: "..." }
  if (data.type === "error") {
    throw new Error(`MSG91: ${data.message || "Failed to send OTP"}`);
  }

  return data;
}

/**
 * Verify OTP via MSG91 v5 API.
 * MSG91 is the authority — if it returns success, the OTP is valid.
 *
 * GET https://control.msg91.com/api/v5/otp/verify
 *   Headers: authkey
 *   Query:   otp, mobile
 */
export async function verifyOtpSMS(phone, otp) {
  const AUTH_KEY = getAuthKey();
  const mobile = `91${phone.replace(/\D/g, "").slice(-10)}`;
  const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${mobile}`;

  console.log(`[MSG91] Verifying OTP → mobile: ${mobile}`);

  const res = await fetch(url, {
    method: "GET",
    headers: { authkey: AUTH_KEY },
  });

  const data = await res.json().catch(() => ({}));
  console.log(`[MSG91] Verify OTP response:`, JSON.stringify(data));

  if (data.type === "error") {
    throw new Error(data.message || "Invalid or expired OTP");
  }

  return data;
}

/**
 * Send a transactional SMS notification (order updates etc.) via MSG91.
 */
export async function sendNotificationSMS(phone, message) {
  const AUTH_KEY = process.env.MSG_AUTH_KEY || process.env.msg_auth_key;
  if (!phone || !AUTH_KEY) return;
  const mobile = `91${phone.replace(/\D/g, "").slice(-10)}`;
  const encodedMessage = encodeURIComponent(message);

  try {
    const url = `https://api.msg91.com/api/sendhttp.php?authkey=${AUTH_KEY}&mobiles=${mobile}&message=${encodedMessage}&sender=DELTRK&route=4&country=91`;
    await fetch(url);
    console.log(`[MSG91] Notification sent to ${mobile}`);
  } catch (err) {
    console.warn(`[MSG91] Notification warning: ${err.message}`);
  }
}
