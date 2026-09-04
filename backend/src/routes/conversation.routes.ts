import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";

import {
  createConversation,
  getConversations,
  getConversation,
  getConversationMessages,
  closeConversation,
  sendMessage,
} from "../controllers/conversation.controller.js";

const router = Router();

router.use(protect);

router.post("/", createConversation);

router.get("/", getConversations);

router.get("/:id", getConversation);

router.get("/:id/messages", getConversationMessages);

router.patch("/:id/close", closeConversation);

router.post("/:id/messages", sendMessage);

export default router;
