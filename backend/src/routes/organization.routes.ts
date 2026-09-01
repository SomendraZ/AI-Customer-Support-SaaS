import { Router } from "express";
import { getOrganization } from "../controllers/organization.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, getOrganization);

export default router;
