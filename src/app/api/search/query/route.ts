import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db/chromadb";
import {
  VectorSearch,
  VectorSearchConfig,
  VectorSearchResult,
} from "@/lib/vector-search";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: "Search query is required",
          code: "MISSING_QUERY",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Parse search configuration
    const config: VectorSearchConfig = {
      minSimilarity: parseFloat(searchParams.get("minSimilarity") || "0.5"),
      maxResults: parseInt(searchParams.get("limit") || "10"),
      filters: {
        dateFrom: searchParams.get("dateFrom") || undefined,
        dateTo: searchParams.get("dateTo") || undefined,
        source: searchParams.get("source") || undefined,
        category: searchParams.get("category") || undefined,
      },
    };

    // Get ChromaDB collection
    const collection = await getCollection("articles");

    // Create vector search instance
    const vectorSearch = new VectorSearch(collection);

    // Perform search
    const results = await vectorSearch.searchByText(query, config);

    // Return results
    const response: ApiResponse<{
      results: VectorSearchResult[];
      query: string;
    }> = {
      success: true,
      data: {
        results,
        query,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in search query API:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during search",
        code: "SEARCH_ERROR",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { query, config = {} } = body;

    if (!query) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: "Search query is required",
          code: "MISSING_QUERY",
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get ChromaDB collection
    const collection = await getCollection("articles");

    // Create vector search instance
    const vectorSearch = new VectorSearch(collection);

    // Perform search
    const results = await vectorSearch.searchByText(query, config);

    // Return results
    const response: ApiResponse<{
      results: VectorSearchResult[];
      query: string;
    }> = {
      success: true,
      data: {
        results,
        query,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error in search query API:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during search",
        code: "SEARCH_ERROR",
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
