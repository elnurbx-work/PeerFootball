import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function MainLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
