import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import type { LandingCopy } from "./landing-data";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "./brand-mark";
import { LanguageLinks } from "@/components/marketing/language-links";
import { CookieSettingsButton } from "@/components/ads/cookie-settings-button";

export function LandingFooter({ copy, locale }: { copy: LandingCopy; locale: Locale }) {
  const groups = [
    { title: copy.footer.explore, links: [[copy.nav.players, "/players"], [copy.nav.teams, "/teams"], [copy.nav.matches, "/matches"], [copy.nav.pitches, "/pitches"], ["Bələdçilər", "/guides"]] },
    { title: copy.footer.platform, links: [[copy.footer.about, "/about"], [copy.footer.rules, "/community-guidelines"], [copy.footer.help, "/help"], [copy.footer.contact, "/contact"]] },
    { title: copy.footer.legal, links: [[copy.footer.privacy, "/privacy"], [copy.footer.terms, "/terms"], [copy.footer.cookies, "/cookie-policy"]] }
  ] as const;
  return (
    <footer className="bg-brand text-white">
      <div className="landing-container py-14">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10 border-b border-white/10 pb-12 md:grid-cols-[minmax(0,1.25fr)_minmax(0,2fr)]">
          <div><Link href={`/${locale}`}><BrandMark inverse /></Link><p className="mt-4 text-sm text-white/50">{copy.footer.tagline}</p><div className="landing-languages mt-6"><LanguageLinks currentLocale={locale} /></div></div>
          <div className="grid grid-cols-1 gap-8 min-[380px]:grid-cols-2 sm:grid-cols-3">
            {groups.map((group) => <div key={group.title}><h3 className="text-sm font-bold">{group.title}</h3><ul className="mt-4 space-y-3 text-sm text-white/50">{group.links.map(([label, href]) => <li key={label}>{href ? <Link href={href} className="transition hover:text-white">{label}</Link> : <span>{label}</span>}</li>)}</ul></div>)}
          </div>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PeerFootball. {copy.footer.reserved}</p>
          <div className="flex gap-2" aria-label="Social media">
            {[["Instagram", Instagram], ["Facebook", Facebook], ["YouTube", Youtube]].map(([label, Icon]) => <span key={label as string} title={`${label} coming soon`} aria-label={`${label} coming soon`} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10"><Icon className="h-4 w-4" /></span>)}
          </div>
          <CookieSettingsButton className="text-white/60 hover:text-white" />
        </div>
      </div>
    </footer>
  );
}
