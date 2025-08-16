"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { ProcessingStats } from "@/types";

interface ProcessingControlsProps {
  onProcessingComplete: () => void;
}

export function ProcessingControls({
  onProcessingComplete,
}: ProcessingControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [pollingCount, setPollingCount] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Start processing RSS feeds
  const startProcessing = async () => {
    try {
      setIsProcessing(true);
      setProcessingError(null);
      setPollingCount(0);

      // Start the RSS processing via API
      const response = await fetch("/api/rss/process", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start RSS processing");
      }

      // Set up polling to check progress
      const interval = setInterval(pollProcessingStatus, 2000);
      setPollingInterval(interval);

      toast({
        title: "Processing Started",
        description: "RSS feeds are now being processed in the background",
      });
    } catch (error) {
      setProcessingError(
        error instanceof Error ? error.message : "Unknown error"
      );
      setIsProcessing(false);

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start RSS processing",
        variant: "destructive",
      });
    }
  };

  // Poll for processing status
  const pollProcessingStatus = async () => {
    try {
      const response = await fetch("/api/rss/status");
      const data = await response.json();

      if (data.success && data.data) {
        setStats(data.data);

        // Check if processing has completed or errored
        if (data.data.status === "completed" || data.data.status === "error") {
          setIsProcessing(false);
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }

          // Show toast based on status
          if (data.data.status === "completed") {
            toast({
              title: "Processing Completed",
              description: `Processed ${data.data.totalItems} items, added ${data.data.newItems} new articles`,
            });
          } else {
            toast({
              title: "Processing Error",
              description:
                data.data.message || "An error occurred during processing",
              variant: "destructive",
            });
            setProcessingError(data.data.message || "Processing failed");
          }

          // Notify parent component
          onProcessingComplete();
        }
      }

      // Increment polling count
      setPollingCount((prev) => prev + 1);

      // If polling for too long, stop polling (timeout after ~1 minute)
      if (pollingCount > 30) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsProcessing(false);
        setProcessingError("Processing timeout - taking longer than expected");
      }
    } catch (error) {
      console.error("Error polling for processing status:", error);
    }
  };

  // Reset processing stats
  const resetStats = async () => {
    try {
      const response = await fetch("/api/rss/status", {
        method: "DELETE",
      });

      if (response.ok) {
        setStats(null);
        setProcessingError(null);

        toast({
          title: "Stats Reset",
          description: "Processing statistics have been reset",
        });

        // Refresh stats from server
        onProcessingComplete();
      } else {
        throw new Error("Failed to reset stats");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to reset stats",
        variant: "destructive",
      });
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!stats) return 0;
    if (stats.status !== "processing") return 100;
    if (stats.totalSources === 0) return 0;

    return Math.min(
      100,
      Math.round((stats.processedSources / stats.totalSources) * 100)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Process RSS Feeds</h3>
          <p className="text-muted-foreground">
            Fetch and process all active RSS feeds
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={resetStats}
            variant="outline"
            disabled={isProcessing || !stats}
          >
            Reset Stats
          </Button>
          <Button onClick={startProcessing} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Processing
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      {isProcessing && stats && (
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Processing RSS Feeds</span>
              <span className="text-sm">
                {stats.processedSources}/{stats.totalSources} sources
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Found {stats.newItems} new articles, {stats.duplicates} duplicates
            </p>
          </div>
        </Card>
      )}

      {/* Error message */}
      {processingError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h4 className="font-medium">Processing Error</h4>
              <p className="text-sm">{processingError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Status details when not processing */}
      {!isProcessing && stats && stats.status !== "idle" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <h4 className="text-sm font-medium">Status</h4>
            <p className="text-2xl font-bold capitalize">{stats.status}</p>
          </Card>

          <Card className="p-4">
            <h4 className="text-sm font-medium">Articles</h4>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground">
              {stats.newItems} new, {stats.duplicates} duplicates
            </p>
          </Card>

          <Card className="p-4">
            <h4 className="text-sm font-medium">Processed At</h4>
            <p className="text-2xl font-bold">
              {stats.endTime
                ? new Date(stats.endTime).toLocaleTimeString()
                : "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.endTime
                ? new Date(stats.endTime).toLocaleDateString()
                : "-"}
            </p>
          </Card>

          <Card className="p-4">
            <h4 className="text-sm font-medium">Errors</h4>
            <p className="text-2xl font-bold">{stats.errors}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
