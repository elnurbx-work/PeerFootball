import type { Metadata } from "next";
import { PwaInstallPage } from "@/components/pwa/pwa-install-page";

export const metadata: Metadata = {
  title: "PeerFootball-u yüklə",
  description: "PeerFootball tətbiqini Android, iPhone, iPad, Windows və macOS cihazlarına quraşdır.",
  alternates: { canonical: "/install" }
};

export default function InstallPage() {
  return <PwaInstallPage />;
}
