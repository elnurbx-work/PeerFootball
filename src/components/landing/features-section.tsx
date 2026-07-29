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
    <section id="features" className="landing-section bg-background">
      <div className="landing-container">
        <SectionHeading eyebrow={copy.features.eyebrow} title={copy.features.title} body={copy.features.body} />
        <div className="mt-12 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-3">
          {copy.featureItems.map((feature) => {
            const Icon = featureIconComponents[feature.icon];
            const dark = feature.tone === "dark";
            const green = feature.tone === "green";
            return (
              <article key={feature.title} className={`group min-h-64 min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border p-6 transition-transform hover:-translate-y-1 md:p-7 ${feature.wide ? "lg:col-span-2" : ""} ${dark ? "border-white/10 bg-brand text-white" : green ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                <div className="flex h-full flex-col">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${dark ? "bg-accent text-accent-foreground" : green ? "bg-card/15 text-accent" : "bg-primary/10 text-primary"}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <div className="mt-auto pt-12">
                    <h3 className="text-2xl font-bold tracking-[-0.03em]">{feature.title}</h3>
                    <p className={`mt-2 max-w-lg leading-7 ${dark ? "text-white/65" : green ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{feature.description}</p>
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
