export function SectionHeading({ eyebrow, title, body, inverse = false }: { eyebrow: string; title: string; body: string; inverse?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${inverse ? "text-accent" : "text-primary"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-[clamp(2rem,9vw,4.25rem)] font-black leading-[1] tracking-[-0.045em] sm:tracking-[-0.055em] ${inverse ? "text-white" : "text-foreground"}`}>{title}</h2>
      <p className={`mt-5 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${inverse ? "text-white/60" : "text-muted-foreground"}`}>{body}</p>
    </div>
  );
}
