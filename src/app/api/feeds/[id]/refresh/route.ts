import { NextRequest, NextResponse } from "next/server";
import { fetchRssFeed } from "@/lib/utils/rss-parser";
import connectToDatabase from "@/lib/db/mongodb";
import Feed from "@/lib/db/models/feed";
import Article from "@/lib/db/models/article";
import { getCollection } from "@/lib/db/chromadb";
import { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    // Connect to the database
    await connectToDatabase();

    // Find the feed
    const feed = await Feed.findById(id);

    if (!feed) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Feed not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Fetch and parse the feed
    const rssFeed = await fetchRssFeed(feed.url);

    // Process feed items
    const articlesToCreate = [];
    const documentsToEmbed = [];
    const metadataToEmbed = [];
    const idsToEmbed = [];
    let newArticles = 0;

    // Get existing article guids to avoid duplicates
    const existingGuids = new Set(
      (await Article.find({ feed: feed._id }, "guid")).map((a) => a.guid)
    );

    for (const item of rssFeed.items) {
      // Skip if article already exists
      if (existingGuids.has(item.guid)) {
        continue;
      }

      newArticles++;

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

    // Update feed last fetched time
    feed.lastFetched = new Date();
    await feed.save();

    // Save new articles to MongoDB
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

    const response: ApiResponse<{ feed: typeof feed; newArticles: number }> = {
      success: true,
      data: {
        feed,
        newArticles,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error refreshing feed:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to refresh feed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
