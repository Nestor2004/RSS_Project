"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/search-bar";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-2xl"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            404 - Page Not Found
          </h1>
          <p className="text-xl text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md space-y-4 py-4">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-muted to-transparent" />

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Try searching for what you&apos;re looking for:
            </p>
            <SearchBar
              placeholder="Search articles..."
              className="w-full"
              showTrending={false}
              onSearch={() => {}}
            />
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-muted to-transparent" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild>
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/news" className="gap-2">
              Browse Latest News
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
