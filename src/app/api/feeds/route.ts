import { NextRequest, NextResponse } from "next/server";
import { fetchRssFeed } from "@/lib/utils/rss-parser";
import connectToDatabase from "@/lib/db/mongodb";
import Feed from "@/lib/db/models/feed";
import Article from "@/lib/db/models/article";
import { getCollection } from "@/lib/db/chromadb";
import { ApiResponse } from "@/types";

// GET /api/feeds - get all feeds
export async function GET(): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const feeds = await Feed.find().sort({ updatedAt: -1 });

    const response: ApiResponse<typeof feeds> = {
      success: true,
      data: feeds,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching feeds:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to fetch feeds: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/feeds - add a new feed
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { url } = await req.json();

    if (!url) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Feed URL is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Fetch and parse the feed
    const rssFeed = await fetchRssFeed(url);

    // Connect to the database
    await connectToDatabase();

    // Check if feed already exists
    let feed = await Feed.findOne({ url });

    if (feed) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Feed already exists",
      };
      return NextResponse.json(response, { status: 409 });
    }

    // Create new feed
    feed = await Feed.create({
      url,
      title: rssFeed.title,
      description: rssFeed.description,
      lastFetched: new Date(),
    });

    // Process feed items
    const articlesToCreate = [];
    const documentsToEmbed = [];
    const metadataToEmbed = [];
    const idsToEmbed = [];

    for (const item of rssFeed.items) {
      const articleData = {
        feed: feed._id,
        title: item.title,
        description: item.description,
        content: item.content,
        link: item.link,
        guid: item.guid,
        pubDate: item.pubDate,
        author: item.author,
        categories: item.categories,
      };

      articlesToCreate.push(articleData);

      // Prepare for embedding
      const textToEmbed = `${item.title} ${item.description || ""} ${
        item.content || ""
      }`.trim();

      if (textToEmbed) {
        documentsToEmbed.push(textToEmbed);
        metadataToEmbed.push({
          title: item.title,
          link: item.link,
          pubDate:
            item.pubDate instanceof Date
              ? item.pubDate.toISOString()
              : item.pubDate,
          feedId: feed._id.toString(),
        });
        idsToEmbed.push(item.guid);
      }
    }

    // Save articles to MongoDB
    if (articlesToCreate.length > 0) {
      await Article.insertMany(articlesToCreate, { ordered: false });
    }

    // Process embeddings and save to ChromaDB
    if (documentsToEmbed.length > 0) {
      try {
        const collection = await getCollection("articles");
        await collection.add({
          ids: idsToEmbed,
          documents: documentsToEmbed,
          metadatas: metadataToEmbed,
        });

        // Update articles to mark as embedded
        for (const id of idsToEmbed) {
          await Article.findOneAndUpdate(
            { guid: id },
            { embeddings: true, vectorId: id }
          );
        }
      } catch (embeddingError) {
        console.error("Error creating embeddings:", embeddingError);
        // We continue even if embeddings fail
      }
    }

    const response: ApiResponse<typeof feed> = {
      success: true,
      data: feed,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error adding feed:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to add feed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
