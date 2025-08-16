import Parser from "rss-parser";

/**
 * Parse an RSS feed and return its contents
 *
 * @param url The URL of the RSS feed to parse
 * @returns The parsed feed data or null if there was an error
 */
export async function parseRSSFeed(url: string) {
  try {
    // Create a new parser instance
    const parser = new Parser({
      customFields: {
        item: [
          ["media:content", "media"],
          ["content:encoded", "content"],
          ["dc:creator", "creator"],
        ],
      },
    });

    // Parse the feed
    const feed = await parser.parseURL(url);
    return feed;
  } catch (error) {
    console.error(`Error parsing RSS feed from ${url}:`, error);
    return null;
  }
}
