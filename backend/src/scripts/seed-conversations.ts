import "dotenv/config";
import mongoose from "mongoose";
import { Agent } from "../models/Agent.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

const seedConversations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    console.log("MongoDB connected");

    const agents = await Agent.find({
      status: "active",
    }).limit(2);

    if (agents.length === 0) {
      throw new Error("No active agents found");
    }

    const now = new Date();

    const createDate = (daysAgo: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(12, 0, 0, 0);
      return date;
    };

    for (const agent of agents) {
      const userId = agent.createdBy;
      const organizationId = agent.organizationId;

      const isRefundAgent = agent.name === "Refund & Billing Assistant";

      const conversation1 = await Conversation.create({
        organizationId,
        agentId: agent._id,
        userId,
        title: isRefundAgent
          ? "Refund eligibility question"
          : "Account access problem",
        status: "open",
        resolution: "unresolved",
        createdAt: createDate(0),
        updatedAt: createDate(0),
      });

      if (isRefundAgent) {
        await Message.insertMany([
          {
            conversationId: conversation1._id,
            organizationId,
            role: "user",
            content: "I purchased something last week. Can I get a refund?",
          },
          {
            conversationId: conversation1._id,
            organizationId,
            role: "assistant",
            content:
              "Yes. Customers can request a refund within 30 days of purchase.",
            sources: [],
          },
          {
            conversationId: conversation1._id,
            organizationId,
            role: "user",
            content: "What information do I need to provide?",
          },
        ]);
      } else {
        await Message.insertMany([
          {
            conversationId: conversation1._id,
            organizationId,
            role: "user",
            content: "I cannot access my account.",
          },
          {
            conversationId: conversation1._id,
            organizationId,
            role: "assistant",
            content:
              "I can help you with that. You can try resetting your password from the login page.",
            sources: [],
          },
          {
            conversationId: conversation1._id,
            organizationId,
            role: "user",
            content: "I already tried that and it still doesn't work.",
          },
        ]);
      }

      const conversation2 = await Conversation.create({
        organizationId,
        agentId: agent._id,
        userId,
        title: isRefundAgent ? "Refund processing time" : "Password reset help",
        status: "closed",
        resolution: "ai_resolved",
        createdAt: createDate(1),
        updatedAt: createDate(1),
      });

      if (isRefundAgent) {
        await Message.insertMany([
          {
            conversationId: conversation2._id,
            organizationId,
            role: "user",
            content: "How long does a refund take?",
          },
          {
            conversationId: conversation2._id,
            organizationId,
            role: "assistant",
            content: "Refunds are normally processed within 5–7 business days.",
            sources: [],
          },
          {
            conversationId: conversation2._id,
            organizationId,
            role: "user",
            content: "Okay, that's all I needed. Thanks!",
          },
          {
            conversationId: conversation2._id,
            organizationId,
            role: "assistant",
            content: "You're welcome! Have a great day.",
            sources: [],
          },
        ]);
      } else {
        await Message.insertMany([
          {
            conversationId: conversation2._id,
            organizationId,
            role: "user",
            content: "How can I reset my password?",
          },
          {
            conversationId: conversation2._id,
            organizationId,
            role: "assistant",
            content: "You can reset your password from the login page.",
            sources: [],
          },
          {
            conversationId: conversation2._id,
            organizationId,
            role: "user",
            content: "Got it. I was able to reset it.",
          },
          {
            conversationId: conversation2._id,
            organizationId,
            role: "assistant",
            content:
              "Great! I'm glad you were able to access your account again.",
            sources: [],
          },
        ]);
      }

      const conversation3 = await Conversation.create({
        organizationId,
        agentId: agent._id,
        userId,
        title: isRefundAgent
          ? "Refund request needs review"
          : "Account issue requiring support",
        status: "closed",
        resolution: "human_resolved",
        createdAt: createDate(3),
        updatedAt: createDate(3),
      });

      if (isRefundAgent) {
        await Message.insertMany([
          {
            conversationId: conversation3._id,
            organizationId,
            role: "user",
            content: "I want a refund for my purchase.",
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "assistant",
            content:
              "I can help with refund requests. Refunds can be requested within 30 days of purchase.",
            sources: [],
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "user",
            content:
              "My purchase was 25 days ago, but I have a special issue with the order.",
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "assistant",
            content:
              "I'll connect you with a support representative who can review your specific situation.",
            sources: [],
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "user",
            content: "Okay, thank you.",
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "assistant",
            content:
              "A support representative has reviewed your request and helped resolve the issue.",
            sources: [],
          },
        ]);
      } else {
        await Message.insertMany([
          {
            conversationId: conversation3._id,
            organizationId,
            role: "user",
            content: "I cannot log in even after resetting my password.",
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "assistant",
            content:
              "I'm sorry you're still having trouble. I'll connect you with a support representative.",
            sources: [],
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "user",
            content: "Yes, please connect me to someone.",
          },
          {
            conversationId: conversation3._id,
            organizationId,
            role: "assistant",
            content:
              "A support representative has taken over and resolved the account access issue.",
            sources: [],
          },
        ]);
      }

      const conversation4 = await Conversation.create({
        organizationId,
        agentId: agent._id,
        userId,
        title: isRefundAgent ? "Refund eligibility" : "Customer support hours",
        status: "closed",
        resolution: "ai_resolved",
        createdAt: createDate(5),
        updatedAt: createDate(5),
      });

      if (isRefundAgent) {
        await Message.insertMany([
          {
            conversationId: conversation4._id,
            organizationId,
            role: "user",
            content: "What is the refund policy?",
          },
          {
            conversationId: conversation4._id,
            organizationId,
            role: "assistant",
            content:
              "Customers can request a refund within 30 days of purchase.",
            sources: [],
          },
          {
            conversationId: conversation4._id,
            organizationId,
            role: "user",
            content:
              "My purchase was only 10 days ago. That answers my question.",
          },
          {
            conversationId: conversation4._id,
            organizationId,
            role: "assistant",
            content: "I'm glad I could help!",
            sources: [],
          },
        ]);
      } else {
        await Message.insertMany([
          {
            conversationId: conversation4._id,
            organizationId,
            role: "user",
            content: "When is customer support available?",
          },
          {
            conversationId: conversation4._id,
            organizationId,
            role: "assistant",
            content: "Support is available Monday to Friday, 9 AM to 6 PM.",
            sources: [],
          },
          {
            conversationId: conversation4._id,
            organizationId,
            role: "user",
            content: "Perfect, I'll contact support during those hours.",
          },
          {
            conversationId: conversation4._id,
            organizationId,
            role: "assistant",
            content: "Sounds good! We're happy to help.",
            sources: [],
          },
        ]);
      }

      console.log(`Created 4 conversations for ${agent.name}`);
    }

    console.log("Test conversations created successfully");
  } catch (error) {
    console.error("SEED ERROR:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedConversations();
