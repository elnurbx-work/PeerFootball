import { Activity, MapPinned, Shield, Trophy, UserRound, UsersRound } from "lucide-react";
import type { FeatureIcon, LandingCopy } from "./landing-data";
import { SectionHeading } from "./section-heading";

const featureIconComponents = {
  profile: UserRound,
  teams: UsersRound,
  matches: Trophy,
  performance: Activity,
  community: Shield,
  pitches: MapPinned
} satisfies Record<FeatureIcon, typeof UserRound>;

export function FeaturesSection({ copy }: { copy: LandingCopy }) {
  return (
    <section id="features" className="landing-section bg-[#f5f5ee]">
      <div className="landing-container">
        <SectionHeading eyebrow={copy.features.eyebrow} title={copy.features.title} body={copy.features.body} />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {copy.featureItems.map((feature) => {
            const Icon = featureIconComponents[feature.icon];
            const dark = feature.tone === "dark";
            const green = feature.tone === "green";
            return (
              <article key={feature.title} className={`group min-h-64 overflow-hidden rounded-[1.5rem] border p-6 transition-transform hover:-translate-y-1 md:p-7 ${feature.wide ? "lg:col-span-2" : ""} ${dark ? "border-white/10 bg-[#0b1812] text-white" : green ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
                <div className="flex h-full flex-col">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${dark ? "bg-lime-400 text-emerald-950" : green ? "bg-white/15 text-lime-300" : "bg-emerald-50 text-emerald-700"}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <div className="mt-auto pt-12">
                    <h3 className="text-2xl font-bold tracking-[-0.03em]">{feature.title}</h3>
                    <p className={`mt-2 max-w-lg leading-7 ${dark || green ? "text-white/65" : "text-slate-600"}`}>{feature.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
