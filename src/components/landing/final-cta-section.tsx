import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LandingCopy } from "./landing-data";

export function FinalCtaSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="bg-background px-4 py-16 sm:px-5 md:px-8 md:pb-24 lg:px-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-brand px-5 py-14 text-center text-white sm:rounded-[2rem] sm:px-10 sm:py-16 md:py-20">
        <div className="absolute inset-6 rounded-[1.25rem] border border-white/10" aria-hidden="true"><span className="absolute left-1/2 top-0 h-full border-l border-white/10" /><span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" /></div>
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-[clamp(2rem,10vw,5rem)] font-black leading-[.97] tracking-[-0.045em] sm:leading-[.95] sm:tracking-[-0.06em]">{copy.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">{copy.cta.body}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-bold text-accent-foreground hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{copy.cta.primary}<ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/feed" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-card/5 px-6 font-bold text-white hover:bg-card/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{copy.cta.secondary}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
