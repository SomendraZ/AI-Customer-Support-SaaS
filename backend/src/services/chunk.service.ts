const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

export interface Chunk {
  content: string;
  pageNumber?: number;
}

export interface ChunkablePage {
  text: string;
  pageNumber?: number;
}

export const chunkText = (
  pages: ChunkablePage[],
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP,
): Chunk[] => {
  const chunks: Chunk[] = [];

  for (const page of pages) {
    const cleanedText = page.text.replace(/\s+/g, " ").trim();

    if (!cleanedText) {
      continue;
    }

    let start = 0;

    while (start < cleanedText.length) {
      const end = Math.min(start + chunkSize, cleanedText.length);

      const content = cleanedText.slice(start, end).trim();

      if (content) {
        chunks.push({
          content,
          pageNumber: page.pageNumber,
        });
      }

      if (end >= cleanedText.length) {
        break;
      }

      start = end - overlap;
    }
  }

  return chunks;
};
