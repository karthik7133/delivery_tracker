import Zone from "../models/Zone.js";
import { AppError } from "../middleware/error.middleware.js";

export async function detectZoneByPincode(pincode) {
  const zone = await Zone.findOne({ pincodes: pincode, isActive: true });
  return zone || null;
}

export async function detectZones(pickupPincode, dropPincode) {
  const [pickupZone, dropZone] = await Promise.all([
    detectZoneByPincode(pickupPincode),
    detectZoneByPincode(dropPincode),
  ]);

  if (!pickupZone) throw new AppError(`No active zone found for pickup pincode ${pickupPincode}`, 400);
  if (!dropZone) throw new AppError(`No active zone found for drop pincode ${dropPincode}`, 400);

  const zoneType = pickupZone._id.equals(dropZone._id) ? "INTRA_ZONE" : "INTER_ZONE";
  return { pickupZone, dropZone, zoneType };
}

export async function createZone(data) {
  const existing = await Zone.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AppError("Zone code already exists", 409);
  return Zone.create({ ...data, code: data.code.toUpperCase() });
}

export async function listZones(filter = {}) {
  return Zone.find(filter).sort({ name: 1 });
}

export async function getZone(id) {
  const zone = await Zone.findById(id);
  if (!zone) throw new AppError("Zone not found", 404);
  return zone;
}

export async function updateZone(id, data) {
  const zone = await Zone.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!zone) throw new AppError("Zone not found", 404);
  return zone;
}

export async function deleteZone(id) {
  const zone = await Zone.findByIdAndDelete(id);
  if (!zone) throw new AppError("Zone not found", 404);
  return zone;
}

export async function addAreas(zoneId, areas) {
  const zone = await Zone.findById(zoneId);
  if (!zone) throw new AppError("Zone not found", 404);
  const set = new Set([...zone.areas, ...areas]);
  zone.areas = [...set];
  await zone.save();
  return zone;
}

export async function removeArea(zoneId, area) {
  const zone = await Zone.findById(zoneId);
  if (!zone) throw new AppError("Zone not found", 404);
  zone.areas = zone.areas.filter((a) => a !== area);
  await zone.save();
  return zone;
}
