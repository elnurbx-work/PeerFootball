"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  MessageCircle,
  Plus,
  Search,
  Trophy,
  UserCircle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const primaryNavItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/matches", label: "Match", icon: Trophy },
  { href: "/direct", label: "Direct", icon: MessageCircle },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: UserCircle }
];

const createItem = { href: "/create", label: "Create Post", icon: Plus };

const panelContent = {
  "/feed": {
    title: "Home",
    description: "Main football flow",
    links: [
      { href: "/feed", label: "Flow", description: "Posts and updates", icon: Home },
      { href: "/feed?filter=following", label: "Following", description: "Players you follow", icon: Users },
      { href: "/create", label: "Create Post", description: "Share a new update", icon: Plus }
    ]
  },
  "/matches": {
    title: "Match",
    description: "Games and squads",
    links: [
      { href: "/matches", label: "Matches", description: "Local games", icon: CalendarDays },
      { href: "/teams", label: "Teams", description: "Groups and squads", icon: Users }
    ]
  },
  "/direct": {
    title: "Direct",
    description: "Messages",
    links: [
      { href: "/direct", label: "Inbox", description: "Your conversations", icon: MessageCircle },
      { href: "/friends", label: "Friends", description: "Requests and friends", icon: Users },
      { href: "/profile", label: "Contacts", description: "Players you know", icon: UserCircle }
    ]
  },
  "/profile": {
    title: "Profile",
    description: "Your football identity",
    links: [
      { href: "/profile", label: "Overview", description: "Public profile", icon: UserCircle },
      { href: "/teams", label: "Teams", description: "Your squads", icon: Users }
    ]
  }
};

function getActiveRoot(pathname: string) {
  if (pathname.startsWith("/teams")) {
    return "/matches";
  }

  if (pathname.startsWith("/settings")) {
    return "/profile";
  }

  if (pathname.startsWith("/friends")) {
    return "/direct";
  }

  return primaryNavItems.find((item) => pathname.startsWith(item.href))?.href ?? "/feed";
}

export function useSecondaryPanel() {
  const pathname = usePathname();
  const activeRoot = getActiveRoot(pathname);

  return hasSecondaryPanel(pathname, activeRoot);
}

function hasSecondaryPanel(pathname: string, activeRoot = getActiveRoot(pathname)) {
  if (pathname.startsWith("/profile")) {
    return false;
  }

  if (pathname.startsWith("/settings")) {
    return false;
  }

  if (pathname.startsWith("/search")) {
    return false;
  }

  if (pathname.startsWith("/create")) {
    return false;
  }

  return activeRoot in panelContent;
}

export function SiteSidebarRailNav() {
  const pathname = usePathname();
  const activeRoot = getActiveRoot(pathname);

  return (
    <nav className="mt-5 grid gap-2">
      {primaryNavItems
        .filter((item) => item.href !== "/matches")
        .map((item) => {
          const isActive = activeRoot === item.href;

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                "h-11 w-11 px-0 text-muted-foreground hover:text-foreground",
                isActive && "bg-secondary text-foreground"
              )}
              title={item.label}
            >
              <Link href={item.href} aria-label={item.label}>
                <item.icon className="h-5 w-5" />
              </Link>
            </Button>
          );
        })}
    </nav>
  );
}

export function CreatePostButton() {
  const pathname = usePathname();
  const isActive = pathname.startsWith(createItem.href);

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-11 w-11 px-0 text-muted-foreground hover:text-foreground",
        isActive && "bg-secondary text-foreground"
      )}
      title={createItem.label}
    >
      <Link href={createItem.href} aria-label={createItem.label}>
        <Plus className="h-5 w-5" />
      </Link>
    </Button>
  );
}

export function MatchTopButton() {
  const pathname = usePathname();
  const isActive = getActiveRoot(pathname) === "/matches";

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-11 w-11 px-0 text-muted-foreground hover:text-foreground",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
      )}
      title="Match"
    >
      <Link href="/matches" aria-label="Match">
        <Trophy className="h-5 w-5" />
      </Link>
    </Button>
  );
}

export function SiteSidebarPanelNav() {
  const pathname = usePathname();
  const activeRoot = getActiveRoot(pathname);
  const hasSecondaryPanel = useSecondaryPanel();
  const content = panelContent[activeRoot as keyof typeof panelContent];

  if (!content || !hasSecondaryPanel) {
    return null;
  }

  return (
    <div className="hidden w-60 flex-col border-r px-4 py-5 md:flex">
      <div>
        <p className="text-lg font-bold">{content.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{content.description}</p>
      </div>

      <nav className="mt-7 grid gap-1">
        {content.links.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors hover:bg-secondary",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block font-medium">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const activeRoot = getActiveRoot(pathname);
  const items = [...primaryNavItems, createItem];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-6 border-t bg-background/95 px-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const isActive = item.href === "/create" ? pathname.startsWith(item.href) : activeRoot === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
              isActive && "text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-6 w-6",
                item.href === "/create" && "rounded-md border p-1"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
