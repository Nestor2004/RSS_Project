"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Article type
interface Article {
  _id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  guid: string;
  pubDate: string;
  author?: string;
  feed: {
    _id: string;
    title: string;
    url: string;
  };
  categories?: string[];
  vectorId?: string;
}

// Similar news result type
interface SimilarNewsResult {
  article: Article;
  score: number;
}

export function SimilarNews({
  articleId,
  vectorId,
}: {
  articleId: string;
  vectorId: string;
}) {
  const [similarArticles, setSimilarArticles] = useState<SimilarNewsResult[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarArticles = async () => {
      try {
        setIsLoading(true);

        // Fetch similar articles from API
        const response = await fetch(
          `/api/articles/similar/${articleId}?limit=5`
        );
        const data = await response.json();

        if (data.success && data.data && data.data.results) {
          // Use the correct response format
          const similarResults: SimilarNewsResult[] = data.data.results;

          setSimilarArticles(similarResults);
        } else {
          setSimilarArticles([]);
        }
      } catch (error) {
        console.error("Error fetching similar articles:", error);
        setSimilarArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarArticles();
  }, [articleId, vectorId]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Similar Articles</h3>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-t pt-3 mt-2 space-y-4">
      <h3 className="text-sm font-medium">Similar Articles</h3>

      <div className="space-y-4">
        {similarArticles.length > 0 ? (
          similarArticles.map((result) => (
            <div
              key={result.article._id}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-medium line-clamp-2">
                  <Link
                    href={result.article?.link || "#"}
                    target="_blank"
                    className="hover:underline"
                  >
                    {result.article?.title || "Untitled Article"}
                  </Link>
                </h4>
                <Badge className="shrink-0">
                  {Math.round(result.score * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                {result.article?.description || "No description available"}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {result.article.feed?.title ||
                    (result.article.feed?.url
                      ? new URL(result.article.feed.url).hostname.replace(
                          "www.",
                          ""
                        )
                      : "Unknown Source")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {result.article?.pubDate
                    ? new Date(result.article.pubDate).toLocaleDateString()
                    : "Unknown date"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No similar articles found
          </p>
        )}
      </div>
    </div>
  );
}
