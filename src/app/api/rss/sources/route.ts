import { NextRequest, NextResponse } from "next/server";
import {
  getRssSources as getAllSources,
  addRssSource as addSource,
  updateRssSource as updateSource,
  deleteRssSource as deleteSource,
} from "@/lib/rss-sources";
import { ApiResponse } from "@/types";
import { Feed } from "@/models/Feed";

// GET /api/rss/sources - get all sources
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // If ID is provided, get a specific source
    if (id) {
      // Feed model is imported at the top
      const source = await Feed.findById(id).lean();

      if (!source) {
        const response: ApiResponse<null> = {
          success: false,
          error: "RSS source not found",
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse<typeof source> = {
        success: true,
        data: source,
      };
      return NextResponse.json(response);
    }

    // Otherwise, get all sources
    const sources = await getAllSources();

    const response: ApiResponse<typeof sources> = {
      success: true,
      data: sources,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to get RSS sources: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/rss/sources - add a new source
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    if (!body.name || !body.url) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Name and URL are required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const source = addSource({
      name: body.name,
      url: body.url,
      description: body.description || "",
      active: body.active !== undefined ? body.active : true,
    });

    const response: ApiResponse<typeof source> = {
      success: true,
      data: source,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to add RSS source: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/rss/sources - update a source
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    if (!body.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Source ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const updatedSource = await updateSource(body.id, {
      name: body.name,
      url: body.url,
      description: body.description,
      active: body.active,
    });

    if (!updatedSource) {
      const response: ApiResponse<null> = {
        success: false,
        error: "RSS source not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<typeof updatedSource> = {
      success: true,
      data: updatedSource,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to update RSS source: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/rss/sources - delete a source
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Source ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check for reset command
    if (id === "reset") {
      // Feed model is imported at the top

      // Delete all existing sources
      await Feed.deleteMany({});

      // Re-initialize default sources by calling getRssSources
      await getAllSources();

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: "RSS sources reset to defaults" },
      };

      return NextResponse.json(response);
    }

    const deleted = await deleteSource(id);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: "RSS source not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "RSS source deleted successfully" },
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: `Failed to delete RSS source: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
