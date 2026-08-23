/**
 * Transit Simulator
 * Simulates realistic package journey with timed TrackingHistory events.
 * 
 * Journey:
 *  CREATED → (2h) PICKED_UP "Picked up from seller"
 *           → (4h) IN_TRANSIT "Package at [Pickup City] Hub"  
 *           → (6-8h) IN_TRANSIT "In transit: [City] → [Drop City]"
 *           → Order becomes CLAIMABLE by agents in drop zone
 */

import Order from "../models/Order.js";
import { appendTracking } from "./tracking.service.js";
import Zone from "../models/Zone.js";
import { sendTransitNotificationEmail } from "./email.service.js";
import User from "../models/User.js";

// Simulated hub cities based on zone names (for realistic notes)
function hubCity(zoneName) {
  if (!zoneName) return "Regional Hub";
  return `${zoneName} Hub`;
}

// Convert hours to milliseconds (clamp minimum to 3s in dev for testing)
function hoursToMs(hours) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    // In dev: 1 hour = 3 minutes (so full journey = ~15-20 min visible)
    return hours * 3 * 60 * 1000;
  }
  return hours * 60 * 60 * 1000;
}

const SYSTEM_ACTOR_ID = "000000000000000000000000"; // placeholder system actorId

export async function startTransitSimulation(orderId) {
  // Slight initial delay so order is fully committed in DB
  setTimeout(async () => {
    try {
      const order = await Order.findById(orderId)
        .populate("pickup.zoneId", "name")
        .populate("drop.zoneId", "name")
        .lean();
      if (!order) return;

      const customer = await User.findById(order.customerId).lean();
      const pickupZoneName = order.pickup?.zoneId?.name || "Origin";
      const dropZoneName = order.drop?.zoneId?.name || "Destination";
      const isInterZone = order.pickup?.zoneId?._id?.toString() !== order.drop?.zoneId?._id?.toString();

      // Use a fake system userId for tracking records
      const mongoose = (await import("mongoose")).default;
      const systemId = new mongoose.Types.ObjectId(SYSTEM_ACTOR_ID);

      // ─── Step 1: PICKED_UP at 2 hours ───
      setTimeout(async () => {
        try {
          const fresh = await Order.findById(orderId);
          if (!fresh || fresh.status !== "CREATED") return;
          fresh.status = "PICKED_UP";
          await fresh.save();
          await appendTracking({
            orderId,
            status: "PICKED_UP",
            actorId: customer?._id || systemId,
            actorRole: "SYSTEM",
            note: `Picked up from seller in ${pickupZoneName}`,
          });
          // Notify customer
          if (customer) {
            sendTransitNotificationEmail(customer.email, {
              orderId: order.orderId,
              status: "PICKED_UP",
              note: `Your order has been picked up from the seller in ${pickupZoneName}.`,
            }).catch(() => {});
          }
        } catch (e) { console.error("[TRANSIT] PICKED_UP error:", e.message); }
      }, hoursToMs(2));

      // ─── Step 2: IN_TRANSIT at pickup hub (4h) ───
      setTimeout(async () => {
        try {
          const fresh = await Order.findById(orderId);
          if (!fresh || fresh.status !== "PICKED_UP") return;
          fresh.status = "IN_TRANSIT";
          await fresh.save();
          await appendTracking({
            orderId,
            status: "IN_TRANSIT",
            actorId: customer?._id || systemId,
            actorRole: "SYSTEM",
            note: `Package arrived at ${hubCity(pickupZoneName)}`,
          });
          if (customer) {
            sendTransitNotificationEmail(customer.email, {
              orderId: order.orderId,
              status: "IN_TRANSIT",
              note: `Your package is at ${hubCity(pickupZoneName)} and will be dispatched soon.`,
            }).catch(() => {});
          }
        } catch (e) { console.error("[TRANSIT] IN_TRANSIT hub error:", e.message); }
      }, hoursToMs(4));

      // ─── Step 3: IN_TRANSIT to drop zone (6h for intra, 8h for inter) ───
      if (isInterZone) {
        setTimeout(async () => {
          try {
            const fresh = await Order.findById(orderId);
            if (!fresh || fresh.status !== "IN_TRANSIT") return;
            await appendTracking({
              orderId,
              status: "IN_TRANSIT",
              actorId: customer?._id || systemId,
              actorRole: "SYSTEM",
              note: `In transit: ${pickupZoneName} → ${dropZoneName}`,
            });
          } catch (e) { console.error("[TRANSIT] inter-zone note error:", e.message); }
        }, hoursToMs(6));
      }

      // ─── Step 4: Arrives at drop hub — becomes claimable (8h intra / 10h inter) ───
      const arrivalHours = isInterZone ? 10 : 8;
      setTimeout(async () => {
        try {
          const fresh = await Order.findById(orderId);
          if (!fresh || !["PICKED_UP", "IN_TRANSIT"].includes(fresh.status)) return;
          fresh.status = "IN_TRANSIT";
          await fresh.save();
          await appendTracking({
            orderId,
            status: "IN_TRANSIT",
            actorId: customer?._id || systemId,
            actorRole: "SYSTEM",
            note: `Package at ${hubCity(dropZoneName)} — awaiting delivery agent`,
          });
          if (customer) {
            sendTransitNotificationEmail(customer.email, {
              orderId: order.orderId,
              status: "IN_TRANSIT",
              note: `Your package has reached ${hubCity(dropZoneName)} and a delivery agent will pick it up soon.`,
            }).catch(() => {});
          }
        } catch (e) { console.error("[TRANSIT] drop hub arrival error:", e.message); }
      }, hoursToMs(arrivalHours));

    } catch (e) {
      console.error("[TRANSIT] Simulation start error:", e.message);
    }
  }, 5000); // 5 second initial delay
}
