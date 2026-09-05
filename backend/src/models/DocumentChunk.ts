import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDocumentChunk extends Document {
  documentId: Types.ObjectId;
  organizationId: Types.ObjectId;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeDocument",
      required: true,
      index: true,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    pageNumber: {
      type: Number,
      min: 1,
    },

    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

documentChunkSchema.index({
  documentId: 1,
  chunkIndex: 1,
});

export const DocumentChunk = mongoose.model<IDocumentChunk>(
  "DocumentChunk",
  documentChunkSchema,
);
