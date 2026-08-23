import { body } from "express-validator";

export const zoneValidator = [
  body("name").trim().notEmpty().withMessage("Zone name is required"),
  body("code").trim().notEmpty().withMessage("Zone code is required"),
  body("areas").optional().isArray().withMessage("Areas must be an array"),
  body("pincodes").optional().isArray().withMessage("Pincodes must be an array"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

export const areasValidator = [
  body("areas").isArray({ min: 1 }).withMessage("Areas must be a non-empty array"),
];
