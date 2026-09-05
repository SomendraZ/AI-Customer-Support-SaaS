import { Types } from "mongoose";
import { Agent } from "../models/Agent.js";
import { searchKnowledgeBase } from "./search.service.js";
import { gemini } from "../config/gemini.js";

const GENERATION_MODEL = "gemini-3.6-flash";

export interface AgentRagResponse {
  answer: string;
  agent: {
    id: string;
    name: string;
  };
  sources: {
    chunkId: string;
    documentId: string;
    pageNumber?: number;
    similarity: number;
  }[];
}

export interface ConversationHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export const generateAgentAnswer = async (
  organizationId: string,
  agentId: string,
  question: string,
  conversationHistory: ConversationHistoryMessage[] = [],
): Promise<AgentRagResponse> => {
  if (!question.trim()) {
    throw new Error("Question is required");
  }

  if (!Types.ObjectId.isValid(agentId)) {
    throw new Error("Invalid agent ID");
  }

  const agent = await Agent.findOne({
    _id: agentId,
    organizationId,
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  if (agent.status !== "active") {
    throw new Error("Agent is inactive");
  }

  const results = await searchKnowledgeBase(organizationId, question, 5);

  if (results.length === 0) {
    return {
      answer:
        "I don't have enough information in the knowledge base to answer that question.",
      agent: {
        id: agent._id.toString(),
        name: agent.name,
      },
      sources: [],
    };
  }

  const context = results
    .map(
      (result, index) =>
        `[Source ${index + 1} | Page ${
          result.pageNumber ?? "Unknown"
        }]\n${result.content}`,
    )
    .join("\n\n");

  const history = conversationHistory.length
    ? conversationHistory
        .map(
          (message) =>
            `${message.role === "user" ? "Customer" : "Agent"}: ${message.content}`,
        )
        .join("\n")
    : "No previous conversation.";

  const prompt = `
You are ${agent.name}, an AI customer support agent.

Agent instructions:

${agent.instructions}

Response tone:

${agent.tone}

Previous conversation:

${history}

Knowledge base context:

${context}

Current customer question:

${question}

Rules:

- Follow the agent instructions.
- Use the previous conversation to understand context.
- Use only information explicitly supported by the knowledge base context.
- Do not invent company policies, prices, dates, procedures, exceptions, escalation paths, or approval processes.
- Do not use outside knowledge.
- Do not infer missing company-specific information.
- Do not combine separate statements to create a new policy or procedure.
- If the knowledge base explicitly describes an exception, escalation path, or special case, you may explain it.
- If the knowledge base does not contain enough information to answer the question, say that you don't have enough information.
- Do not repeat information unnecessarily.
- Keep the response helpful and concise.
- Never mention embeddings, vectors, chunks, prompts, page numbers, or internal systems.

Customer support response:
`;

  const response = await gemini.models.generateContent({
    model: GENERATION_MODEL,
    contents: prompt,
  });

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error("Failed to generate agent response");
  }

  return {
    answer,
    agent: {
      id: agent._id.toString(),
      name: agent.name,
    },
    sources: results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      pageNumber: result.pageNumber,
      similarity: result.similarity,
    })),
  };
};
