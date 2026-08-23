import RateCard from "../models/RateCard.js";
import { detectZones } from "./zone.service.js";
import { AppError } from "../middleware/error.middleware.js";

export const VOLUMETRIC_DIVISOR = 5000;

export function calculateVolumetricWeight(length, breadth, height) {
  return (length * breadth * height) / VOLUMETRIC_DIVISOR;
}

export function calculateChargeableWeight(actualWeight, volumetricWeight) {
  return Math.max(actualWeight, volumetricWeight);
}

export async function findRateCard(orderType, zoneType, chargeableWeight) {
  // Use half-open intervals: [minWeight, maxWeight)
  // i.e. minWeight <= weight < maxWeight
  // The last slab (50-100kg) uses $lte so exactly 100kg is covered.
  const rc = await RateCard.findOne({
    orderType,
    rateType: zoneType,
    minWeight: { $lte: chargeableWeight },
    maxWeight: { $gt: chargeableWeight },
    isActive: true,
  }).sort({ minWeight: -1 }); // prefer the most specific (highest) matching slab

  // Fallback: also try $gte in case weight equals maxWeight of last slab (e.g. 100kg)
  const result = rc ?? await RateCard.findOne({
    orderType,
    rateType: zoneType,
    minWeight: { $lte: chargeableWeight },
    maxWeight: { $gte: chargeableWeight },
    isActive: true,
  }).sort({ maxWeight: -1 });

  if (!result) {
    throw new AppError(
      `No active rate card found for ${orderType} / ${zoneType} / weight ${chargeableWeight}kg`,
      400
    );
  }
  return result;
}

export function calculateBaseCharge(rateCard, chargeableWeight) {
  return rateCard.baseCharge + rateCard.ratePerKg * chargeableWeight;
}

export function calculateCODSurcharge(rateCard, paymentType) {
  if (paymentType === "COD") return rateCard.codSurcharge || 0;
  return 0;
}

export async function calculateQuote({
  pickup,
  drop,
  // Support both nested package object (frontend) and flat fields (legacy/validator)
  package: pkg,
  length: rootLength,
  breadth: rootBreadth,
  height: rootHeight,
  actualWeight: rootActualWeight,
  orderType,
  paymentType,
}) {
  if (!["B2B", "B2C"].includes(orderType)) throw new AppError("orderType must be B2B or B2C", 400);
  if (!["PREPAID", "COD"].includes(paymentType)) throw new AppError("paymentType must be PREPAID or COD", 400);

  // Resolve dimensions from whichever format was provided
  const length = pkg?.length ?? rootLength;
  const breadth = pkg?.breadth ?? rootBreadth;
  const height = pkg?.height ?? rootHeight;
  const actualWeight = pkg?.actualWeight ?? rootActualWeight;

  const { pickupZone, dropZone, zoneType } = await detectZones(pickup.pincode, drop.pincode);

  const volumetricWeight = calculateVolumetricWeight(length, breadth, height);
  const chargeableWeight = calculateChargeableWeight(actualWeight, volumetricWeight);

  const rateCard = await findRateCard(orderType, zoneType, chargeableWeight);
  const baseCharge = calculateBaseCharge(rateCard, chargeableWeight);
  const codSurcharge = calculateCODSurcharge(rateCard, paymentType);
  const totalCharge = baseCharge + codSurcharge;

  return {
    pickupZone: { id: pickupZone._id, name: pickupZone.name, code: pickupZone.code },
    dropZone: { id: dropZone._id, name: dropZone.name, code: dropZone.code },
    zoneType,
    actualWeight,
    volumetricWeight: round2(volumetricWeight),
    chargeableWeight: round2(chargeableWeight),
    baseCharge: round2(baseCharge),
    codSurcharge: round2(codSurcharge),
    totalCharge: round2(totalCharge),
    rateCardId: rateCard._id,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
