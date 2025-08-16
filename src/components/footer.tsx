"use client";

import Link from "next/link";
import { RssIcon, GithubIcon, HeartIcon } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-7xl py-8 md:py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <RssIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">RSS Vector Search</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              An intelligent RSS aggregator with vector search capabilities,
              allowing you to find news articles based on semantic meaning
              rather than just keywords.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-base mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/news"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Latest News
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Search Articles
                </Link>
              </li>
              <li>
                <Link
                  href="/feeds"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  RSS Feeds
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-medium text-base mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/chromadb/chroma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  ChromaDB
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/rss-parser"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  RSS Parser
                </a>
              </li>
              <li>
                <a
                  href="https://huggingface.co/Xenova"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Xenova Transformers
                </a>
              </li>
              <li>
                <a
                  href="https://ui.shadcn.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  shadcn/ui
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} RSS Vector Search. All rights reserved.
          </p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Built with</span>
            <HeartIcon className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            <span>using Next.js and Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
