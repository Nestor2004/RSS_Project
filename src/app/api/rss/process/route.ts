import { NextRequest, NextResponse } from "next/server";
import { processAllFeeds } from "@/lib/news-processor";
import { ApiResponse, ProcessingStats } from "@/types";

// POST /api/rss/process - trigger news processing
export async function POST(): Promise<NextResponse> {
  try {
    // Process feeds asynchronously
    const processingPromise = processAllFeeds();

    // Return immediately with processing started message
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "RSS processing started" },
    };

    // Fire and forget - the processing will continue in the background
    processingPromise.catch((error) => {
      console.error("Background RSS processing failed:", error);
    });

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to start RSS processing: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
