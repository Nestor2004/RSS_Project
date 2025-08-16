"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  children,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: {
      padding: "py-6",
      iconSize: "h-10 w-10",
      titleSize: "text-lg",
      descriptionSize: "text-sm",
    },
    md: {
      padding: "py-12",
      iconSize: "h-16 w-16",
      titleSize: "text-xl",
      descriptionSize: "text-base",
    },
    lg: {
      padding: "py-16",
      iconSize: "h-20 w-20",
      titleSize: "text-2xl",
      descriptionSize: "text-lg",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes[size].padding,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 rounded-full bg-muted p-3 text-muted-foreground",
            sizes[size].iconSize
          )}
        >
          {icon}
        </div>
      )}
      <h3 className={cn("font-semibold", sizes[size].titleSize)}>{title}</h3>
      {description && (
        <p
          className={cn(
            "mt-2 max-w-sm text-muted-foreground",
            sizes[size].descriptionSize
          )}
        >
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function NoResults({
  searchTerm,
  onReset,
}: {
  searchTerm: string;
  onReset: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      }
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find any results for "${searchTerm}". Try different keywords or filters.`
          : "No results match your current filters. Try adjusting your search criteria."
      }
      action={{
        label: "Reset filters",
        onClick: onReset,
      }}
    />
  );
}

export function NoItems({
  title = "No items yet",
  description = "Get started by creating your first item.",
  actionLabel = "Create item",
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title={title}
      description={description}
      action={{
        label: actionLabel,
        onClick: onAction,
      }}
    />
  );
}
