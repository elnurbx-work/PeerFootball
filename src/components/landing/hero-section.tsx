import Link from "next/link";
import { ArrowRight, MapPin, UsersRound } from "lucide-react";
import type { LandingCopy } from "./landing-data";

export function HeroSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-hero relative isolate overflow-hidden bg-brand pb-16 pt-28 text-white sm:pb-20 sm:pt-32 md:pb-28 md:pt-40">
      <div className="landing-grid absolute inset-0 -z-10 opacity-25" aria-hidden="true" />
      <div className="absolute -right-36 top-8 -z-10 h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="landing-container grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-12 sm:gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,.98fr)]">
        <div className="min-w-0">
          <h1 className="max-w-3xl text-[clamp(2.35rem,12.5vw,6.8rem)] font-black leading-[0.97] tracking-[-0.055em] sm:leading-[0.95] sm:tracking-[-0.07em]">
            <span className="block">{copy.hero.line1}</span>
            <span className="block">{copy.hero.line2}</span>
            <span className="block text-accent">{copy.hero.line3}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:mt-7 sm:text-lg sm:leading-8 md:text-xl">{copy.hero.body}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-bold text-accent-foreground transition hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {copy.hero.primary}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/matches" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-card/5 px-6 font-bold text-white transition hover:bg-card/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{copy.hero.secondary}</Link>
          </div>
          <div className="mt-9 flex min-w-0 items-center gap-3 text-sm text-white/50">
            <div className="flex -space-x-2" aria-hidden="true">
              {["AM", "JR", "NK", "LS"].map((initials, index) => <span key={initials} className="grid h-8 w-8 place-items-center rounded-full border-2 border-brand bg-primary text-[9px] font-bold text-primary-foreground" style={{ transform: `translateY(${index % 2 ? 2 : 0}px)` }}>{initials}</span>)}
            </div>
            <span className="min-w-0">Local players. Real matches.</span>
          </div>
        </div>
        <div className="relative mx-auto min-w-0 w-full max-w-[620px] px-1 sm:px-0">
          <div className="hero-card relative aspect-[4/4.5] overflow-hidden rounded-[2rem] border border-white/10 bg-surface-raised shadow-2xl shadow-overlay sm:aspect-[5/4] lg:aspect-[4/4.5]">
            <div className="absolute inset-5 overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-brand via-primary to-brand">
              <div className="absolute inset-[8%] rounded-[12px] border-2 border-white/25" />
              <div className="absolute left-1/2 top-[8%] h-[84%] w-px bg-card/25" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
              <div className="absolute left-[8%] top-1/2 h-40 w-20 -translate-y-1/2 border-y-2 border-r-2 border-white/20" />
              <div className="absolute right-[8%] top-1/2 h-40 w-20 -translate-y-1/2 border-y-2 border-l-2 border-white/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(163,230,53,.2),transparent_24%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.04)_45%,rgba(255,255,255,.04)_55%,transparent_55%)]" />
              {[
                ["24%", "30%"], ["42%", "18%"], ["65%", "28%"], ["75%", "58%"],
                ["30%", "68%"], ["53%", "72%"], ["58%", "45%"], ["37%", "48%"]
              ].map(([left, top], index) => <span key={`${left}-${top}`} className={`absolute h-4 w-4 rounded-full border-2 border-white shadow-lg ${index < 4 ? "bg-accent" : "bg-warning"}`} style={{ left, top }} />)}
              <div className="absolute bottom-[16%] right-[15%] grid h-24 w-24 place-items-center rounded-full bg-black/20 backdrop-blur-sm">
                <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/50 bg-card text-xs font-black text-foreground">PF</span>
              </div>
            </div>
          </div>
          <div className="hero-float absolute left-0 top-[18%] flex max-w-[82%] items-center gap-2.5 rounded-2xl border border-white/10 bg-brand/95 p-3 shadow-xl backdrop-blur sm:-left-2 sm:gap-3 sm:p-3.5 md:-left-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><UsersRound className="h-5 w-5" /></span>
            <span><strong className="block text-sm">{copy.hero.players}</strong><span className="text-xs text-white/50">{copy.hero.teams}</span></span>
          </div>
          <div className="hero-float-delay absolute -bottom-5 right-1 flex max-w-[82%] items-center gap-2.5 rounded-2xl border border-white/10 bg-card p-3 text-foreground shadow-xl sm:right-2 sm:gap-3 sm:p-3.5 md:-right-5 md:bottom-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><MapPin className="h-5 w-5" /></span>
            <span><strong className="block text-sm">{copy.hero.matches}</strong><span className="text-xs text-muted-foreground">Within 5 km</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}
