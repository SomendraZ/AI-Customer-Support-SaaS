import { DocumentChunk } from "../models/DocumentChunk.js";
import { generateEmbedding } from "./embedding.service.js";
import { Types } from "mongoose";

const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Embedding dimensions do not match");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];

    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export const searchKnowledgeBase = async (
  organizationId: string,
  query: string,
  limit = 5,
): Promise<SearchResult[]> => {
  if (!query.trim()) {
    throw new Error("Search query is required");
  }

  const queryEmbedding = await generateEmbedding(query);

  const chunks = await DocumentChunk.find({
    organizationId: new Types.ObjectId(organizationId),
    embedding: { $exists: true, $ne: [] },
  }).select("_id documentId content chunkIndex embedding");

  const results: SearchResult[] = chunks.map((chunk) => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

    return {
      chunkId: chunk._id.toString(),
      documentId: chunk.documentId.toString(),
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      similarity,
    };
  });

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
};
