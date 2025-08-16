import Parser from "rss-parser";
import { RSSFeed, RSSItem, RSSParseResult } from "@/types";

// Extended interface for RSS items with additional fields from the parser
interface ExtendedRSSItem {
  title: string;
  description?: string;
  content?: string;
  "content:encoded"?: string;
  contentSnippet?: string;
  link: string;
  guid: string;
  pubDate?: string;
  creator?: string;
  author?: string;
  dcCreator?: string;
  dcDate?: string;
  published?: string;
  isoDate?: string;
  categories?: string[];
  enclosure?: {
    url?: string;
    type?: string;
  };
}

// Configure the parser with the most essential custom fields
// Using a simpler configuration to avoid TypeScript errors
const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "content"],
      ["dc:creator", "dcCreator"],
    ],
  },
  timeout: 10000, // 10 seconds timeout
  headers: {
    "User-Agent": "RSS Reader/1.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

/**
 * Extract text content from HTML
 */
function stripHtml(html: string): string {
  return html
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes publication date from various formats
 */
function normalizeDate(date: string | undefined): Date {
  if (!date) return new Date();

  try {
    return new Date(date);
  } catch {
    return new Date();
  }
}

/**
 * Fetches and parses an RSS feed from a URL
 */
export async function fetchRssFeed(url: string): Promise<RSSFeed> {
  try {
    const feed = await parser.parseURL(url);

    const items: RSSItem[] = feed.items.map((item) => {
      // Cast to our extended interface that includes additional RSS fields
      const typedItem = item as ExtendedRSSItem;

      // Extract all possible content fields
      const contentRaw =
        typedItem.content ||
        typedItem["content:encoded"] ||
        typedItem.description ||
        "";

      // Get creator/author from all possible fields
      const author =
        typedItem.creator ||
        typedItem.author ||
        typedItem.dcCreator ||
        (feed as unknown as { creator?: string }).creator ||
        "";

      // Get publish date from all possible fields
      const pubDateRaw =
        typedItem.pubDate ||
        typedItem.dcDate ||
        typedItem.published ||
        typedItem.isoDate ||
        "";

      // Create the normalized item
      return {
        title: typedItem.title || "Untitled",
        description: typedItem.description
          ? stripHtml(typedItem.description)
          : "",
        content: contentRaw,
        contentSnippet: stripHtml(contentRaw).substring(0, 300),
        link: typedItem.link || "",
        guid: typedItem.guid || typedItem.link || "",
        pubDate: normalizeDate(pubDateRaw),
        author,
        categories: typedItem.categories || [],
        media: typedItem.enclosure,
      };
    });

    return {
      title: feed.title || "Unknown Feed",
      description: feed.description || "",
      link: feed.link || url,
      language: feed.language || "en",
      lastBuildDate: feed.lastBuildDate
        ? normalizeDate(feed.lastBuildDate)
        : new Date(),
      publisher: feed.publisher || feed.webMaster || "",
      items,
    };
  } catch (error) {
    console.error("Error fetching or parsing RSS feed:", error);
    throw new Error(
      `Failed to fetch or parse RSS feed (${url}): ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetches multiple RSS feeds and combines the results
 */
export async function fetchMultipleFeeds(
  urls: string[]
): Promise<RSSParseResult> {
  const results = {
    successful: 0,
    failed: 0,
    feeds: [] as RSSFeed[],
    errors: {} as Record<string, string>,
  };

  await Promise.all(
    urls.map(async (url) => {
      try {
        const feed = await fetchRssFeed(url);
        results.feeds.push(feed);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors[url] =
          error instanceof Error ? error.message : "Unknown error";
      }
    })
  );

  return results;
}
