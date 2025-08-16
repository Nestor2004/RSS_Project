"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  RssIcon,
  SearchIcon,
  NewspaperIcon,
  SettingsIcon,
  MenuIcon,
  PlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: (pathname: string) => boolean;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: NavItem[] = [
    {
      label: "News",
      href: "/news",
      icon: <NewspaperIcon className="h-4 w-4" />,
      isActive: (path) => path === "/news" || path === "/",
    },
    {
      label: "Search",
      href: "/search",
      icon: <SearchIcon className="h-4 w-4" />,
      isActive: (path) => path.startsWith("/search"),
    },
    {
      label: "Admin",
      href: "/admin",
      icon: <SettingsIcon className="h-4 w-4" />,
      isActive: (path) => path.startsWith("/admin"),
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/50 backdrop-blur-lg transition-all duration-200",
        isScrolled && "shadow-sm backdrop-blur-lg bg-background/90"
      )}
    >
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold transition-colors hover:opacity-80"
          >
            <RssIcon className="h-5 w-5 text-primary" />
            <span className="text-lg">RSS Vector Search</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={item.isActive?.(pathname) ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "gap-1.5",
                item.isActive?.(pathname) &&
                  "bg-primary text-primary-foreground"
              )}
            >
              <Link href={item.href}>
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-1.5"
            asChild
          >
            <Link href="/admin?action=add-feed">
              <PlusIcon className="h-4 w-4" />
              Add Feed
            </Link>
          </Button>

          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open Menu"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 sm:w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <RssIcon className="h-5 w-5 text-primary" />
                  <span>RSS Vector Search</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={item.isActive?.(pathname) ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className={cn(
                      "justify-start gap-3 px-2",
                      item.isActive?.(pathname) &&
                        "bg-primary text-primary-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      {item.label}
                    </Link>
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2 justify-start"
                  asChild
                >
                  <Link href="/admin?action=add-feed">
                    <PlusIcon className="h-4 w-4" />
                    Add Feed
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
