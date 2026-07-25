import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import type { LandingCopy } from "./landing-data";
import { nearbyMatches } from "./landing-data";
import { SectionHeading } from "./section-heading";

function TeamBadge({ initials, light = false }: { initials: string; light?: boolean }) {
  return <span className={`grid h-14 w-14 place-items-center rounded-2xl border text-sm font-black ${light ? "border-white/15 bg-card/10 text-accent" : "border-border bg-card text-primary"}`}>{initials}</span>;
}

export function MatchPreviewSection({ copy }: { copy: LandingCopy }) {
  return (
    <section id="matches" className="landing-section bg-background">
      <div className="landing-container">
        <SectionHeading eyebrow={copy.matches.eyebrow} title={copy.matches.title} body={copy.matches.body} />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <article className="overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground shadow-xl shadow-foreground/10">
            <div className="border-b border-primary-foreground/15 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-black uppercase tracking-wider text-accent-foreground">{copy.matches.today}</span>
                <span className="flex items-center gap-1.5 text-sm text-primary-foreground/70"><MapPin className="h-4 w-4" />Arena Football Center</span>
              </div>
              <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                <div className="flex flex-col items-center gap-3"><TeamBadge initials="FFC" light /><strong>Falcons FC</strong></div>
                <span className="text-2xl font-black text-accent">VS</span>
                <div className="flex flex-col items-center gap-3"><TeamBadge initials="NS" light /><strong>Northside</strong></div>
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-3 text-sm text-primary-foreground/75">
                <span className="rounded-full bg-black/15 px-3 py-2">{copy.matches.friendly}</span>
                <span className="rounded-full bg-black/15 px-3 py-2">{copy.matches.away}</span>
              </div>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
              <div>
                <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Users className="h-4 w-4" />{copy.matches.joined}</span><span>79%</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full w-[79%] rounded-full bg-accent" /></div>
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-primary-foreground/65">{copy.matches.needed}</p>
                <div className="mt-2 flex gap-2">{copy.matches.positions.map((position) => <span key={position} className="rounded-lg border border-primary-foreground/20 px-2.5 py-1.5 text-xs">{position}</span>)}</div>
              </div>
              <Link href="/matches" className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{copy.matches.view}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </article>
          <div className="flex flex-col gap-3">
            {nearbyMatches.map((match, index) => (
              <article key={match.teams} className="flex flex-1 items-center gap-4 rounded-[1.35rem] border border-border bg-card p-4">
                <TeamBadge initials={index === 0 ? "HX" : index === 1 ? "PU" : "OT"} />
                <div className="min-w-0 flex-1"><h3 className="truncate font-bold text-foreground">{match.teams}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{match.time} · {match.format}</p></div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{match.spots}</span>
              </article>
            ))}
            <Link href="/matches" className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong px-5 py-3 text-sm font-bold text-foreground hover:border-primary hover:text-primary">{copy.matches.browse}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
