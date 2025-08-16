import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongodb";
import { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Import models
    const Article = require("@/lib/db/models/article").default;
    const Feed = require("@/models/Feed").Feed;

    // Get sources with article counts
    const sources = await Feed.aggregate([
      {
        $lookup: {
          from: "articles",
          localField: "_id",
          foreignField: "feed",
          as: "articles",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$title",
          count: { $size: "$articles" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get categories with counts
    const categories = await Article.aggregate([
      {
        $unwind: {
          path: "$categories",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const response: ApiResponse<{
      sources: typeof sources;
      categories: typeof categories;
    }> = {
      success: true,
      data: {
        sources,
        categories,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching statistics:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to fetch statistics: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
