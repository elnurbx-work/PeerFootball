"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { LandingCopy } from "./landing-data";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "./brand-mark";
import { LanguageLinks } from "@/components/marketing/language-links";
import { CompactThemeControl } from "@/components/settings/compact-theme-control";
import { cn } from "@/lib/utils";

export function LandingHeader({ copy, locale }: { copy: LandingCopy; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    [copy.nav.features, "#features"],
    [copy.nav.players, "/players"],
    [copy.nav.teams, "/teams"],
    [copy.nav.matches, "/matches"],
    [copy.nav.pitches, "/pitches"],
    ["Bələdçilər", "/guides"]
  ] as const;

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 border-b transition-colors", scrolled || open ? "border-white/10 bg-brand/90 backdrop-blur-xl" : "border-transparent bg-transparent")}>
      <div className="landing-container flex h-20 items-center justify-between">
        <Link href={`/${locale}`} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark inverse />
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-5 lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <CompactThemeControl variant="inverse" />
          <LanguageLinks currentLocale={locale} />
          <Link href="/auth/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-card/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{copy.nav.login}</Link>
          <Link href="/auth/register" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{copy.nav.join}</Link>
        </div>
        <button type="button" aria-label={copy.nav.menu} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-white hover:bg-card/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <div id="mobile-navigation" className={cn("border-t border-white/10 bg-brand px-5 lg:hidden", open ? "block" : "hidden")}>
        <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col py-4">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold text-white/80 hover:bg-card/10 hover:text-white">{label}</Link>)}
          <CompactThemeControl className="mt-3 border-t border-white/10 px-3 pt-4" showLabel variant="inverse" />
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-4"><LanguageLinks currentLocale={locale} /><Link href="/auth/login" className="text-sm font-semibold text-white">{copy.nav.login}</Link></div>
          <Link href="/auth/register" className="mt-4 rounded-xl bg-accent px-5 py-3 text-center font-bold text-accent-foreground">{copy.nav.join}</Link>
        </nav>
      </div>
    </header>
  );
}
