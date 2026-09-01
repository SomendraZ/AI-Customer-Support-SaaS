import mongoose, { Document, Schema, Types } from "mongoose";

export type AgentStatus = "active" | "inactive";

export type AgentTone = "professional" | "friendly" | "casual" | "formal";

export interface IAgent extends Document {
  name: string;
  description?: string;
  instructions: string;
  tone: AgentTone;
  modelName: string;
  temperature: number;
  status: AgentStatus;
  organizationId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    instructions: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    tone: {
      type: String,
      enum: ["professional", "friendly", "casual", "formal"],
      default: "professional",
    },

    modelName: {
      type: String,
      required: true,
      default: "default",
    },

    temperature: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.3,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Agent = mongoose.model<IAgent>("Agent", agentSchema);
