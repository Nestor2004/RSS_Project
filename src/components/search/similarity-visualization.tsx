"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  score: number;
  document: {
    title: string;
    feed: {
      title: string;
    };
    pubDate: string;
  };
}

interface SimilarityVisualizationProps {
  results: SearchResult[];
  query: string;
}

export function SimilarityVisualization({
  results,
}: SimilarityVisualizationProps) {
  const [activeTab, setActiveTab] = useState("distribution");

  // Group results by similarity range
  const similarityRanges = [
    { label: "Very High (90-100%)", min: 0.9, max: 1.0, color: "bg-green-500" },
    { label: "High (80-89%)", min: 0.8, max: 0.9, color: "bg-green-400" },
    { label: "Good (70-79%)", min: 0.7, max: 0.8, color: "bg-blue-500" },
    { label: "Moderate (60-69%)", min: 0.6, max: 0.7, color: "bg-blue-400" },
    { label: "Low (50-59%)", min: 0.5, max: 0.6, color: "bg-amber-500" },
    { label: "Very Low (<50%)", min: 0, max: 0.5, color: "bg-red-500" },
  ];

  // Count results in each range
  const rangeCounts = similarityRanges.map((range) => ({
    ...range,
    count: results.filter((r) => r.score >= range.min && r.score < range.max)
      .length,
  }));

  // Get text color based on score
  const getScoreTextColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 dark:text-green-400";
    if (score >= 0.8) return "text-green-500 dark:text-green-400";
    if (score >= 0.7) return "text-blue-600 dark:text-blue-400";
    if (score >= 0.6) return "text-blue-500 dark:text-blue-400";
    if (score >= 0.5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Similarity Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="list">Ranked List</TabsTrigger>
            {results.length >= 5 && (
              <TabsTrigger value="network">Network View</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="distribution">
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{results.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Results
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((results[0]?.score || 0) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Top Match</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">
                    {Math.round(
                      (results.reduce((sum, r) => sum + r.score, 0) /
                        (results.length || 1)) *
                        100
                    )}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Similarity
                  </div>
                </div>
              </div>

              {/* Bar chart */}
              <div>
                <h3 className="text-sm font-medium mb-4">
                  Similarity Distribution
                </h3>
                <div className="h-60 flex items-end gap-2">
                  {rangeCounts.map((range) => (
                    <div
                      key={range.label}
                      className="flex-1 flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{
                          height: `${
                            Math.max(
                              20,
                              (range.count / results.length) * 200
                            ) || 0
                          }px`,
                        }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "w-full rounded-t flex items-center justify-center",
                          range.color
                        )}
                        style={{
                          minHeight: range.count ? "20px" : "0",
                        }}
                      >
                        {range.count > 0 && (
                          <span className="text-white font-bold text-center">
                            {range.count}
                          </span>
                        )}
                      </motion.div>
                      <div className="text-xs mt-2 text-center whitespace-nowrap">
                        {range.label.split(" ")[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center">
                {similarityRanges.map((range) => (
                  <div key={range.label} className="flex items-center gap-2">
                    <div
                      className={cn("w-3 h-3 rounded-full", range.color)}
                    ></div>
                    <span className="text-xs">{range.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {results.map((result, i) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="w-6 text-center font-bold">{i + 1}</div>
                  <div className="w-20 text-right">
                    <Badge
                      className={cn(
                        "font-mono",
                        getScoreTextColor(result.score)
                      )}
                      variant="outline"
                    >
                      {Math.round(result.score * 100)}%
                    </Badge>
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium truncate">
                      {result.document.title}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {result.document.feed.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.document.pubDate).toLocaleDateString()}
                      </span>
                    </div>
                    <Progress
                      value={result.score * 100}
                      className="h-1 mt-2"
                      indicatorClassName={
                        result.score >= 0.9
                          ? "bg-green-500"
                          : result.score >= 0.8
                          ? "bg-green-400"
                          : result.score >= 0.7
                          ? "bg-blue-500"
                          : result.score >= 0.6
                          ? "bg-blue-400"
                          : result.score >= 0.5
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="network">
            <div className="flex items-center justify-center p-8 min-h-[300px]">
              <div className="text-center">
                <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Network Visualization</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  The network visualization shows relationships between articles
                  based on their vector similarity. This feature will be
                  implemented in a future update.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
