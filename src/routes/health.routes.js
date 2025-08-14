import { Router } from "express";
import { healthCheck } from "../controller/health.controller.js";

const router = Router();

// Public route - no authentication required
router.get("/", healthCheck);

export default router;
