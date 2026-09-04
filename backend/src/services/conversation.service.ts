import { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import {
  generateAgentAnswer,
  type AgentRagResponse,
} from "./agent-rag.service.js";

const MAX_HISTORY_MESSAGES = 10;

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

  const userMessage = await Message.create({
    conversationId: conversation._id,
    organizationId,
    role: "user",
    content: question.trim(),
  });

  const recentMessages = await Message.find({
    conversationId: conversation._id,
    organizationId,
  })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES);

  const conversationHistory = recentMessages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));

  let result: AgentRagResponse;

  try {
    result = await generateAgentAnswer(
      organizationId,
      conversation.agentId.toString(),
      question.trim(),
      conversationHistory,
    );
  } catch (error) {
    await Message.deleteOne({
      _id: userMessage._id,
      conversationId: conversation._id,
      organizationId,
    });

    throw error;
  }

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
