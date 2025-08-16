"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RssSourcesTable } from "@/components/admin/rss-sources-table";
import { AddRssSourceForm } from "@/components/admin/add-rss-source-form";
import { ProcessingControls } from "@/components/admin/processing-controls";
import { ProcessingStats } from "@/components/admin/processing-stats";
import { RssIcon, BarChartIcon, ListIcon } from "lucide-react";
import { ProcessingStats as ProcessingStatsType } from "@/types";
import { RssSource } from "@/lib/rss-sources";

export default function AdminPage() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingStats, setProcessingStats] =
    useState<ProcessingStatsType | null>(null);

  // Fetch RSS sources on load
  useEffect(() => {
    const fetchSources = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/rss/sources");
        const data = await response.json();
        if (data.success) {
          setSources(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch RSS sources:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/rss/status");
        const data = await response.json();
        if (data.success) {
          setProcessingStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch processing status:", error);
      }
    };

    fetchSources();
    fetchStats();
  }, []);

  // Function to refresh sources after CRUD operations
  const refreshSources = async () => {
    try {
      const response = await fetch("/api/rss/sources");
      const data = await response.json();
      if (data.success) {
        setSources(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh RSS sources:", error);
    }
  };

  // Function to refresh processing stats
  const refreshStats = async () => {
    try {
      const response = await fetch("/api/rss/status");
      const data = await response.json();
      if (data.success) {
        setProcessingStats(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh processing status:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RSS Management Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <RssIcon className="h-5 w-5" /> RSS Sources
            </CardTitle>
            <CardDescription>Manage your RSS feed sources</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-2xl">{sources.length}</p>
            <p className="text-muted-foreground">Active sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5" /> Processing Status
            </CardTitle>
            <CardDescription>Current RSS processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-2xl">
              {processingStats?.status || "idle"}
            </p>
            <p className="text-muted-foreground">
              {processingStats?.status === "processing"
                ? "Processing in progress..."
                : processingStats?.endTime
                ? `Last run: ${new Date(
                    processingStats.endTime
                  ).toLocaleString()}`
                : "Not processed yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ListIcon className="h-5 w-5" /> New Articles
            </CardTitle>
            <CardDescription>Articles from the last run</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-2xl">
              {processingStats?.newItems || 0}
            </p>
            <p className="text-muted-foreground">New articles added</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sources" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="sources">RSS Sources</TabsTrigger>
          <TabsTrigger value="processing">Processing Controls</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New RSS Source</CardTitle>
                <CardDescription>
                  Add a new RSS feed source to monitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddRssSourceForm onSuccess={refreshSources} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RSS Sources</CardTitle>
                <CardDescription>
                  Manage your existing RSS sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RssSourcesTable
                  sources={sources}
                  isLoading={isLoading}
                  onSourcesChange={refreshSources}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>RSS Feed Processing</CardTitle>
              <CardDescription>
                Process RSS feeds and monitor the progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingControls onProcessingComplete={refreshStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Processing Statistics</CardTitle>
              <CardDescription>
                Detailed results of the last processing run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingStats
                stats={processingStats}
                onRefresh={refreshStats}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
