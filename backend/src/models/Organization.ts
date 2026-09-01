import mongoose, { Document, Schema } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  plan: "free" | "pro" | "business";
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    plan: {
      type: String,
      enum: ["free", "pro", "business"],
      default: "free",
    },
  },
  {
    timestamps: true,
  },
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema,
);
