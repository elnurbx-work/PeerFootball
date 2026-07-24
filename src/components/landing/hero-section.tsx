import Link from "next/link";
import { ArrowRight, MapPin, UsersRound } from "lucide-react";
import type { LandingCopy } from "./landing-data";

export function HeroSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-hero relative isolate overflow-hidden bg-[#07110d] pb-20 pt-32 text-white md:pb-28 md:pt-40">
      <div className="landing-grid absolute inset-0 -z-10 opacity-25" aria-hidden="true" />
      <div className="absolute -right-36 top-8 -z-10 h-[32rem] w-[32rem] rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
      <div className="landing-container grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-300" />{copy.hero.eyebrow}
          </p>
          <h1 className="max-w-3xl text-[clamp(3.1rem,8vw,6.8rem)] font-black leading-[0.86] tracking-[-0.07em]">
            <span className="block">{copy.hero.line1}</span>
            <span className="block">{copy.hero.line2}</span>
            <span className="block text-lime-400">{copy.hero.line3}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/65 md:text-xl">{copy.hero.body}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-lime-400 px-6 font-bold text-emerald-950 transition hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {copy.hero.primary}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/matches" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400">{copy.hero.secondary}</Link>
          </div>
          <div className="mt-9 flex items-center gap-3 text-sm text-white/50">
            <div className="flex -space-x-2" aria-hidden="true">
              {["AM", "JR", "NK", "LS"].map((initials, index) => <span key={initials} className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#07110d] bg-emerald-700 text-[9px] font-bold text-white" style={{ transform: `translateY(${index % 2 ? 2 : 0}px)` }}>{initials}</span>)}
            </div>
            <span>Local players. Real matches.</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[620px]">
          <div className="hero-card relative aspect-[4/4.5] overflow-hidden rounded-[2rem] border border-white/10 bg-[#10261c] shadow-2xl shadow-black/30 sm:aspect-[5/4] lg:aspect-[4/4.5]">
            <div className="absolute inset-5 overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-[#0d3825]">
              <div className="absolute inset-[8%] rounded-[12px] border-2 border-white/25" />
              <div className="absolute left-1/2 top-[8%] h-[84%] w-px bg-white/25" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
              <div className="absolute left-[8%] top-1/2 h-40 w-20 -translate-y-1/2 border-y-2 border-r-2 border-white/20" />
              <div className="absolute right-[8%] top-1/2 h-40 w-20 -translate-y-1/2 border-y-2 border-l-2 border-white/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(163,230,53,.2),transparent_24%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.04)_45%,rgba(255,255,255,.04)_55%,transparent_55%)]" />
              {[
                ["24%", "30%"], ["42%", "18%"], ["65%", "28%"], ["75%", "58%"],
                ["30%", "68%"], ["53%", "72%"], ["58%", "45%"], ["37%", "48%"]
              ].map(([left, top], index) => <span key={`${left}-${top}`} className={`absolute h-4 w-4 rounded-full border-2 border-white shadow-lg ${index < 4 ? "bg-lime-400" : "bg-orange-400"}`} style={{ left, top }} />)}
              <div className="absolute bottom-[16%] right-[15%] grid h-24 w-24 place-items-center rounded-full bg-black/20 backdrop-blur-sm">
                <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/50 bg-white text-xs font-black text-slate-900">PF</span>
              </div>
            </div>
          </div>
          <div className="hero-float absolute -left-2 top-[18%] flex items-center gap-3 rounded-2xl border border-white/10 bg-[#102018]/95 p-3.5 shadow-xl backdrop-blur md:-left-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400 text-emerald-950"><UsersRound className="h-5 w-5" /></span>
            <span><strong className="block text-sm">{copy.hero.players}</strong><span className="text-xs text-white/50">{copy.hero.teams}</span></span>
          </div>
          <div className="hero-float-delay absolute -bottom-5 right-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white p-3.5 text-slate-950 shadow-xl md:-right-5 md:bottom-8">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><MapPin className="h-5 w-5" /></span>
            <span><strong className="block text-sm">{copy.hero.matches}</strong><span className="text-xs text-slate-500">Within 5 km</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}
