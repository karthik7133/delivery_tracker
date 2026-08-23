import { body } from "express-validator";

const addressFields = (prefix) => [
  body(`${prefix}.address`).trim().notEmpty().withMessage(`${prefix}.address is required`),
  body(`${prefix}.city`).trim().notEmpty().withMessage(`${prefix}.city is required`),
  body(`${prefix}.pincode`).trim().notEmpty().isLength({ min: 6, max: 6 }).withMessage(`${prefix}.pincode must be 6 digits`),
  body(`${prefix}.latitude`).optional().isFloat().withMessage(`${prefix}.latitude must be a number`),
  body(`${prefix}.longitude`).optional().isFloat().withMessage(`${prefix}.longitude must be a number`),
];

export const quoteValidator = [
  ...addressFields("pickup"),
  ...addressFields("drop"),
  // Accept dimensions nested under package{} (frontend format)
  body("package.length").optional().isFloat({ min: 0.1 }).withMessage("package.length must be > 0"),
  body("package.breadth").optional().isFloat({ min: 0.1 }).withMessage("package.breadth must be > 0"),
  body("package.height").optional().isFloat({ min: 0.1 }).withMessage("package.height must be > 0"),
  body("package.actualWeight").optional().isFloat({ min: 0.1 }).withMessage("package.actualWeight must be > 0"),
  // Accept dimensions flat at root level (legacy format)
  body("length").optional().isFloat({ min: 0.1 }).withMessage("length must be > 0"),
  body("breadth").optional().isFloat({ min: 0.1 }).withMessage("breadth must be > 0"),
  body("height").optional().isFloat({ min: 0.1 }).withMessage("height must be > 0"),
  body("actualWeight").optional().isFloat({ min: 0.1 }).withMessage("actualWeight must be > 0"),
  body("orderType").isIn(["B2B", "B2C"]).withMessage("orderType must be B2B or B2C"),
  body("paymentType").isIn(["PREPAID", "COD"]).withMessage("paymentType must be PREPAID or COD"),
];

export const createOrderValidator = quoteValidator;

export const rescheduleValidator = [
  body("newDate").isISO8601().withMessage("newDate must be a valid ISO date"),
];

export const statusUpdateValidator = [
  body("status").isIn(["CREATED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"]).withMessage("Invalid status"),
  body("note").optional().trim(),
];
