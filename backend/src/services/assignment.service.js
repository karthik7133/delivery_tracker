import Agent from "../models/Agent.js";
import Order from "../models/Order.js";
import { AppError } from "../middleware/error.middleware.js";
import { haversineDistance } from "../utils/distance.js";
import { appendTracking } from "./tracking.service.js";

export async function findNearestAgent(pickupLat, pickupLon, pickupZoneId) {
  const availableAgents = await Agent.find({ status: "AVAILABLE" })
    .populate("userId", "name phone")
    .lean();

  if (availableAgents.length === 0) {
    throw new AppError("No available agents found", 404);
  }

  if (pickupLat != null && pickupLon != null) {
    const withDistance = availableAgents
      .filter((a) => a.currentLocation)
      .map((a) => ({
        agent: a,
        distance: haversineDistance(
          pickupLat,
          pickupLon,
          a.currentLocation.latitude,
          a.currentLocation.longitude
        ),
      }))
      .sort((x, y) => x.distance - y.distance);

    if (withDistance.length > 0) {
      return { agent: withDistance[0].agent, distance: withDistance[0].distance, method: "GPS" };
    }
  }

  const sameZone = availableAgents.filter((a) => {
    if (!pickupZoneId) return false;
    const zid = a.currentZoneId?.toString?.() || String(a.currentZoneId || "");
    return zid === String(pickupZoneId);
  });

  if (sameZone.length > 0) {
    return { agent: sameZone[0], distance: null, method: "ZONE_FALLBACK" };
  }

  return { agent: availableAgents[0], distance: null, method: "FIRST_AVAILABLE" };
}

export async function assignAgent(orderId, agentId, assignmentType, actorId) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const agent = await Agent.findById(agentId);
  if (!agent) throw new AppError("Agent not found", 404);
  if (agent.status !== "AVAILABLE") throw new AppError("Agent is not available", 400);

  agent.status = "BUSY";
  agent.assignedOrders.push(order._id);
  await agent.save();

  order.assignment = {
    agentId: agent._id,
    assignedAt: new Date(),
    assignmentType,
  };
  order.status = "ASSIGNED";
  await order.save();

  await appendTracking({
    orderId: order._id,
    status: "ASSIGNED",
    actorId,
    actorRole: actorId.equals(agent.userId) ? "AGENT" : "ADMIN",
    note: assignmentType === "AUTO" ? "Auto-assigned" : "Manually assigned",
  });

  return { order, agent };
}

export async function autoAssignAgent(orderId, actorId) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.assignment?.agentId) throw new AppError("Order already has an agent assigned", 409);

  const { agent, distance, method } = await findNearestAgent(
    order.pickup.latitude,
    order.pickup.longitude,
    order.pickup.zoneId
  );

  return assignAgent(orderId, agent._id, "AUTO", actorId);
}

export async function releaseAgent(orderId) {
  const order = await Order.findById(orderId);
  if (!order || !order.assignment?.agentId) return null;
  const agent = await Agent.findById(order.assignment.agentId);
  if (agent) {
    agent.assignedOrders = agent.assignedOrders.filter((id) => !id.equals(order._id));
    if (agent.assignedOrders.length === 0) agent.status = "AVAILABLE";
    await agent.save();
  }
  return agent;
}
