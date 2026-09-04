import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  organizationId: Types.ObjectId;
  agentId: Types.ObjectId;
  userId: Types.ObjectId;
  title?: string;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    agentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({
  organizationId: 1,
  agentId: 1,
  userId: 1,
});

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
