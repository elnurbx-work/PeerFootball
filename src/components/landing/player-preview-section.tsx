import { CircleUserRound, Footprints, MapPin } from "lucide-react";
import type { LandingCopy } from "./landing-data";
import { SectionHeading } from "./section-heading";

const form = [7.8, 8.1, 7.6, 8.9, 8.4] as const;

export function PlayerPreviewSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-section bg-card">
      <div className="landing-container grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)]">
        <SectionHeading eyebrow={copy.player.eyebrow} title={copy.player.title} body={copy.player.body} />
        {/* Demo profile data. Replace with public player data when the backend endpoint is available. */}
        <article className="min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-border bg-surface-muted shadow-[0_24px_70px_rgba(15,23,42,.1)]">
          <div className="relative bg-brand p-6 text-white sm:p-8">
            <div className="absolute right-8 top-0 h-full w-40 opacity-20" aria-hidden="true"><div className="absolute inset-y-0 left-1/2 border-l border-white" /><div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" /></div>
            <div className="relative flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.2rem] bg-gradient-to-br from-primary to-brand text-accent sm:h-20 sm:w-20 sm:rounded-[1.4rem]"><CircleUserRound className="h-9 w-9 sm:h-11 sm:w-11" /></span>
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-accent sm:text-xs sm:tracking-widest">PeerFootball player</p><h3 className="mt-1 text-xl font-black sm:text-2xl">Alex Morgan</h3><p className="mt-1 text-xs text-white/55 sm:text-sm"><MapPin className="mr-1 inline h-3.5 w-3.5" />Baku · {copy.player.position}</p></div>
              <div className="ml-auto hidden text-right sm:block"><span className="block text-xs text-white/50">{copy.player.rating}</span><strong className="text-4xl font-black text-accent">8.4</strong></div>
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-4">
              {[["42", copy.player.matches], ["18", copy.player.goals], ["27", copy.player.assists], ["68%", copy.player.winRate]].map(([value, label]) => <div key={label} className="rounded-2xl border border-border bg-card p-4"><strong className="block text-2xl font-black text-foreground">{value}</strong><span className="mt-1 block text-xs text-muted-foreground">{label}</span></div>)}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_.7fr]">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-bold text-foreground">{copy.player.form}</p>
                <div className="mt-5 flex h-28 items-end justify-between gap-3 border-b border-border">
                  {form.map((value, index) => <div key={`${value}-${index}`} className="flex h-full flex-1 flex-col justify-end text-center"><span className="mb-2 text-[10px] font-bold text-muted-foreground">{value}</span><span className={`mx-auto w-full max-w-8 rounded-t-md ${index === form.length - 1 ? "bg-accent" : "bg-primary"}`} style={{ height: `${(value - 7) * 42 + 24}%` }} /></div>)}
                </div>
              </div>
              <div className="relative min-h-48 overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground">
                <p className="relative z-10 text-sm font-bold">{copy.player.pitch}</p>
                <div className="absolute inset-x-5 bottom-5 top-12 rounded-lg border border-white/30"><span className="absolute left-1/2 top-0 h-full border-l border-white/30" /><span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" /><span className="absolute left-[60%] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg"><Footprints className="h-4 w-4" /></span></div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
