import { gemini } from "../config/gemini.js";

const EMBEDDING_MODEL = "gemini-embedding-001";

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await gemini.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }

  return embedding;
};
