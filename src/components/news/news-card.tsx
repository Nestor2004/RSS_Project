"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  searchScore?: number;
}

interface SimilarNewsResult {
  article: Article;
  score: number;
}

interface NewsCardProps {
  article: Article;
  searchScore?: number;
  priority?: boolean;
}

export function NewsCard({
  article,
  searchScore,
  priority = false,
}: NewsCardProps) {
  const [showSimilar, setShowSimilar] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarArticles, setSimilarArticles] = useState<SimilarNewsResult[]>(
    []
  );
  const [hasLoadedSimilar, setHasLoadedSimilar] = useState(false);

  // Format publication date
  const formattedDate = formatDistanceToNow(new Date(article.pubDate), {
    addSuffix: true,
    includeSeconds: false,
  });

  // Format description - limit to first 120 characters
  const shortDescription = article.description
    ? article.description.substring(0, 120) +
      (article.description.length > 120 ? "..." : "")
    : "";

  // Handle toggle similar news
  const handleToggleSimilar = async () => {
    setShowSimilar(!showSimilar);

    // Only fetch if we haven't loaded similar articles yet
    if (!hasLoadedSimilar && !showSimilar) {
      setLoadingSimilar(true);
      try {
        const response = await fetch(`/api/articles/similar/${article._id}`);
        const data = await response.json();

        if (data.success && data.data && data.data.results) {
          setSimilarArticles(data.data.results);
        }
      } catch (error) {
        console.error("Error fetching similar articles:", error);
      } finally {
        setLoadingSimilar(false);
        setHasLoadedSimilar(true);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: priority ? 0 : 0.1 }}
    >
      <Card className="card-hover overflow-hidden flex flex-col h-full group">
        <CardHeader className="p-4 pb-2 space-y-2">
          <div className="flex justify-between items-start gap-2">
            <Badge
              variant="outline"
              className="h-6 truncate max-w-[160px] bg-muted/50 hover:bg-muted transition-colors"
            >
              {article.feed.title ||
                new URL(article.feed.url).hostname.replace("www.", "")}
            </Badge>

            {searchScore !== undefined && (
              <Badge className="bg-green-600 hover:bg-green-700 transition-colors">
                {Math.round(searchScore * 100)}% Match
              </Badge>
            )}
          </div>

          <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
            <Link href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </Link>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {shortDescription}
          </p>

          {article.categories && article.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {article.categories.slice(0, 3).map((category, index) => (
                <span key={index} className="tag tag-primary text-xs">
                  {category}
                </span>
              ))}
              {article.categories.length > 3 && (
                <span className="tag text-xs bg-muted text-muted-foreground">
                  +{article.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
          <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 hover:bg-muted/80 transition-colors"
              onClick={handleToggleSimilar}
              disabled={loadingSimilar}
            >
              {loadingSimilar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : showSimilar ? (
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
              )}
              Similar
            </Button>
          </div>

          <Button
            asChild
            variant="default"
            className="w-full gap-2 bg-primary hover:bg-primary/90 transition-colors"
          >
            <Link href={article.link} target="_blank" rel="noopener noreferrer">
              Read Article <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>

        {/* Similar articles section */}
        {showSimilar && (
          <div className="px-4 pb-4">
            <div className="border-t pt-3 mt-2 space-y-4">
              <h3 className="text-sm font-medium">Similar Articles</h3>

              {loadingSimilar ? (
                <div className="space-y-3">
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
              ) : (
                <div className="space-y-3">
                  {similarArticles.length > 0 ? (
                    similarArticles.map((result) => (
                      <motion.div
                        key={result.article._id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-medium line-clamp-2">
                            <Link
                              href={result.article.link}
                              target="_blank"
                              className="hover:underline hover:text-primary transition-colors"
                            >
                              {result.article.title}
                            </Link>
                          </h4>
                          <Badge
                            className={cn(
                              "shrink-0",
                              result.score > 0.8
                                ? "bg-green-600"
                                : result.score > 0.6
                                ? "bg-blue-600"
                                : "bg-muted-foreground"
                            )}
                          >
                            {Math.round(result.score * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {result.article.description}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {result.article.feed.title ||
                              new URL(result.article.feed.url).hostname.replace(
                                "www.",
                                ""
                              )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(result.article.pubDate),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No similar articles found
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
