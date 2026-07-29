import type { LandingCopy } from "./landing-data";

export function StatsSection({ copy }: { copy: LandingCopy }) {
  return (
    <section aria-label="Platform statistics" className="bg-brand pb-8 text-white">
      <div className="landing-container grid grid-cols-[repeat(2,minmax(0,1fr))] rounded-[1.5rem] border border-white/10 bg-card/[0.04] md:grid-cols-4">
        {copy.stats.map((stat, index) => (
          <div key={stat.label} className={`relative min-w-0 px-3 py-6 sm:px-5 sm:py-7 md:px-8 ${index % 2 ? "border-l border-white/10" : ""} ${index > 1 ? "border-t border-white/10 md:border-t-0" : ""} ${index === 2 ? "md:border-l" : ""}`}>
            <span className="block text-2xl font-black tracking-[-0.04em] text-accent sm:text-4xl">{stat.value}</span>
            <span className="mt-1 block text-xs leading-5 text-white/55 sm:text-sm">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
