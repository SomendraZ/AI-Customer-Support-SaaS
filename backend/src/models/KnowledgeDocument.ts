import mongoose, { Document, Schema, Types } from "mongoose";

export type DocumentStatus = "processing" | "ready" | "failed";

export type DocumentType = "pdf" | "txt" | "docx";

export interface IKnowledgeDocument extends Document {
  name: string;
  originalName: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  text: string;
  status: DocumentStatus;
  organizationId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["pdf", "txt", "docx"],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const KnowledgeDocument = mongoose.model<IKnowledgeDocument>(
  "KnowledgeDocument",
  knowledgeDocumentSchema,
);
