import { body } from "express-validator";

export const rateCardValidator = [
  body("orderType").isIn(["B2B", "B2C"]).withMessage("orderType must be B2B or B2C"),
  body("rateType").isIn(["INTRA_ZONE", "INTER_ZONE"]).withMessage("rateType must be INTRA_ZONE or INTER_ZONE"),
  body("minWeight").isFloat({ min: 0 }).withMessage("minWeight must be >= 0"),
  body("maxWeight").isFloat({ min: 0 }).withMessage("maxWeight must be >= 0"),
  body("ratePerKg").isFloat({ min: 0 }).withMessage("ratePerKg must be >= 0"),
  body("baseCharge").isFloat({ min: 0 }).withMessage("baseCharge must be >= 0"),
  body("codSurcharge").optional().isFloat({ min: 0 }).withMessage("codSurcharge must be >= 0"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];
