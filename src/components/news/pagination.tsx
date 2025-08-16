"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  isSearching: boolean;
  searchQuery: string;
}

export function Pagination({
  currentPage,
  totalPages,
  isSearching,
  searchQuery,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range to always show 3 pages if possible
    if (rangeEnd - rangeStart < 2 && totalPages > 4) {
      if (rangeStart === 2) {
        rangeEnd = Math.min(4, totalPages - 1);
      } else if (rangeEnd === totalPages - 1) {
        rangeStart = Math.max(2, totalPages - 3);
      }
    }

    // Add ellipsis if needed
    if (rangeStart > 2) {
      pages.push(-1); // Use -1 as indicator for ellipsis
    }

    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (rangeEnd < totalPages - 1) {
      pages.push(-2); // Use -2 as indicator for ellipsis
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // Navigate to page
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", page.toString());

    // Keep other parameters
    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`/news${query}`);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-1">
      {/* Previous button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Button>

      {/* Page numbers */}
      {pageNumbers.map((pageNum, i) => {
        if (pageNum < 0) {
          // Render ellipsis
          return (
            <Button
              key={`ellipsis-${i}`}
              variant="ghost"
              size="sm"
              disabled
              className="w-9 h-9"
            >
              ...
            </Button>
          );
        }

        return (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(pageNum)}
            className="w-9 h-9"
          >
            {pageNum}
          </Button>
        );
      })}

      {/* Next button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Button>
    </div>
  );
}
