import { Check } from "lucide-react";
import type { LandingCopy } from "./landing-data";

export function HowItWorksSection({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-section bg-brand text-white">
      <div className="landing-container">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">{copy.steps.eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] font-black leading-none tracking-[-0.055em]">{copy.steps.title}</h2>
        <ol className="mt-14 grid gap-0 md:grid-cols-3">
          {copy.steps.items.map((step, index) => (
            <li key={step.title} className="group relative border-l border-white/15 pb-10 pl-10 last:pb-0 md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pr-10 md:pt-10">
              <span className="absolute -left-[17px] top-0 grid h-8 w-8 place-items-center rounded-full border border-accent bg-brand text-xs font-black text-accent md:-top-[17px] md:left-0">{index + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-card/5 text-accent"><Check aria-hidden="true" /></span>
              <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 max-w-sm leading-7 text-white/55">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
