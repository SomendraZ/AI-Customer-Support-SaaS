import { Response } from "express";
import mongoose, { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Agent } from "../models/Agent.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  retryFailedMessage,
  sendConversationMessage,
} from "../services/conversation.service.js";

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User identity is missing",
      });
    }

    const { agentId, title } = req.body;

    if (!agentId || !Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid agent ID is required",
      });
    }

    const agent = await Agent.findOne({
      _id: agentId,
      organizationId: req.user.organizationId,
      status: "active",
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Active agent not found",
      });
    }

    const conversation = await Conversation.create({
      organizationId: req.user.organizationId,
      agentId: agent._id,
      userId,
      title: title?.trim(),
      status: "open",
      resolution: "unresolved",
    });

    return res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("CREATE CONVERSATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const conversations = await Conversation.find({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
    })
      .populate("agentId", "name")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversations",
    });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { id } = req.params;
    const conversationId = Array.isArray(id) ? id[0] : id;

    if (!Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      organizationId: req.user.organizationId,
      userId: req.user.userId,
    }).populate("agentId", "name");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("GET CONVERSATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversation",
    });
  }
};

export const getConversationMessages = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { id } = req.params;
    const conversationId = Array.isArray(id) ? id[0] : id;

    if (!Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      organizationId: req.user.organizationId,
      userId: req.user.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
      organizationId: req.user.organizationId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("GET CONVERSATION MESSAGES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { id } = req.params;
    const conversationId = Array.isArray(id) ? id[0] : id;
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await sendConversationMessage(
      req.user.organizationId,
      req.user.userId,
      conversationId,
      question,
    );

    return res.status(200).json({
      success: true,
      answer: result.answer,
      title: result.title,
      agent: result.agent,
      sources: result.sources,
    });
  } catch (error: any) {
    console.error("SEND MESSAGE ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to send message";

    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "AI service quota exceeded. Please try again later.",
      });
    }

    if (message === "Conversation not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message === "Invalid conversation ID" ||
      message === "Question is required"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

export const resolveConversation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { organizationId, userId } = req.user;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { resolution } = req.body;

    if (resolution !== "ai_resolved" && resolution !== "human_resolved") {
      res.status(400).json({
        success: false,
        message: "Invalid resolution type",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
      return;
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: id,
        organizationId,
        userId,
        status: "open",
      },
      {
        status: "closed",
        resolution,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Open conversation not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Conversation resolved successfully",
      conversation,
    });
  } catch (error) {
    console.error("RESOLVE CONVERSATION ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to resolve conversation",
    });
  }
};

export const retryMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { organizationId } = req.user;

    const conversationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId;

    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation or message ID",
      });
      return;
    }

    const result = await retryFailedMessage(
      organizationId,
      conversationId,
      messageId,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      assistantMessage: result.assistantMessage,
      answer: result.result.answer,
      agent: result.result.agent,
      sources: result.result.sources,
    });
  } catch (error: any) {
    console.error("RETRY MESSAGE ERROR:", error);

    if (error?.status === 429) {
      res.status(429).json({
        success: false,
        message: "AI service quota exceeded. Please try again later.",
      });
      return;
    }

    if (error instanceof Error && error.message === "Conversation not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof Error && error.message === "Conversation is closed") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "Failed message not found"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to retry message",
    });
  }
};
