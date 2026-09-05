import { Types } from "mongoose";
import { DocumentChunk } from "../models/DocumentChunk.js";
import { generateEmbedding } from "./embedding.service.js";

const MIN_SIMILARITY = Number(process.env.RAG_MIN_SIMILARITY || "0.65");

const MAX_SCORE_GAP = Number(process.env.RAG_MAX_SCORE_GAP || "0.15");

if (Number.isNaN(MIN_SIMILARITY) || MIN_SIMILARITY < 0 || MIN_SIMILARITY > 1) {
  throw new Error("RAG_MIN_SIMILARITY must be a number between 0 and 1");
}

if (Number.isNaN(MAX_SCORE_GAP) || MAX_SCORE_GAP < 0 || MAX_SCORE_GAP > 1) {
  throw new Error("RAG_MAX_SCORE_GAP must be a number between 0 and 1");
}

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
  pageNumber?: number;
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
  }).select("_id documentId content chunkIndex pageNumber embedding");

  const results: SearchResult[] = chunks
    .map((chunk) => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

      return {
        chunkId: chunk._id.toString(),
        documentId: chunk.documentId.toString(),
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);

  const filteredResults = results.filter(
    (result) => result.similarity >= MIN_SIMILARITY,
  );

  if (filteredResults.length === 0) {
    return [];
  }

  const topSimilarity = filteredResults[0].similarity;

  return filteredResults
    .filter((result) => topSimilarity - result.similarity <= MAX_SCORE_GAP)
    .slice(0, limit);
};
