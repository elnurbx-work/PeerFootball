import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FanPitch",
  description: "A football social network for players and fans."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("font-sans antialiased")}>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
