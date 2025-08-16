import { parseRSSFeed } from "./rss-parser";
import { getRssSources, RssSource } from "./rss-sources";
import connectToDatabase from "./db/mongodb";
import { getCollection } from "./db/chromadb";
import { Article } from "../models/Article";
import { Feed, IFeed } from "../models/Feed";
import { VectorSearch } from "./vector-search";
import mongoose from "mongoose";

// Processing statistics
export interface ProcessingStats {
  status: "idle" | "processing" | "completed" | "error";
  startTime?: string;
  endTime?: string;
  totalSources: number;
  processedSources: number;
  totalItems: number;
  newItems: number;
  duplicates: number;
  errors: number;
  vectorsGenerated: number;
  message?: string;
}

// Global stats object
let processingStats: ProcessingStats = {
  status: "idle",
  totalSources: 0,
  processedSources: 0,
  totalItems: 0,
  newItems: 0,
  duplicates: 0,
  errors: 0,
  vectorsGenerated: 0,
};

/**
 * Process all RSS feeds
 */
export async function processAllFeeds(): Promise<ProcessingStats> {
  // Reset stats
  processingStats = {
    status: "processing",
    startTime: new Date().toISOString(),
    totalSources: 0,
    processedSources: 0,
    totalItems: 0,
    newItems: 0,
    duplicates: 0,
    errors: 0,
    vectorsGenerated: 0,
  };

  try {
    const sources = await getRssSources();
    processingStats.totalSources = sources.length;

    // Connect to MongoDB
    await connectToDatabase();

    // Get ChromaDB collection
    const collection = await getCollection("articles");

    // Create vector search instance
    const vectorSearch = new VectorSearch(collection);

    // Process each source
    for (const source of sources) {
      try {
        // Parse the feed
        const feedData = await parseRSSFeed(source.url);

        if (!feedData || !feedData.items) {
          throw new Error(`Failed to parse feed: ${source.url}`);
        }

        // Find or create feed in database
        const feedRecord = await findOrCreateFeed(source);

        // Process each item in the feed
        for (const item of feedData.items) {
          processingStats.totalItems++;

          try {
            // Prepare article data
            const articleData = {
              title: item.title || "",
              description: item.contentSnippet || "",
              content: (item.content as string) || "",
              link: item.link || "",
              guid: item.guid || item.link || "",
              pubDate: new Date(item.isoDate || new Date().toISOString()),
              author: (item.creator as string) || "",
              categories: item.categories || [],
              feed: feedRecord._id as mongoose.Types.ObjectId,
            };

            // Check for duplicates
            const duplicateCheck = await vectorSearch.checkDuplicate(
              articleData
            );

            if (duplicateCheck.isDuplicate) {
              processingStats.duplicates++;
              continue;
            }

            try {
              // Generate embedding
              const contentText =
                `${articleData.title} ${articleData.description}`.trim();
              const embedding = await vectorSearch.generateEmbedding(
                contentText
              );

              // Add to ChromaDB
              const vectorId = `article-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)}`;
              await collection.add({
                ids: [vectorId],
                embeddings: [embedding],
                metadatas: [
                  {
                    title: articleData.title || "",
                    source: source.name || "unknown",
                    pubDate: articleData.pubDate.toISOString(),
                    link: articleData.link,
                  },
                ],
                documents: [contentText],
              });

              // Create article in MongoDB
              const article = new Article({
                ...articleData,
                vectorId,
              });

              await article.save();

              processingStats.newItems++;
              processingStats.vectorsGenerated++;
            } catch (embeddingError) {
              console.error(`Error generating embedding: ${embeddingError}`);

              // Try to save the article without vector ID
              try {
                const article = new Article({
                  ...articleData,
                  // No vectorId
                });

                await article.save();
                processingStats.newItems++;
              } catch (saveError) {
                console.error(`Failed to save article: ${saveError}`);
                processingStats.errors++;
              }
            }
          } catch (error) {
            console.error(`Error processing item: ${error}`);
            processingStats.errors++;
          }
        }

        processingStats.processedSources++;
      } catch (error) {
        console.error(`Error processing source ${source.url}: ${error}`);
        processingStats.errors++;
        processingStats.processedSources++;
      }
    }

    // Update stats
    processingStats.status = "completed";
    processingStats.endTime = new Date().toISOString();

    return processingStats;
  } catch (error) {
    console.error("Error in RSS processing:", error);

    processingStats.status = "error";
    processingStats.endTime = new Date().toISOString();
    processingStats.message =
      error instanceof Error ? error.message : "Unknown error";

    return processingStats;
  }
}

/**
 * Find or create feed in database
 */
async function findOrCreateFeed(source: RssSource): Promise<IFeed> {
  // Connect to MongoDB
  await connectToDatabase();

  // Feed model is imported at the top

  // Find existing feed
  let feed = await Feed.findOne({ url: source.url });

  // Create if not exists
  if (!feed) {
    feed = new Feed({
      title: source.name,
      url: source.url,
      description: source.description || "",
      active: true,
    });

    await feed.save();
  }

  return feed;
}

/**
 * Get current processing status
 */
export function getProcessingStatus(): ProcessingStats {
  return processingStats;
}

/**
 * Reset processing statistics
 */
export function resetProcessingStats(): void {
  processingStats = {
    status: "idle",
    totalSources: 0,
    processedSources: 0,
    totalItems: 0,
    newItems: 0,
    duplicates: 0,
    errors: 0,
    vectorsGenerated: 0,
  };
}
