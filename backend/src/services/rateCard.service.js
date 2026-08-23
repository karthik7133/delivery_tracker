import RateCard from "../models/RateCard.js";
import { AppError } from "../middleware/error.middleware.js";

export async function createRateCard(data) {
  return RateCard.create(data);
}

export async function listRateCards(filter = {}) {
  return RateCard.find(filter).sort({ orderType: 1, rateType: 1, minWeight: 1 });
}

export async function getRateCard(id) {
  const rc = await RateCard.findById(id);
  if (!rc) throw new AppError("Rate card not found", 404);
  return rc;
}

export async function updateRateCard(id, data) {
  const rc = await RateCard.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!rc) throw new AppError("Rate card not found", 404);
  return rc;
}

export async function deleteRateCard(id) {
  const rc = await RateCard.findByIdAndDelete(id);
  if (!rc) throw new AppError("Rate card not found", 404);
  return rc;
}
