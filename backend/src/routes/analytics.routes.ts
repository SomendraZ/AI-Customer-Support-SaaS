import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getConversationAnalytics,
  getResolutionAnalytics,
  getAgentAnalytics,
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get("/conversations", getConversationAnalytics);
router.get("/resolutions", getResolutionAnalytics);
router.get("/agents", getAgentAnalytics);

export default router;
