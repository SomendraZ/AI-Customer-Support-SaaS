import { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import {
  generateAgentAnswer,
  type AgentRagResponse,
} from "./agent-rag.service.js";

const MAX_HISTORY_MESSAGES = 10;

export const sendFirstConversationMessage = async (
  organizationId: string,
  userId: string,
  agentId: string,
  question: string,
): Promise<AgentRagResponse & { conversationId: string }> => {
  if (!Types.ObjectId.isValid(agentId)) {
    throw new Error("Invalid agent ID");
  }

  if (!question.trim()) {
    throw new Error("Question is required");
  }

  const result = await generateAgentAnswer(
    organizationId,
    agentId,
    question.trim(),
    [],
    true,
  );

  const conversation = await Conversation.create({
    organizationId,
    agentId,
    userId,
    title: result.title,
    status: "open",
    resolution: "unresolved",
  });

  try {
    await Message.create({
      conversationId: conversation._id,
      organizationId,
      role: "user",
      content: question.trim(),
      status: "completed",
    });

    await Message.create({
      conversationId: conversation._id,
      organizationId,
      role: "assistant",
      content: result.answer,
      status: "completed",
      sources: result.sources,
    });
  } catch (error) {
    await Message.deleteMany({
      conversationId: conversation._id,
      organizationId,
    });

    await Conversation.deleteOne({
      _id: conversation._id,
      organizationId,
      userId,
    });

    throw error;
  }

  return {
    ...result,
    conversationId: conversation._id.toString(),
  };
};

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

  const existingMessageCount = await Message.countDocuments({
    conversationId: conversation._id,
    organizationId,
  });

  const userMessage = await Message.create({
    conversationId: conversation._id,
    organizationId,
    role: "user",
    content: question.trim(),
    status: "completed",
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
      existingMessageCount === 0,
    );
  } catch (error) {
    await Message.findByIdAndUpdate(userMessage._id, {
      status: "failed",
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

  const updateData: {
    updatedAt: Date;
    title?: string;
  } = {
    updatedAt: new Date(),
  };

  if (existingMessageCount === 0 && result.title) {
    updateData.title = result.title;
  }

  await Conversation.updateOne(
    {
      _id: conversation._id,
      organizationId,
      userId,
    },
    {
      $set: updateData,
    },
  );

  return result;
};

export const retryFailedMessage = async (
  organizationId: string,
  conversationId: string,
  messageId: string,
) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    organizationId,
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.status === "closed") {
    throw new Error("Conversation is closed");
  }

  const message = await Message.findOne({
    _id: messageId,
    conversationId: conversation._id,
    organizationId,
    role: "user",
    status: "failed",
  });

  if (!message) {
    throw new Error("Failed message not found");
  }

  const previousMessages = await Message.find({
    conversationId: conversation._id,
    organizationId,
    _id: { $ne: message._id },
  })
    .sort({ createdAt: 1 })
    .lean();

  const conversationHistory = previousMessages.map((item) => ({
    role: item.role,
    content: item.content,
  }));

  let result: AgentRagResponse;

  try {
    result = await generateAgentAnswer(
      organizationId,
      conversation.agentId.toString(),
      message.content,
      conversationHistory,
    );
  } catch (error) {
    throw error;
  }

  message.status = "completed";
  await message.save();

  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    organizationId,
    role: "assistant",
    content: result.answer,
    status: "completed",
    sources: result.sources,
  });

  return {
    message,
    assistantMessage,
    result,
  };
};
