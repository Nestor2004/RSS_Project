import mongoose, { Schema, Document } from "mongoose";

export interface IFeed extends Document {
  name: string;
  url: string;
  description?: string;
  active?: boolean;
  lastProcessed?: Date;
  lastFetched?: Date;
  status?: "active" | "error" | "inactive";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedSchema = new Schema<IFeed>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
    lastProcessed: { type: Date },
    lastFetched: { type: Date },
    status: {
      type: String,
      enum: ["active", "error", "inactive"],
      default: "active",
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

// Create indexes
FeedSchema.index({ active: 1 });

export const Feed =
  mongoose.models.Feed || mongoose.model<IFeed>("Feed", FeedSchema);
