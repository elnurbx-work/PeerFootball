"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  MessageCircle,
  Plus,
  Search,
  Shield,
  Trophy,
  UserCircle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { MessageKey } from "@/i18n/config";

export const primaryNavItems = [
  { href: "/feed", labelKey: "nav.home" as MessageKey, icon: Home },
  { href: "/matches", labelKey: "nav.match" as MessageKey, icon: Trophy },
  { href: "/direct", labelKey: "nav.direct" as MessageKey, icon: MessageCircle },
  { href: "/search", labelKey: "nav.search" as MessageKey, icon: Search },
  { href: "/profile", labelKey: "nav.profile" as MessageKey, icon: UserCircle }
];

const createItem = { href: "/create", labelKey: "nav.createPost" as MessageKey, icon: Plus };

const panelContent = {
  "/feed": {
    titleKey: "nav.home" as MessageKey,
    descriptionKey: "nav.homeDescription" as MessageKey,
    links: [
      { href: "/feed", labelKey: "nav.home" as MessageKey, descriptionKey: "nav.postsDescription" as MessageKey, icon: Home },
      { href: "/create", labelKey: "nav.createPost" as MessageKey, descriptionKey: "nav.createDescription" as MessageKey, icon: Plus }
    ]
  },
  "/matches": {
    titleKey: "nav.match" as MessageKey,
    descriptionKey: "nav.matchDescription" as MessageKey,
    links: [
      { href: "/matches", labelKey: "nav.matches" as MessageKey, descriptionKey: "nav.matchesDescription" as MessageKey, icon: CalendarDays },
      { href: "/clubs", labelKey: "nav.clubs" as MessageKey, descriptionKey: "nav.clubsDescription" as MessageKey, icon: Shield }
    ]
  },
  "/direct": {
    titleKey: "nav.direct" as MessageKey,
    descriptionKey: "nav.directDescription" as MessageKey,
    links: [
      { href: "/direct", labelKey: "nav.inbox" as MessageKey, descriptionKey: "nav.inboxDescription" as MessageKey, icon: MessageCircle },
      { href: "/friends", labelKey: "nav.friends" as MessageKey, descriptionKey: "nav.friendsDescription" as MessageKey, icon: Users },
      { href: "/profile", labelKey: "nav.contacts" as MessageKey, descriptionKey: "nav.contactsDescription" as MessageKey, icon: UserCircle }
    ]
  },
  "/profile": {
    titleKey: "nav.profile" as MessageKey,
    descriptionKey: "nav.profileDescription" as MessageKey,
    links: [
      { href: "/profile", labelKey: "nav.overview" as MessageKey, descriptionKey: "nav.overviewDescription" as MessageKey, icon: UserCircle },
      { href: "/matches", labelKey: "nav.matches" as MessageKey, descriptionKey: "nav.matchesDescription" as MessageKey, icon: CalendarDays }
    ]
  }
};

function getActiveRoot(pathname: string) {
  if (pathname.startsWith("/teams")) {
    return "/matches";
  }

  if (pathname.startsWith("/clubs")) {
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

type DirectUnreadIndicatorProps = {
  hasUnreadDirectMessages?: boolean;
};

export function SiteSidebarRailNav({ hasUnreadDirectMessages = false }: DirectUnreadIndicatorProps) {
  const { t } = useI18n();
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
                "relative h-11 w-11 px-0 text-muted-foreground hover:text-foreground",
                isActive && "bg-secondary text-foreground"
              )}
              title={t(item.labelKey)}
            >
              <Link href={item.href} aria-label={t(item.labelKey)}>
                <item.icon className="h-5 w-5" />
                {item.href === "/direct" && hasUnreadDirectMessages ? (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                ) : null}
              </Link>
            </Button>
          );
        })}
    </nav>
  );
}

export function CreatePostButton() {
  const { t } = useI18n();
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
      title={t(createItem.labelKey)}
    >
      <Link href={createItem.href} aria-label={t(createItem.labelKey)}>
        <Plus className="h-5 w-5" />
      </Link>
    </Button>
  );
}

export function MatchTopButton() {
  const { t } = useI18n();
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
      title={t("nav.match")}
    >
      <Link href="/matches" aria-label={t("nav.match")}>
        <Trophy className="h-5 w-5" />
      </Link>
    </Button>
  );
}

export function SiteSidebarPanelNav() {
  const { t } = useI18n();
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
        <p className="text-lg font-bold">{t(content.titleKey)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t(content.descriptionKey)}</p>
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
                <span className="block font-medium">{t(item.labelKey)}</span>
                <span className="block truncate text-xs text-muted-foreground">{t(item.descriptionKey)}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileBottomNav({ hasUnreadDirectMessages = false }: DirectUnreadIndicatorProps) {
  const { t } = useI18n();
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
            aria-label={t(item.labelKey)}
            className={cn(
              "relative flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
              isActive && "text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-6 w-6",
                item.href === "/create" && "rounded-md border p-1"
              )}
            />
            {item.href === "/direct" && hasUnreadDirectMessages ? (
              <span className="absolute right-[30%] top-3 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
