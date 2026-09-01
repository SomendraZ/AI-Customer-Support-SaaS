import { Router } from "express";

import {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  deleteAgent,
} from "../controllers/agent.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(protect);

router.post("/", authorize("owner", "admin"), createAgent);

router.get("/", getAgents);

router.get("/:id", getAgent);

router.patch("/:id", authorize("owner", "admin"), updateAgent);

router.delete("/:id", authorize("owner", "admin"), deleteAgent);

export default router;
