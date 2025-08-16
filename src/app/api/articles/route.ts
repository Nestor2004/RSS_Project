import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongodb";
import { Article } from "@/models/Article";
import { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");
    const source = searchParams.get("source") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Connect to database
    await connectToDatabase();

    // Build query
    const query: Record<string, unknown> = {};

    // Add source filter if provided
    if (source) {
      query["feed._id"] = source;
    }

    // Add date filters if provided
    if (dateFrom || dateTo) {
      query.pubDate = {};
      if (dateFrom) {
        (query.pubDate as Record<string, unknown>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (query.pubDate as Record<string, unknown>).$lte = new Date(dateTo);
      }
    }

    // Get total count
    const total = await Article.countDocuments(query);

    // Get articles for current page
    const articles = await Article.find(query)
      .sort({ pubDate: -1 }) // Sort by date, newest first
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("feed"); // Include feed information

    const response: ApiResponse<{
      articles: typeof articles;
      total: number;
      page: number;
      pageSize: number;
    }> = {
      success: true,
      data: {
        articles,
        total,
        page,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching articles:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to fetch articles: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
