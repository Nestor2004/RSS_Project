"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const [errorDetails, setErrorDetails] = useState<string>("");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error caught by error boundary:", error);

    // Extract useful information from the error
    const details = [
      error.name,
      error.message,
      error.stack?.split("\n").slice(0, 3).join("\n"),
      error.digest ? `Digest: ${error.digest}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setErrorDetails(details);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-lg animate-in fade-in-50 zoom-in-95 duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            An error occurred while processing your request. Our team has been
            notified.
          </p>
        </CardHeader>

        <CardContent>
          <div className="bg-muted/50 p-3 rounded-md text-xs font-mono overflow-auto max-h-32 custom-scrollbar">
            <pre>{errorDetails || error.message || "Unknown error"}</pre>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3 flex-col sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => (window.location.href = "/")}
          >
            Go to homepage
          </Button>
          <Button className="w-full sm:w-auto gap-2" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
