import { Router } from "express";
import { zoneValidator, areasValidator } from "../validators/zone.validator.js";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import {
  createZone,
  listZones,
  getZone,
  updateZone,
  deleteZone,
  addAreas,
  removeArea,
} from "../services/zone.service.js";
import { success } from "../utils/response.js";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.post("/", zoneValidator, validate, async (req, res, next) => {
  try { return success(res, await createZone(req.body), 201); } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try { return success(res, await listZones({})); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { return success(res, await getZone(req.params.id)); } catch (e) { next(e); }
});

router.put("/:id", zoneValidator, validate, async (req, res, next) => {
  try { return success(res, await updateZone(req.params.id, req.body)); } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try { return success(res, await deleteZone(req.params.id)); } catch (e) { next(e); }
});

router.post("/:id/areas", areasValidator, validate, async (req, res, next) => {
  try { return success(res, await addAreas(req.params.id, req.body.areas)); } catch (e) { next(e); }
});

router.delete("/:id/areas/:area", async (req, res, next) => {
  try { return success(res, await removeArea(req.params.id, decodeURIComponent(req.params.area))); } catch (e) { next(e); }
});

export default router;
