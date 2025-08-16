"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, X } from "lucide-react";

// Define source type for filtering
interface Source {
  _id: string;
  name: string;
  count: number;
}

export function NewsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sources, setSources] = useState<Source[]>([]);

  const currentSource = searchParams.get("source") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch("/api/statistics");
        const data = await response.json();

        if (data.success && data.data && data.data.sources) {
          setSources(data.data.sources);
        }
      } catch (error) {
        console.error("Error fetching sources:", error);
      }
    };

    fetchSources();
  }, []);

  // Apply filters
  const applyFilters = (source?: string, from?: string, to?: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    // Update or remove source filter
    if (source) {
      current.set("source", source);
    } else {
      current.delete("source");
    }

    // Update or remove date filters
    if (from) {
      current.set("dateFrom", from);
    } else {
      current.delete("dateFrom");
    }

    if (to) {
      current.set("dateTo", to);
    } else {
      current.delete("dateTo");
    }

    // Keep the page and search query if they exist
    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`/news${query}`);
  };

  // Handle source selection
  const handleSourceChange = (value: string) => {
    applyFilters(value, dateFrom, dateTo);
  };

  // Reset all filters
  const resetFilters = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("source");
    current.delete("dateFrom");
    current.delete("dateTo");

    // Keep the page and search query
    if (searchParams.has("q")) {
      current.set("q", searchParams.get("q")!);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`/news${query}`);
  };

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Date Filter
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter by Date</DialogTitle>
            <DialogDescription>
              Select date range to filter articles
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">From</label>
                <Input
                  type="date"
                  defaultValue={dateFrom}
                  className="text-sm"
                  id="date-from"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">To</label>
                <Input
                  type="date"
                  defaultValue={dateTo}
                  className="text-sm"
                  id="date-to"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button
                onClick={() => {
                  const fromInput = document.getElementById(
                    "date-from"
                  ) as HTMLInputElement;
                  const toInput = document.getElementById(
                    "date-to"
                  ) as HTMLInputElement;
                  applyFilters(currentSource, fromInput.value, toInput.value);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Filters */}
      {(currentSource || dateFrom || dateTo) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-9"
        >
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}
    </div>
  );
}
