export function SectionHeading({ eyebrow, title, body, inverse = false }: { eyebrow: string; title: string; body: string; inverse?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${inverse ? "text-lime-400" : "text-emerald-700"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-[clamp(2.25rem,5vw,4.25rem)] font-black leading-[1] tracking-[-0.055em] ${inverse ? "text-white" : "text-slate-950"}`}>{title}</h2>
      <p className={`mt-5 max-w-2xl text-lg leading-8 ${inverse ? "text-white/60" : "text-slate-600"}`}>{body}</p>
    </div>
  );
}
