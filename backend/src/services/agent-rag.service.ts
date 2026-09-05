import { Types } from "mongoose";
import { Agent } from "../models/Agent.js";
import { searchKnowledgeBase } from "./search.service.js";
import { gemini } from "../config/gemini.js";

const GENERATION_MODEL = "gemini-3.6-flash";

export interface AgentRagResponse {
  answer: string;
  title?: string;
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
  generateTitle = false,
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

  const context =
    results.length > 0
      ? results
          .map(
            (result, index) =>
              `[Source ${index + 1} | Page ${
                result.pageNumber ?? "Unknown"
              }]\n${result.content}`,
          )
          .join("\n\n")
      : "No relevant knowledge base information was found.";

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

${
  generateTitle
    ? `
Generate a short title for this conversation.

Title requirements:
- 2 to 6 words
- Clearly describe the customer's main issue
- Use normal title capitalization
- No quotation marks
- No punctuation
- Do not mention AI

Return JSON with this exact structure:

{
  "answer": "customer support response",
  "title": "short conversation title"
}
`
    : `
Return JSON with this exact structure:

{
  "answer": "customer support response"
}
`
}

Customer support response:
`;

  const response = await gemini.models.generateContent({
    model: GENERATION_MODEL,
    contents: prompt,
    config: {
      temperature: generateTitle ? 0.2 : agent.temperature,
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text?.trim();

  if (!rawText) {
    throw new Error("Failed to generate agent response");
  }

  let generated: {
    answer?: string;
    title?: string;
  };

  try {
    generated = JSON.parse(rawText);
  } catch {
    throw new Error("Failed to parse agent response");
  }

  if (!generated.answer?.trim()) {
    throw new Error("Failed to generate agent response");
  }

  const title = generated.title
    ?.trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[.!?,:;]+$/g, "")
    .slice(0, 200)
    .trim();

  return {
    answer: generated.answer.trim(),
    ...(generateTitle && title
      ? {
          title,
        }
      : {}),
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
