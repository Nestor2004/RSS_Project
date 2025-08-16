"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullPage?: boolean;
}

export function Loading({
  className,
  size = "md",
  text = "Loading...",
  fullPage = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2
          className={cn("animate-spin text-primary", sizeClasses[size])}
        />
        {text && (
          <p
            className={cn(
              "mt-4 text-muted-foreground animate-pulse",
              textSizes[size]
            )}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <p
          className={cn(
            "mt-4 text-muted-foreground animate-pulse",
            textSizes[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingSpinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center space-x-1">
      <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="xl" />
        <h3 className="mt-4 text-lg font-medium">Loading content...</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we fetch the data.
        </p>
      </div>
    </div>
  );
}
