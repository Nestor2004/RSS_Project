"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  RssIcon,
  BarChartIcon,
  ListIcon,
  Settings2Icon,
  LayoutDashboardIcon,
  PlusIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  icon: ReactNode;
  href: string;
  isActive?: (pathname: string) => boolean;
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
      href: "/admin",
      isActive: (path) => path === "/admin",
    },
    {
      title: "RSS Sources",
      icon: <RssIcon className="h-5 w-5" />,
      href: "/admin?tab=sources",
      isActive: (path) =>
        path.includes("sources") || path === "/admin?tab=sources",
    },
    {
      title: "Processing",
      icon: <BarChartIcon className="h-5 w-5" />,
      href: "/admin?tab=processing",
      isActive: (path) => path.includes("processing"),
    },
    {
      title: "Statistics",
      icon: <ListIcon className="h-5 w-5" />,
      href: "/admin?tab=statistics",
      isActive: (path) => path.includes("statistics"),
    },
    {
      title: "Settings",
      icon: <Settings2Icon className="h-5 w-5" />,
      href: "/admin/settings",
      isActive: (path) => path.includes("/admin/settings"),
    },
  ];

  return (
    <div className="flex h-full min-h-screen bg-muted/20">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <RssIcon className="h-5 w-5 text-primary" />
            <span>Admin Dashboard</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={item.isActive?.(pathname) ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  item.isActive?.(pathname) &&
                    "bg-primary text-primary-foreground"
                )}
                asChild
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.title}</span>
                  {item.isActive?.(pathname) && (
                    <motion.div
                      className="absolute right-4 h-1.5 w-1.5 rounded-full bg-current"
                      layoutId="sidebar-active-indicator"
                    />
                  )}
                </Link>
              </Button>
            ))}
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-dashed"
              asChild
            >
              <Link href="/admin?action=add-feed">
                <PlusIcon className="h-5 w-5" />
                <span>Add New Feed</span>
              </Link>
            </Button>
          </div>
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="status-indicator status-online">
              <span className="status-pulse bg-green-500/30"></span>
            </div>
            <div>
              <p className="text-sm font-medium">System Status</p>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Admin Dashboard</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <div className="mb-6 hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRightIcon className="h-4 w-4" />
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
              {pathname !== "/admin" && (
                <>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="text-foreground">
                    {pathname
                      .split("/")
                      .pop()
                      ?.replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                </>
              )}
            </div>

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
