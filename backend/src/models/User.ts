import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "owner" | "admin" | "agent" | "viewer";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "agent", "viewer"],
      default: "agent",
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
