"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/types/auth.types";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { useSecondaryPanel } from "@/components/layout/site-sidebar-nav";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  currentUser: SessionUser | null;
};

export function AppShell({ children, currentUser }: AppShellProps) {
  const pathname = usePathname();
  const hasSecondaryPanel = useSecondaryPanel();
  const isDirectPage = pathname.startsWith("/direct");

  return (
    <>
      {isDirectPage ? null : <SiteSidebar currentUser={currentUser} />}
      <main
        className={cn(
          "min-h-screen",
          isDirectPage ? "p-0" : "pb-20 md:pb-0",
          !isDirectPage && (hasSecondaryPanel ? "md:pl-80" : "md:pl-20")
        )}
      >
        {children}
      </main>
    </>
  );
}
