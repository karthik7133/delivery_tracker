import { Router } from "express";
import { rateCardValidator } from "../validators/rateCard.validator.js";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import {
  createRateCard,
  listRateCards,
  getRateCard,
  updateRateCard,
  deleteRateCard,
} from "../services/rateCard.service.js";
import { success } from "../utils/response.js";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.post("/", rateCardValidator, validate, async (req, res, next) => {
  try { return success(res, await createRateCard(req.body), 201); } catch (e) { next(e); }
});

router.get("/", async (req, res, next) => {
  try { return success(res, await listRateCards(req.query)); } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try { return success(res, await getRateCard(req.params.id)); } catch (e) { next(e); }
});

router.put("/:id", rateCardValidator, validate, async (req, res, next) => {
  try { return success(res, await updateRateCard(req.params.id, req.body)); } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try { return success(res, await deleteRateCard(req.params.id)); } catch (e) { next(e); }
});

export default router;
