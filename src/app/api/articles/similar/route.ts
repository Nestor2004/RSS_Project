import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongodb";
import { getCollection } from "@/lib/db/chromadb";
import { Article } from "@/models/Article";
import { ApiResponse } from "@/types";
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");
    const vectorId = searchParams.get("vectorId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 20);
    const minSimilarity = parseFloat(
      searchParams.get("minSimilarity") || "0.5"
    );
    if (!articleId || !vectorId) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Article ID and vector ID are required",
      };
      return NextResponse.json(response, { status: 400 });
    }
    const collection = await getCollection("articles");
    const vectorResult = await collection.get({
      ids: [vectorId],
      include: ["embeddings", "metadatas"],
    });

    if (
      !vectorResult ||
      !vectorResult.embeddings ||
      vectorResult.embeddings.length === 0 ||
      !vectorResult.embeddings[0]
    ) {
      console.error("Vector not found or empty:", vectorResult);
      throw new Error(`Vector not found for ID: ${vectorId}`);
    }
    const searchResults = await collection.query({
      queryEmbeddings: [vectorResult.embeddings[0]],
      nResults: Math.min(limit * 2, 50),
      include: ["metadatas", "distances"],
      where: {},
    });

    if (!searchResults || !searchResults.ids || !searchResults.ids[0]) {
      const emptyResponse: ApiResponse<{ results: []; totalFound: number }> = {
        success: true,
        data: {
          results: [],
          totalFound: 0,
        },
      };
      return NextResponse.json(emptyResponse);
    }
    const ids = searchResults.ids[0];
    const distances = searchResults.distances ? searchResults.distances[0] : [];
    const metadatas = searchResults.metadatas ? searchResults.metadatas[0] : [];

    await connectToDatabase();

    const candidateResults = ids
      .map((id: string, index: number) => {
        if (id === vectorId) return null;

        const distance = distances[index] || 1;
        const similarity = 1 - distance;
        if (similarity < minSimilarity) return null;
        return {
          vectorId: id,
          similarity,
          distance,
          metadata: metadatas[index] || {},
        };
      })
      .filter(Boolean)
      .slice(0, limit * 2);

    if (candidateResults.length === 0) {
      const emptyResponse: ApiResponse<{ results: []; totalFound: number }> = {
        success: true,
        data: {
          results: [],
          totalFound: 0,
        },
      };
      return NextResponse.json(emptyResponse);
    }

    // Fetch full article data from MongoDB
    const vectorIds = candidateResults.map((r) => r?.vectorId).filter(Boolean);

    const articles = await Article.find({
      vectorId: { $in: vectorIds },
    })
      .populate("feed", "name url")
      .lean();

    const results = candidateResults
      .map((candidate) => {
        if (!candidate) return null;

        const article = articles.find((a) => a.vectorId === candidate.vectorId);
        if (!article) {
          console.warn(
            `Article not found in MongoDB for vectorId: ${candidate.vectorId}`
          );
          return null;
        }

        return {
          article: {
            _id: article._id,
            title: article.title,
            url: article.url,
            publishDate: article.publishDate,
            summary: article.summary?.substring(0, 200),
            feed: article.feed,
            vectorId: article.vectorId,
          },
          similarity: Number(candidate.similarity.toFixed(4)),
          distance: Number(candidate.distance.toFixed(4)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.similarity || 0) - (a?.similarity || 0))
      .slice(0, limit);
    const response: ApiResponse<{
      results: typeof results;
      totalFound: number;
      query: {
        articleId: string;
        vectorId: string;
        limit: number;
        minSimilarity: number;
      };
    }> = {
      success: true,
      data: {
        results,
        totalFound: candidateResults.length,
        query: {
          articleId,
          vectorId,
          limit,
          minSimilarity,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error finding similar articles:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to find similar articles: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
