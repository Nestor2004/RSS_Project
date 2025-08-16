"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Source {
  _id: string;
  name: string;
  count: number;
}

interface Category {
  name: string;
  count: number;
}

interface AdvancedSearchFormProps {
  onSearch: (query: string, filters: Record<string, unknown>) => void;
  isSearching?: boolean;
  className?: string;
}

export function AdvancedSearchForm({
  onSearch,
  isSearching = false,
  className,
}: AdvancedSearchFormProps) {
  const searchParams = useSearchParams();

  // Form state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined
  );
  const [minSimilarity, setMinSimilarity] = useState(
    parseFloat(searchParams.get("minSimilarity") || "0.5")
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sources and categories
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load sources and categories
  useEffect(() => {
    const fetchSourcesAndCategories = async () => {
      // In a real app, fetch from API
      // For now, use mock data
      const mockSources: Source[] = [
        { _id: "tech", name: "Technology News", count: 124 },
        { _id: "ai", name: "AI Research", count: 87 },
        { _id: "data", name: "Data Science Daily", count: 56 },
        { _id: "ml", name: "Machine Learning Today", count: 42 },
        { _id: "research", name: "Research Papers", count: 31 },
      ];

      const mockCategories: Category[] = [
        { name: "Artificial Intelligence", count: 145 },
        { name: "Machine Learning", count: 98 },
        { name: "Data Science", count: 76 },
        { name: "Neural Networks", count: 54 },
        { name: "Computer Vision", count: 43 },
        { name: "Natural Language Processing", count: 38 },
        { name: "Robotics", count: 27 },
        { name: "Ethics", count: 19 },
        { name: "Research", count: 65 },
        { name: "Industry News", count: 82 },
      ];

      setSources(mockSources);
      setCategories(mockCategories);
    };

    fetchSourcesAndCategories();
  }, []);

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // Build filters
    const filters: Record<string, unknown> = {};

    if (source) filters.source = source;
    if (category) filters.category = category;
    if (dateFrom) filters.dateFrom = format(dateFrom, "yyyy-MM-dd");
    if (dateTo) filters.dateTo = format(dateTo, "yyyy-MM-dd");
    filters.minSimilarity = minSimilarity;

    // Call the onSearch callback
    onSearch(query, filters);
  };

  // Reset filters
  const resetFilters = () => {
    setSource("");
    setCategory("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinSimilarity(0.5);
  };

  // Count active filters
  const activeFiltersCount = [
    source,
    category,
    dateFrom,
    dateTo,
    minSimilarity !== 0.5,
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main search input */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search with vector similarity..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 h-11"
              disabled={isSearching}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="h-11 px-6"
            >
              {isSearching ? (
                <>
                  <span className="animate-pulse">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 px-3"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">Advanced filters</span>
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-muted/30 rounded-lg p-4 border"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Source filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sources</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name} ({s.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name} ({c.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                      {dateFrom && (
                        <X
                          className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateFrom(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                      {dateTo && (
                        <X
                          className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateTo(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Similarity threshold slider */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">
                  Minimum Similarity ({Math.round(minSimilarity * 100)}%)
                </label>
                <Badge variant="outline">
                  {minSimilarity < 0.6
                    ? "Low"
                    : minSimilarity < 0.8
                    ? "Medium"
                    : "High"}
                </Badge>
              </div>
              <Slider
                value={[minSimilarity * 100]}
                min={30}
                max={95}
                step={5}
                onValueChange={(value) => setMinSimilarity(value[0] / 100)}
                className="py-4"
              />
            </div>

            {/* Filter actions */}
            <div className="mt-4 flex justify-between">
              <div>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Filter className="h-3 w-3" />
                    {activeFiltersCount} active filters
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={activeFiltersCount === 0}
              >
                <X className="h-4 w-4 mr-1" />
                Reset Filters
              </Button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
