"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart4,
  Loader2,
} from "lucide-react";
import { SimilarNews } from "@/components/news/similar-news";
import { SearchBar } from "@/components/search/search-bar";
import { NewsFilters } from "@/components/news/news-filters";
import { Pagination } from "@/components/news/pagination";

// Define article type
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

// Define search result type
interface SearchResult {
  id: string;
  score: number;
  document: Article;
}

/**
 * News Card Component
 */
function NewsCard({
  article,
  searchScore,
}: {
  article: Article;
  searchScore?: number;
}) {
  const [showSimilar, setShowSimilar] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Format publication date
  const formattedDate = article?.pubDate
    ? new Date(article.pubDate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";

  // Format description - limit to first 120 characters
  const shortDescription = article?.description
    ? article.description.substring(0, 120) +
      (article.description.length > 120 ? "..." : "")
    : "";

  // Handle toggle similar news
  const handleToggleSimilar = () => {
    if (!showSimilar && !article.vectorId) {
      // If we don't have vector ID, don't show similar news
      return;
    }

    setShowSimilar(!showSimilar);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <Badge variant="outline" className="h-6 truncate max-w-[160px]">
            {article.feed?.title ||
              (article.feed?.url
                ? new URL(article.feed.url).hostname.replace("www.", "")
                : "Unknown Source")}
          </Badge>
          {searchScore !== undefined && (
            <Badge className="bg-green-600">
              {Math.round(searchScore * 100)}% Match
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 mt-2 text-lg">
          {article?.title || "Untitled Article"}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow">
        <CardDescription className="line-clamp-3 text-sm">
          {shortDescription}
        </CardDescription>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-2 pb-4">
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
          {article.vectorId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleToggleSimilar}
              disabled={loadingSimilar && !showSimilar}
            >
              {loadingSimilar ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : showSimilar ? (
                <ChevronUp className="h-3 w-3 mr-1" />
              ) : (
                <ChevronDown className="h-3 w-3 mr-1" />
              )}
              Similar
            </Button>
          )}
        </div>

        <Button asChild className="w-full gap-2">
          <Link
            href={article?.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read Article <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>

      {/* Similar articles section */}
      {showSimilar && (
        <div className="px-4 pb-4">
          <SimilarNews articleId={article._id} vectorId={article.vectorId!} />
        </div>
      )}
    </Card>
  );
}

/**
 * News Page Component
 */
export default function NewsPage() {
  // States
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search params
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "12");
  const searchQuery = searchParams.get("q") || "";
  const source = searchParams.get("source") || "";

  // Fetch real articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("pageSize", pageSize.toString());

        if (source) params.set("source", source);
        if (searchParams.get("dateFrom"))
          params.set("dateFrom", searchParams.get("dateFrom")!);
        if (searchParams.get("dateTo"))
          params.set("dateTo", searchParams.get("dateTo")!);

        // If search query exists, use search API
        if (searchQuery) {
          setIsSearching(true);
          params.set("q", searchQuery);
          params.set("minSimilarity", "0.5");

          const response = await fetch(`/api/search/query?${params}`);
          const data = await response.json();

          if (data.success && data.data) {
            setSearchResults(data.data.results);
            setTotalItems(data.data.total);
            setTotalPages(Math.ceil(data.data.total / pageSize));
          } else {
            setSearchResults([]);
            setTotalItems(0);
            setTotalPages(1);
          }
        } else {
          // Otherwise use articles API
          setIsSearching(false);

          const response = await fetch(`/api/articles?${params}`);
          const data = await response.json();

          if (data.success && data.data) {
            setArticles(data.data.articles);
            setTotalItems(data.data.total);
            setTotalPages(Math.ceil(data.data.total / pageSize));
          } else {
            setArticles([]);
            setTotalItems(0);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
        setArticles([]);
        setSearchResults([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [searchQuery, source, page, pageSize, searchParams]);

  // Handle refresh - fetch fresh data
  const handleRefresh = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/news${query}`);
  };

  // Articles to display (either search results or regular articles)
  const displayedArticles = useMemo(() => {
    if (isSearching) {
      return searchResults.map((result) => ({
        ...result.document,
        searchScore: result.score,
      }));
    } else {
      return articles;
    }
  }, [articles, searchResults, isSearching]);

  // Render skeleton loaders during initial load
  const renderSkeletons = () => {
    return Array(pageSize)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[180px] w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6 mb-6">
        <SearchBar
          initialQuery={searchQuery}
          onSearch={(query) => {
            const current = new URLSearchParams(
              Array.from(searchParams.entries())
            );
            if (query) {
              current.set("q", query);
            } else {
              current.delete("q");
            }
            current.delete("page"); // Reset to page 1 on new search
            const search = current.toString();
            const queryString = search ? `?${search}` : "";
            router.push(`/news${queryString}`);
          }}
        />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : "Latest News"}
            </h1>
            <p className="text-muted-foreground">{totalItems} articles found</p>
          </div>

          <div className="flex items-center gap-2">
            <NewsFilters />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          renderSkeletons()
        ) : displayedArticles.length > 0 ? (
          displayedArticles.map((article) => (
            <NewsCard
              key={article._id}
              article={article}
              searchScore={article.searchScore}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <h2 className="text-xl font-semibold mb-2">No articles found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            isSearching={isSearching}
            searchQuery={searchQuery}
          />
        </div>
      )}

      {/* Vector Search Info Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="fixed bottom-4 right-4 z-50 gap-2"
          >
            <BarChart4 className="h-4 w-4" />
            About Vector Search
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Vector Search Technology</DialogTitle>
            <DialogDescription>
              How our semantic search works behind the scenes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              This news application uses vector embeddings to provide semantic
              search capabilities:
            </p>

            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <span className="font-medium">Embedding Generation:</span> When
                articles are processed, their text content is converted into
                vector embeddings using @xenova/transformers.
              </li>
              <li>
                <span className="font-medium">Vector Database:</span> These
                embeddings are stored in ChromaDB, a vector database optimized
                for similarity search.
              </li>
              <li>
                <span className="font-medium">Semantic Search:</span> When you
                search, your query is also converted to a vector and ChromaDB
                finds the most similar article vectors.
              </li>
              <li>
                <span className="font-medium">Similarity Scores:</span> The
                percentage match indicates how semantically similar an article
                is to your search query.
              </li>
              <li>
                <span className="font-medium">Similar Articles:</span> The
                "Similar" feature uses the same technology to find articles with
                related content.
              </li>
            </ol>

            <p className="text-sm mt-4">
              This allows you to find articles based on meaning rather than just
              keywords, enabling more intelligent and relevant search results.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
