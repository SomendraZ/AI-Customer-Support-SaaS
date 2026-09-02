import { gemini } from "../config/gemini.js";
import { searchKnowledgeBase } from "./search.service.js";

const GENERATION_MODEL = "gemini-3.6-flash";

export interface RagResponse {
  answer: string;
  sources: {
    chunkId: string;
    documentId: string;
    similarity: number;
  }[];
}

export const generateRagAnswer = async (
  organizationId: string,
  question: string,
): Promise<RagResponse> => {
  const results = await searchKnowledgeBase(organizationId, question, 5);

  if (results.length === 0) {
    return {
      answer:
        "I don't have enough information in the knowledge base to answer that question.",
      sources: [],
    };
  }

  const context = results
    .map((result, index) => `[Source ${index + 1}]\n${result.content}`)
    .join("\n\n");

  const prompt = `
You are an AI customer support agent.

Answer the customer's question using ONLY the information
provided in the knowledge base context below.

Rules:
- Do not invent or assume information.
- Do not use outside knowledge.
- If the answer cannot be found in the context, say that
  you don't have enough information.
- Be concise and helpful.
- Do not mention embeddings, chunks, vectors, or internal
  system details.

Knowledge Base Context:
${context}

Customer Question:
${question}

Answer:
`;

  const response = await gemini.models.generateContent({
    model: GENERATION_MODEL,
    contents: prompt,
  });

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error("Failed to generate AI answer");
  }

  return {
    answer,
    sources: results.map((result) => ({
      chunkId: result.chunkId,
      documentId: result.documentId,
      similarity: result.similarity,
    })),
  };
};
