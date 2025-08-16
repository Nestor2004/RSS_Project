import { NextRequest, NextResponse } from "next/server";

/**
 * This is a compatibility endpoint that redirects to the new articles/similar endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Extract the article ID from the URL
  const { id } = await params;

  // Build the new URL with all the same search parameters
  const newUrl = new URL(`/api/articles/similar/${id}`, request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    newUrl.searchParams.set(key, value);
  });

  // Redirect to the new endpoint
  return NextResponse.redirect(newUrl);
}
