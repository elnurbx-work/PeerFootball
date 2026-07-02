"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  CreatePostButton,
  MatchTopButton,
  MobileBottomNav,
  SiteSidebarPanelNav,
  SiteSidebarRailNav
} from "@/components/layout/site-sidebar-nav";
import type { SessionUser } from "@/types/auth.types";

type SiteSidebarProps = {
  currentUser: SessionUser | null;
};

export function SiteSidebar({ currentUser }: SiteSidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden bg-background/95 shadow-sm backdrop-blur md:flex">
        <div className="flex w-20 shrink-0 flex-col items-center border-r px-2 py-4">
          <MatchTopButton />

          <SiteSidebarRailNav />
          <div className="mt-5">
            <CreatePostButton />
          </div>

          <div className="mt-auto grid gap-2">
            {currentUser ? (
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-11 w-11 px-0 text-muted-foreground hover:text-foreground"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button asChild className="h-11 w-11 px-0" title="Login">
                <Link href="/auth/login" aria-label="Login">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <SiteSidebarPanelNav />
      </aside>
      <MobileBottomNav />
    </>
  );
}
