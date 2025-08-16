"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  showTrending?: boolean;
  className?: string;
  onSearch: (query: string) => void;
}

export function SearchBar({
  initialQuery = "",
  placeholder = "Search articles with vector similarity...",
  showTrending = true,
  className = "",
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get real search suggestions
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const getSuggestions = async () => {
      setIsLoading(true);
      try {
        // In a real app, we would call an API endpoint for suggestions
        // For now, just use basic suggestions based on the query
        const basicSuggestions = [
          `${query} in AI`,
          `${query} research`,
          `latest ${query}`,
        ];

        setSuggestions(basicSuggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Use debounce to avoid too many requests
    const timeoutId = setTimeout(() => {
      getSuggestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    // Allow empty searches to show all results
    onSearch(searchQuery.trim());
    setShowSuggestions(false);
  };

  // Handle clearing the search
  const handleClear = () => {
    setQuery("");
    onSearch("");
    setShowSuggestions(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex w-full">
        <div className="relative w-full">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => query && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(query);
              }
            }}
            className="pr-10 rounded-r-none"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </div>
        <Button onClick={() => handleSearch(query)} className="rounded-l-none">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && query.length >= 2 && (
        <div className="absolute z-50 w-full bg-background border rounded-md shadow-md mt-1 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading suggestions...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-sm text-muted-foreground">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
