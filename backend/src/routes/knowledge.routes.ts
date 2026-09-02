import { Router } from "express";

import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  searchDocuments,
  askKnowledgeBase,
} from "../controllers/knowledge.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.use(protect);

router.post(
  "/upload",
  authorize("owner", "admin"),
  upload.single("document"),
  uploadDocument,
);

router.get("/", getDocuments);

router.get("/:id", getDocument);

router.delete("/:id", authorize("owner", "admin"), deleteDocument);

router.post("/search", searchDocuments);

router.post("/ask", askKnowledgeBase);

export default router;
