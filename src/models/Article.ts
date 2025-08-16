import mongoose, { Schema, Document } from "mongoose";
import { IFeed } from "./Feed";

export interface IArticle extends Document {
  feed: mongoose.Types.ObjectId | IFeed;
  title: string;
  description?: string;
  content?: string;
  link: string;
  guid: string;
  pubDate: Date;
  author?: string;
  categories?: string[];
  embeddings?: boolean;
  vectorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    feed: { type: Schema.Types.ObjectId, ref: "Feed", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    link: { type: String, required: true },
    guid: { type: String, required: true, unique: true },
    pubDate: { type: Date, required: true },
    author: { type: String },
    categories: [{ type: String }],
    embeddings: { type: Boolean, default: false },
    vectorId: { type: String },
  },
  { timestamps: true }
);

// Create indexes
ArticleSchema.index({ link: 1 });
ArticleSchema.index({ pubDate: -1 });
ArticleSchema.index({ vectorId: 1 });
// Compound index for feed and guid to ensure no duplicates
ArticleSchema.index({ feed: 1, guid: 1 }, { unique: true });

export const Article =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);
