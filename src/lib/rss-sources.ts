import connectToDatabase from "./db/mongodb";

// RSS Source interface
export interface RssSource {
  id?: string;
  name: string;
  url: string;
  description?: string;
  active?: boolean;
  lastProcessed?: Date;
  status?: "active" | "error" | "inactive";
  errorMessage?: string;
}

// Default RSS sources
const DEFAULT_SOURCES: RssSource[] = [
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    description: "AI news from TechCrunch",
    active: true,
  },
  {
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    description: "AI articles from MIT Technology Review",
    active: true,
  },
  {
    name: "MarktechPost",
    url: "https://www.marktechpost.com/feed/",
    description: "AI and technology news",
    active: true,
  },
];

/**
 * Get all RSS sources from the database
 * If no sources exist, initialize with default sources
 */
export async function getRssSources(): Promise<RssSource[]> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Import Feed model
    const { Feed } = require("../models/Feed");

    // Get all sources
    let sources = await Feed.find({ active: true }).lean();

    // If no sources, initialize with defaults
    if (sources.length === 0) {
      await initializeDefaultSources();
      sources = await Feed.find({ active: true }).lean();
    }

    return sources;
  } catch (error) {
    console.error("Error getting RSS sources:", error);
    return [];
  }
}

/**
 * Initialize default RSS sources
 */
async function initializeDefaultSources() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Import Feed model
    const { Feed } = require("../models/Feed");

    // Create default sources
    for (const source of DEFAULT_SOURCES) {
      const exists = await Feed.findOne({ url: source.url });

      if (!exists) {
        const feed = new Feed(source);
        await feed.save();
      }
    }
  } catch (error) {
    console.error("Error initializing default RSS sources:", error);
  }
}

/**
 * Add a new RSS source
 */
export async function addRssSource(source: RssSource): Promise<RssSource> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Import Feed model
    const { Feed } = require("../models/Feed");

    // Check if source already exists
    const exists = await Feed.findOne({ url: source.url });

    if (exists) {
      throw new Error("RSS source with this URL already exists");
    }

    // Create new source
    const feed = new Feed({
      ...source,
      active: source.active !== undefined ? source.active : true,
    });

    await feed.save();
    return feed.toObject();
  } catch (error) {
    console.error("Error adding RSS source:", error);
    throw error;
  }
}

/**
 * Update an existing RSS source
 */
export async function updateRssSource(
  id: string,
  updates: Partial<RssSource>
): Promise<RssSource> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Import Feed model
    const { Feed } = require("../models/Feed");

    // Find and update source
    const feed = await Feed.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!feed) {
      throw new Error("RSS source not found");
    }

    return feed.toObject();
  } catch (error) {
    console.error(`Error updating RSS source ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an RSS source
 */
export async function deleteRssSource(id: string): Promise<boolean> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Import Feed model
    const { Feed } = require("../models/Feed");

    // Delete source
    const result = await Feed.findByIdAndDelete(id);

    if (!result) {
      throw new Error("RSS source not found");
    }

    return true;
  } catch (error) {
    console.error(`Error deleting RSS source ${id}:`, error);
    throw error;
  }
}
