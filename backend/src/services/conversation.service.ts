import { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import {
  generateAgentAnswer,
  type AgentRagResponse,
} from "./agent-rag.service.js";

export const sendConversationMessage = async (
  organizationId: string,
  userId: string,
  conversationId: string,
  question: string,
): Promise<AgentRagResponse> => {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new Error("Invalid conversation ID");
  }

  if (!question.trim()) {
    throw new Error("Question is required");
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    organizationId,
    userId,
    status: "open",
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await Message.create({
    conversationId: conversation._id,
    organizationId,
    role: "user",
    content: question.trim(),
  });

  const result = await generateAgentAnswer(
    organizationId,
    conversation.agentId.toString(),
    question.trim(),
  );

  await Message.create({
    conversationId: conversation._id,
    organizationId,
    role: "assistant",
    content: result.answer,
    sources: result.sources,
  });

  await Conversation.updateOne(
    {
      _id: conversation._id,
      organizationId,
      userId,
    },
    {
      $set: {
        updatedAt: new Date(),
      },
    },
  );

  return result;
};
