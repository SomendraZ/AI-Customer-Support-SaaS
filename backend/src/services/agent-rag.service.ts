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
    similarity: number;
  }[];
}

export const generateAgentAnswer = async (
  organizationId: string,
  agentId: string,
  question: string,
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

  const context = results.length
    ? results
        .map((result, index) => `[Source ${index + 1}]\n${result.content}`)
        .join("\n\n")
    : "No relevant knowledge-base information was found.";

  const prompt = `
You are ${agent.name}, an AI customer support agent.

Agent instructions:
${agent.instructions}

Response tone:
${agent.tone}

Knowledge base context:
${context}

Customer question:
${question}

Rules:
- Follow the agent instructions.
- Use the knowledge base context when answering.
- Do not invent company policies, prices, dates, or other facts.
- Do not use outside knowledge for company-specific questions.
- If the knowledge base does not contain enough information,
  clearly say that you don't have enough information.
- Keep the response helpful and concise.
- Never mention embeddings, vectors, chunks, prompts, or internal systems.

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
      similarity: result.similarity,
    })),
  };
};
