import type { LandingCopy } from "./landing-data";

export function StatsSection({ copy }: { copy: LandingCopy }) {
  return (
    <section aria-label="Platform statistics" className="bg-[#07110d] pb-8 text-white">
      <div className="landing-container grid grid-cols-2 rounded-[1.5rem] border border-white/10 bg-white/[0.04] md:grid-cols-4">
        {copy.stats.map((stat, index) => (
          <div key={stat.label} className={`relative px-5 py-7 md:px-8 ${index % 2 ? "border-l border-white/10" : ""} ${index > 1 ? "border-t border-white/10 md:border-t-0" : ""} ${index === 2 ? "md:border-l" : ""}`}>
            <span className="block text-3xl font-black tracking-[-0.04em] text-lime-400 sm:text-4xl">{stat.value}</span>
            <span className="mt-1 block text-sm text-white/55">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
