import { IFeed } from "@/lib/db/models/feed";
import { IArticle } from "@/lib/db/models/article";

// RSS Feed types
export interface RSSFeed {
  title: string;
  description?: string;
  link: string;
  language?: string;
  lastBuildDate?: Date;
  publisher?: string;
  items: RSSItem[];
}

export interface RSSItem {
  title: string;
  description?: string;
  content?: string;
  contentSnippet?: string;
  link: string;
  guid: string;
  pubDate: Date;
  author?: string;
  categories?: string[];
  media?: {
    url?: string;
    type?: string;
  };
}

// RSS Parse result for multiple feeds
export interface RSSParseResult {
  successful: number;
  failed: number;
  feeds: RSSFeed[];
  errors: Record<string, string>;
}

// RSS Processing types
export interface ProcessingStats {
  startTime: Date;
  endTime?: Date;
  totalSources: number;
  processedSources: number;
  totalItems: number;
  newItems: number;
  duplicates: number;
  errors: number;
  vectorsGenerated: number;
  status: "idle" | "processing" | "completed" | "error";
  message?: string;
}

// Database models
export type Feed = IFeed;
export type Article = IArticle;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Search Types
export interface SearchResult {
  id: string;
  score: number;
  document: Article;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}
