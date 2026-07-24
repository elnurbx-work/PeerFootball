import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LandingCopy } from "./landing-data";

export function FinalCtaSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="bg-[#f5f5ee] px-5 pb-16 md:px-8 md:pb-24 lg:px-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#07110d] px-6 py-16 text-center text-white sm:px-10 md:py-20">
        <div className="absolute inset-6 rounded-[1.25rem] border border-white/10" aria-hidden="true"><span className="absolute left-1/2 top-0 h-full border-l border-white/10" /><span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" /></div>
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-[clamp(2.4rem,6vw,5rem)] font-black leading-[.95] tracking-[-0.06em]">{copy.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/60">{copy.cta.body}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-lime-400 px-6 font-bold text-emerald-950 hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{copy.cta.primary}<ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/feed" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 font-bold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400">{copy.cta.secondary}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
