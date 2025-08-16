"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { ProcessingStats as ProcessingStatsType } from "@/types";

interface ProcessingStatsProps {
  stats: ProcessingStatsType | null;
  onRefresh: () => void;
}

export function ProcessingStats({ stats, onRefresh }: ProcessingStatsProps) {
  if (!stats) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">
          No Processing Statistics Available
        </h3>
        <p className="text-muted-foreground mt-2">
          Process your RSS feeds to see statistics here
        </p>
        <Button className="mt-4" variant="outline" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  // Format date for display
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Duration in seconds
  const getDuration = () => {
    if (!stats.startTime || !stats.endTime) return "N/A";
    const start = new Date(stats.startTime).getTime();
    const end = new Date(stats.endTime).getTime();
    const durationSeconds = (end - start) / 1000;

    if (durationSeconds < 60) {
      return `${durationSeconds.toFixed(1)} seconds`;
    } else {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = Math.round(durationSeconds % 60);
      return `${minutes}m ${seconds}s`;
    }
  };

  // Status badge
  const renderStatusBadge = () => {
    switch (stats.status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Processing Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Processing Information</CardTitle>
            {renderStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Start Time</TableCell>
                <TableCell>{formatDate(stats.startTime)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">End Time</TableCell>
                <TableCell>{formatDate(stats.endTime)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Duration</TableCell>
                <TableCell>{getDuration()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Sources</TableCell>
                <TableCell>{stats.totalSources}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Processed Sources</TableCell>
                <TableCell>{stats.processedSources}</TableCell>
              </TableRow>
              {stats.message && (
                <TableRow>
                  <TableCell className="font-medium">Message</TableCell>
                  <TableCell>{stats.message}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
        </CardFooter>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-initial">
            <CardTitle className="text-lg">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <div className="text-4xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-initial">
            <CardTitle className="text-lg text-green-600 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              New Items
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <div className="text-4xl font-bold text-green-600">
              {stats.newItems}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-initial">
            <CardTitle className="text-lg text-amber-600">Duplicates</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <div className="text-4xl font-bold text-amber-600">
              {stats.duplicates}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-initial">
            <CardTitle className="text-lg text-red-600 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <div className="text-4xl font-bold text-red-600">
              {stats.errors}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vector Embedding Results */}
      <Card>
        <CardHeader>
          <CardTitle>Vector Embeddings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {stats.vectorsGenerated}
            </div>
            <p className="text-muted-foreground">
              Vector embeddings generated for search
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
