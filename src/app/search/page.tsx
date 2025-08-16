"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Search as SearchIcon, History, Trash2 } from "lucide-react";
import { AdvancedSearchForm } from "@/components/search/advanced-search-form";
import { SearchResults } from "@/components/search/search-results";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { SearchResult as ApiSearchResult } from "@/types";

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  filters?: Record<string, unknown>;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [results, setResults] = useState<ApiSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("results");

  // Get current query and filters from URL
  const query = searchParams.get("q") || "";
  const source = searchParams.get("source") || "";
  const category = searchParams.get("category") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const minSimilarity = parseFloat(searchParams.get("minSimilarity") || "0.5");

  // Load search history from localStorage
  useEffect(() => {
    const storedHistory = localStorage.getItem("searchHistory");
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        setSearchHistory(parsedHistory);
      } catch (error) {
        console.error("Failed to parse search history:", error);
      }
    }
  }, []);

  // Perform search when query or filters change
  useEffect(() => {
    if (query) {
      performSearch(query, {
        source,
        category,
        dateFrom,
        dateTo,
        minSimilarity,
      });
    }
  }, [query, source, category, dateFrom, dateTo, minSimilarity]);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string, filters: Record<string, unknown> = {}) => {
      if (!searchQuery.trim()) return;

      setIsLoading(true);
      setActiveTab("results");

      try {
        // Build URL parameters
        const params = new URLSearchParams();
        params.set("q", searchQuery);

        if (filters.source) params.set("source", filters.source as string);
        if (filters.category)
          params.set("category", filters.category as string);
        if (filters.dateFrom)
          params.set("dateFrom", filters.dateFrom as string);
        if (filters.dateTo) params.set("dateTo", filters.dateTo as string);
        if (filters.minSimilarity)
          params.set("minSimilarity", filters.minSimilarity.toString());

        // Update URL
        router.push(`/search?${params.toString()}`);

        // Make API request
        const response = await fetch(`/api/search/query?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setResults(data.data.results);

          // Add to search history
          const historyItem: SearchHistoryItem = {
            id: Date.now().toString(),
            query: searchQuery,
            timestamp: new Date().toISOString(),
            resultCount: data.data.results.length,
            filters: filters,
          };

          const updatedHistory = [historyItem, ...searchHistory.slice(0, 9)];
          setSearchHistory(updatedHistory);
          localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
        } else {
          toast({
            title: "Search Error",
            description: data.error?.message || "Failed to perform search",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error performing search:", error);
        toast({
          title: "Search Error",
          description: "An unexpected error occurred while searching",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setActiveTab, setResults, setSearchHistory, router, toast]
  );

  // Handle search from form
  const handleSearch = (
    searchQuery: string,
    filters: Record<string, unknown> = {}
  ) => {
    performSearch(searchQuery, filters);
  };

  // Reset search
  const resetSearch = () => {
    router.push("/search");
    setResults([]);
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
    toast({
      title: "Search History Cleared",
      description: "Your search history has been cleared",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SearchIcon className="h-8 w-8" />
            Vector Search
          </h1>
          <p className="text-muted-foreground mt-2">
            Search articles using semantic vector similarity to find content
            based on meaning rather than just keywords.
          </p>
        </div>

        {/* Search form */}
        <AdvancedSearchForm onSearch={handleSearch} isSearching={isLoading} />

        {/* Search info */}
        {query && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-semibold">
                Results for &quot;{query}&quot;
              </h2>
              <p className="text-sm text-muted-foreground">
                Found {results.length} articles with vector similarity
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {source && (
                <Badge variant="outline" className="h-7">
                  Source: {source}
                </Badge>
              )}
              {category && (
                <Badge variant="outline" className="h-7">
                  Category: {category}
                </Badge>
              )}
              {dateFrom && (
                <Badge variant="outline" className="h-7">
                  From: {dateFrom}
                </Badge>
              )}
              {dateTo && (
                <Badge variant="outline" className="h-7">
                  To: {dateTo}
                </Badge>
              )}
              {minSimilarity !== 0.5 && (
                <Badge variant="outline" className="h-7">
                  Min Similarity: {Math.round(minSimilarity * 100)}%
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results and history tabs */}
        {(query || searchHistory.length > 0) && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="results" disabled={!query}>
                Search Results
              </TabsTrigger>
              <TabsTrigger
                value="history"
                disabled={searchHistory.length === 0}
              >
                Search History
                <Badge variant="secondary" className="ml-2">
                  {searchHistory.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="visualization"
                disabled={!query || results.length === 0}
              >
                Visualization
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="results">
                {query ? (
                  <SearchResults
                    results={results.map((r) => ({
                      id: r.id,
                      score: r.score,
                      document: {
                        _id: r.document._id as string,
                        title: r.document.title || "",
                        description: r.document.description || "",
                        content: r.document.content || "",
                        link: r.document.link || "",
                        guid: r.document.guid || "",
                        pubDate: r.document.pubDate?.toString() || "",
                        author: r.document.author || "",
                        feed: {
                          _id:
                            (r.document.feed as unknown as { _id: string })
                              ._id || "",
                          title:
                            (r.document.feed as unknown as { title: string })
                              .title || "",
                          url:
                            (r.document.feed as unknown as { url: string })
                              .url || "",
                        },
                        categories: r.document.categories || [],
                      },
                    }))}
                    isLoading={isLoading}
                    query={query}
                    onReset={resetSearch}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Active Search</CardTitle>
                      <CardDescription>
                        Enter a search query to find articles using vector
                        similarity
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Search History</CardTitle>
                      <CardDescription>
                        Your recent searches with vector similarity
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSearchHistory}
                      disabled={searchHistory.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear History
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {searchHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No search history yet
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {searchHistory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <p className="font-medium truncate">
                                {item.query}
                              </p>
                              <div className="flex gap-2 flex-wrap mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.resultCount} results
                                </span>
                                {typeof item.filters?.source === "string" && (
                                  <span className="text-xs bg-muted px-1.5 rounded">
                                    Source: {item.filters.source}
                                  </span>
                                )}
                                {typeof item.filters?.category === "string" && (
                                  <span className="text-xs bg-muted px-1.5 rounded">
                                    Category: {item.filters.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Use history item directly instead of calling the hook
                                performSearch(item.query, item.filters);
                              }}
                            >
                              <History className="h-4 w-4 mr-1" />
                              Search Again
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualization">
                <Card>
                  <CardHeader>
                    <CardTitle>Similarity Visualization</CardTitle>
                    <CardDescription>
                      Visual representation of search results similarity scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {results.length > 0 ? (
                      <div className="space-y-6">
                        {/* Distribution chart */}
                        <div>
                          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Similarity Distribution
                          </h3>
                          <div className="h-60 flex items-end gap-2">
                            {/* Generate bars for similarity ranges */}
                            {[
                              {
                                range: "90-100%",
                                color: "bg-green-500",
                                count: results.filter((r) => r.score >= 0.9)
                                  .length,
                              },
                              {
                                range: "80-89%",
                                color: "bg-green-400",
                                count: results.filter(
                                  (r) => r.score >= 0.8 && r.score < 0.9
                                ).length,
                              },
                              {
                                range: "70-79%",
                                color: "bg-blue-500",
                                count: results.filter(
                                  (r) => r.score >= 0.7 && r.score < 0.8
                                ).length,
                              },
                              {
                                range: "60-69%",
                                color: "bg-blue-400",
                                count: results.filter(
                                  (r) => r.score >= 0.6 && r.score < 0.7
                                ).length,
                              },
                              {
                                range: "50-59%",
                                color: "bg-amber-500",
                                count: results.filter(
                                  (r) => r.score >= 0.5 && r.score < 0.6
                                ).length,
                              },
                              {
                                range: "<50%",
                                color: "bg-red-500",
                                count: results.filter((r) => r.score < 0.5)
                                  .length,
                              },
                            ].map((bar) => (
                              <div
                                key={bar.range}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div
                                  className={`w-full ${bar.color} rounded-t`}
                                  style={{
                                    height: `${Math.max(
                                      20,
                                      (bar.count / results.length) * 200
                                    )}px`,
                                    minHeight: bar.count ? "20px" : "0",
                                  }}
                                >
                                  {bar.count > 0 && (
                                    <div className="text-white font-bold text-center pt-1">
                                      {bar.count}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs mt-2 text-center">
                                  {bar.range}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Top matches */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">
                            Top Matches
                          </h3>
                          <div className="space-y-3">
                            {results.slice(0, 5).map((result, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-6 text-center font-medium">
                                  {i + 1}.
                                </div>
                                <div className="w-20 text-right font-semibold">
                                  <span
                                    className={
                                      result.score >= 0.85
                                        ? "text-green-600 dark:text-green-400"
                                        : result.score >= 0.7
                                        ? "text-blue-600 dark:text-blue-400"
                                        : result.score >= 0.5
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-red-600 dark:text-red-400"
                                    }
                                  >
                                    {Math.round(result.score * 100)}%
                                  </span>
                                </div>
                                <div className="flex-1 truncate font-medium">
                                  {result.document.title}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No results to visualize
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
