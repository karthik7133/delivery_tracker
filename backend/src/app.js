import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import zoneRoutes from "./routes/zone.routes.js";
import rateCardRoutes from "./routes/rateCard.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Delivery Tracker API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/agent", uploadRoutes);
app.use("/api/admin/zones", zoneRoutes);       // must be before /api/admin
app.use("/api/admin/rate-cards", rateCardRoutes); // must be before /api/admin
app.use("/api/admin", adminRoutes);
app.use("/api", trackingRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;
