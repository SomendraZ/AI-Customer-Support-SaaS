import mongoose, { Document, Schema, Types } from "mongoose";

export type MessageRole = "user" | "assistant";

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  organizationId: Types.ObjectId;
  role: MessageRole;
  content: string;
  sources?: {
    chunkId: string;
    documentId: string;
    similarity: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    sources: {
      type: [
        {
          chunkId: {
            type: String,
            required: true,
          },
          documentId: {
            type: String,
            required: true,
          },
          similarity: {
            type: Number,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

export const Message = mongoose.model<IMessage>("Message", messageSchema);
