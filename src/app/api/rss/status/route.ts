import { NextResponse } from "next/server";
import {
  getProcessingStatus,
  resetProcessingStats,
} from "@/lib/news-processor";
import { ApiResponse } from "@/types";

// GET /api/rss/status - get processing statistics
export async function GET(): Promise<NextResponse> {
  try {
    const stats = getProcessingStatus();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to get processing status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/rss/status - reset processing statistics
export async function DELETE(): Promise<NextResponse> {
  try {
    resetProcessingStats();

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Processing statistics reset" },
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to reset processing status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
