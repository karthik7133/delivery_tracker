import { body } from "express-validator";

export const locationValidator = [
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
];

export const agentStatusValidator = [
  body("status").isIn(["AVAILABLE", "BUSY", "OFFLINE"]).withMessage("Invalid agent status"),
];
