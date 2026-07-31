import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/landing/brand-mark";
import { LanguageLinks } from "@/components/marketing/language-links";
import { CompactThemeControl } from "@/components/settings/compact-theme-control";
import { getRequestLocale } from "@/i18n/server";
import { CookieSettingsButton } from "@/components/ads/cookie-settings-button";

export async function PublicShell({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
          <Link href="/" aria-label="PeerFootball ana səhifə"><BrandMark /></Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm font-medium md:order-none md:ml-auto md:w-auto" aria-label="Public navigation">
            <PublicLink href="/players">Oyunçular</PublicLink>
            <PublicLink href="/teams">Komandalar</PublicLink>
            <PublicLink href="/matches">Oyunlar</PublicLink>
            <PublicLink href="/pitches">Meydançalar</PublicLink>
            <PublicLink href="/guides">Bələdçilər</PublicLink>
            <PublicLink href="/about">Haqqımızda</PublicLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <CompactThemeControl />
            <LanguageLinks currentLocale={locale} />
            <Link href="/auth/login" className="rounded-md border px-3 py-2 text-sm font-semibold">Daxil ol</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_2fr]">
          <div><BrandMark /><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Yerli futbolçuların, klubların və oyun təşkilatçılarının təhlükəsiz şəkildə əlaqə qurduğu futbol platforması.</p></div>
          <nav className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3" aria-label="Footer navigation">
            {[
              ["Haqqımızda", "/about"], ["Necə işləyir", "/how-it-works"], ["Bələdçilər", "/guides"],
              ["Kömək", "/help"], ["Əlaqə", "/contact"], ["İcma qaydaları", "/community-guidelines"],
              ["Təhlükəsizlik", "/safety"], ["Məxfilik", "/privacy"], ["Şərtlər", "/terms"],
              ["Cookie siyasəti", "/cookie-policy"]
            ].map(([label, href]) => <Link key={href} href={href} className="text-muted-foreground hover:text-foreground">{label}</Link>)}
            <CookieSettingsButton />
          </nav>
        </div>
        <p className="border-t px-4 py-5 text-center text-xs text-muted-foreground">© {new Date().getUTCFullYear()} PeerFootball. Bütün hüquqlar qorunur.</p>
      </footer>
    </div>
  );
}

function PublicLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="shrink-0 rounded-md px-3 py-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</Link>;
}

export function PublicHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="border-b bg-gradient-to-b from-primary/10 to-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
      </div>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
      <ol className="flex flex-wrap gap-2">
        {items.map((item, index) => <li key={`${item.label}-${index}`} className="flex gap-2">{index ? <span aria-hidden="true">/</span> : null}{item.href ? <Link href={item.href} className="hover:text-foreground">{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}
      </ol>
    </nav>
  );
}
