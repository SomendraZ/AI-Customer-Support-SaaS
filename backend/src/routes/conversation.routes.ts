import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";

import {
  createFirstConversation,
  createConversation,
  getConversations,
  getConversation,
  getConversationMessages,
  sendMessage,
  resolveConversation,
  retryMessage,
} from "../controllers/conversation.controller.js";

const router = Router();

router.use(protect);

router.post("/first-message", protect, createFirstConversation);

router.post("/", createConversation);

router.get("/", getConversations);

router.get("/:id", getConversation);

router.get("/:id/messages", getConversationMessages);

router.post("/:id/messages", sendMessage);

router.patch("/:id/resolve", resolveConversation);

router.post("/:id/messages/:messageId/retry", retryMessage);

export default router;
