/**
 * Test proof upload directly using Node.js fetch + FormData
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Order from "../src/models/Order.js";

await mongoose.connect(process.env.MONGODB_URI);

// Get the agent token
const loginRes = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "ravi@deliverytracker.com", password: "Agent@123" }),
});
const loginData = await loginRes.json();
const token = loginData.data?.token;
console.log("Agent token:", token ? "✅ obtained" : "❌ FAILED");

// Get an order
const order = await Order.findOne({}).sort({ createdAt: -1 });
if (!order) { console.log("No orders found"); process.exit(1); }
console.log("Order:", order.orderId, "status:", order.status, "agentId:", order.assignment?.agentId);

// Create a tiny 1x1 red pixel JPEG
const jpegBytes = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=",
  "base64"
);

const form = new FormData();
const blob = new Blob([jpegBytes], { type: "image/jpeg" });
form.append("file", blob, "proof.jpg");

console.log("\nUploading proof to:", `http://localhost:5000/api/agent/orders/${order._id}/proof`);

const res = await fetch(`http://localhost:5000/api/agent/orders/${order._id}/proof`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}` },
  body: form,
});

const data = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(data, null, 2));

await mongoose.disconnect();
