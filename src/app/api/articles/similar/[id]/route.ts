import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongodb";
import { getCollection } from "@/lib/db/chromadb";
import { Article } from "@/models/Article";
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const id = (await params).id;

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "5");

  try {
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Article ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Find the article to get its vectorId
    const article = await Article.findById(id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // If article has no vectorId, we can't find similar articles
    if (!article.vectorId) {
      return NextResponse.json(
        { success: false, error: "Article has no vector embedding" },
        { status: 400 }
      );
    }

    // Get ChromaDB collection
    const collection = await getCollection("articles");

    // First, get the vector for the specified article
    const vectorResult = await collection.get({
      ids: [article.vectorId],
      include: ["embeddings"],
    });

    if (
      !vectorResult ||
      !vectorResult.embeddings ||
      vectorResult.embeddings.length === 0
    ) {
      throw new Error(`Vector not found for article: ${id}`);
    }

    // Use the embedding to find similar articles
    const searchResults = await collection.query({
      queryEmbeddings: [vectorResult.embeddings[0]],
      nResults: limit + 1, // Add 1 to account for the article itself
      include: ["metadatas", "distances"],
    });

    if (!searchResults || !searchResults.ids || !searchResults.ids.length) {
      return NextResponse.json({
        success: true,
        data: { results: [] },
      });
    }

    // Get the IDs and distances from the results
    const ids = searchResults.ids[0];
    const distances = searchResults.distances ? searchResults.distances[0] : [];

    // Filter out the current article and fetch details for similar articles
    const filteredIds = ids.filter((id) => id !== article.vectorId);
    const filteredDistances = distances.filter(
      (_, i) => ids[i] !== article.vectorId
    );

    // Fetch full article data from MongoDB
    const articles = await Article.find({
      vectorId: { $in: filteredIds },
    }).populate("feed");

    // Match articles with their similarity scores
    const results = filteredIds
      .map((id: string, index: number) => {
        const similarArticle = articles.find((a) => a.vectorId === id);

        if (!similarArticle) return null;

        // Make sure we have a valid distance value
        const distance = filteredDistances[index] || 0;

        return {
          article: similarArticle,
          score: 1 - distance, // Convert distance to similarity score
        };
      })
      .filter(
        (result): result is { article: any; score: number } => result !== null
      )
      .slice(0, limit); // Limit to requested number

    return NextResponse.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    console.error("Error finding similar articles:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to find similar articles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
