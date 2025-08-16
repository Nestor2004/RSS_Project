"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EditRssSourceForm } from "@/components/admin/edit-rss-source-form";
import { RssSource } from "@/lib/rss-sources";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

interface RssSourcesTableProps {
  sources: RssSource[];
  isLoading: boolean;
  onSourcesChange: () => void;
}

export function RssSourcesTable({
  sources,
  isLoading,
  onSourcesChange,
}: RssSourcesTableProps) {
  const [editSource, setEditSource] = useState<RssSource | null>(null);
  const [deleteSource, setDeleteSource] = useState<RssSource | null>(null);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  // Test an RSS feed
  const testRssFeed = async (source: RssSource) => {
    try {
      setTestingSource(source.id || null);
      setTestResult(null);

      // Create a temporary fetch request to test the feed
      const response = await fetch(
        `/api/rss/test?url=${encodeURIComponent(source.url)}`
      );
      const data = await response.json();

      setTestResult({
        id: source.id || "",
        success: data.success,
        message: data.success
          ? `Successfully parsed feed: ${data.data.title || "Untitled"} (${
              data.data.items?.length || 0
            } items)`
          : `Error: ${data.error}`,
      });
    } catch (error) {
      setTestResult({
        id: source.id || "",
        success: false,
        message: `Error testing feed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setTestingSource(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteSource) return;

    try {
      const response = await fetch(`/api/rss/sources?id=${deleteSource.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSourcesChange();
      } else {
        console.error("Failed to delete RSS source");
      }
    } catch (error) {
      console.error("Error deleting RSS source:", error);
    } finally {
      setDeleteSource(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No RSS sources found</h3>
        <p className="text-muted-foreground mt-2">
          Add a new RSS source to get started
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(sources) &&
            sources.map((source) => (
              <TableRow key={source.url}>
                <TableCell className="font-medium">{source.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {source.url}
                </TableCell>
                <TableCell>
                  {source.active ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => testRssFeed(source)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Test Feed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditSource(source)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteSource(source)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog
        open={!!editSource}
        onOpenChange={(open) => !open && setEditSource(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit RSS Source</DialogTitle>
            <DialogDescription>
              Update the details of this RSS feed source
            </DialogDescription>
          </DialogHeader>
          {editSource && (
            <EditRssSourceForm
              source={editSource}
              onSuccess={() => {
                onSourcesChange();
                setEditSource(null);
              }}
              onCancel={() => setEditSource(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteSource}
        onOpenChange={(open) => !open && setDeleteSource(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the RSS source "{deleteSource?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Result Dialog */}
      {testResult && (
        <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    Feed Test Successful
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Feed Test Failed
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>{testResult.message}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setTestResult(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Loading indicator for testing */}
      {testingSource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin mb-4" />
            <p>Testing RSS feed...</p>
          </div>
        </div>
      )}
    </div>
  );
}
