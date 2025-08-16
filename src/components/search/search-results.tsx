"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
}

interface SearchResult {
  id: string;
  score: number;
  document: Article;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  onReset: () => void;
}

export function SearchResults({
  results,
  isLoading,
  query,
  onReset,
}: SearchResultsProps) {
  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Render empty state
  if (results.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-8 w-8" />}
        title="No results found"
        description={`We couldn't find any articles matching "${query}". Try a different search term or adjust your filters.`}
        action={{
          label: "Reset Search",
          onClick: onReset,
        }}
      />
    );
  }

  // Render results
  return (
    <AnimatePresence>
      <div className="space-y-6">
        {results.map((result, index) => (
          <SearchResultCard key={result.id} result={result} index={index} />
        ))}
      </div>
    </AnimatePresence>
  );
}

function SearchResultCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const { document: article, score } = result;
  const [expanded, setExpanded] = useState(false);

  // Format date
  const formattedDate = formatDistanceToNow(new Date(article.pubDate), {
    addSuffix: true,
  });

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.85) return "bg-green-500";
    if (score >= 0.7) return "bg-blue-500";
    if (score >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get text color based on score
  const getScoreTextColor = (score: number) => {
    if (score >= 0.85) return "text-green-600 dark:text-green-400";
    if (score >= 0.7) return "text-blue-600 dark:text-blue-400";
    if (score >= 0.5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2 mb-2">
            <Badge variant="outline" className="h-6">
              {article.feed.title}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {formattedDate}
              </div>
              <Badge className={cn(getScoreTextColor(score), "bg-muted")}>
                {Math.round(score * 100)}% Match
              </Badge>
            </div>
          </div>
          <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
            <Link href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </Link>
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-0">
          {/* Similarity score visualization */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Similarity Score</span>
              <span className={cn("font-semibold", getScoreTextColor(score))}>
                {Math.round(score * 100)}%
              </span>
            </div>
            <Progress
              value={score * 100}
              className="h-2"
              indicatorClassName={getScoreColor(score)}
            />
          </div>

          {/* Description */}
          <div className="text-sm text-muted-foreground">
            {expanded ? (
              article.description
            ) : (
              <>
                {article.description.length > 200
                  ? `${article.description.substring(0, 200)}...`
                  : article.description}
              </>
            )}
          </div>

          {/* Categories */}
          {article.categories && article.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {article.categories.map((category, i) => (
                <span key={i} className="tag tag-primary text-xs">
                  {category}
                </span>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4 pb-4">
          {/* Show more/less button */}
          {article.description.length > 200 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs"
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          )}

          {/* Read article button */}
          <Button asChild size="sm" className="gap-1.5">
            <Link href={article.link} target="_blank" rel="noopener noreferrer">
              Read Article
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function SearchResultSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-3/4 mt-1" />
      </CardHeader>

      <CardContent className="pb-0">
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="flex gap-1.5 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-4 pb-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}
