import TrackingHistory from "../models/TrackingHistory.js";
import { AppError } from "../middleware/error.middleware.js";

export const VALID_TRANSITIONS = {
  CREATED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["ASSIGNED"],
  CANCELLED: [],
};

export function isValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function assertValidTransition(from, to) {
  if (!isValidTransition(from, to)) {
    throw new AppError(`Invalid status transition: ${from} -> ${to}`, 400);
  }
}

export async function appendTracking({ orderId, status, actorId, actorRole, note = "" }) {
  return TrackingHistory.create({
    orderId,
    status,
    actorId,
    actorRole,
    timestamp: new Date(),
    note,
  });
}

export async function getTrackingHistory(orderId) {
  return TrackingHistory.find({ orderId }).sort({ timestamp: 1 }).lean();
}
