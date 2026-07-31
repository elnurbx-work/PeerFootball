import Link from "next/link";
import type { PublicPlatformStats } from "@/types/public.types";

const guideLinks = [
  ["Komanda qurmaq üçün ilk addımlar", "/guides/heveskar-futbol-komandasi-nece-qurulur"],
  ["Həvəskar oyun necə təşkil olunur?", "/guides/futbol-oyunu-teskil-etmek-beledcisi"],
  ["Təhlükəsiz isinmə və zədə riskinin azaldılması", "/guides/tehlukesiz-isinme-ve-zede-riskinin-azaldilmasi"]
] as const;

export function PublicValueSections({ stats }: { stats: PublicPlatformStats }) {
  const realStats = [
    ["Açıq oyunçu profili", stats.players],
    ["Açıq komanda", stats.clubs],
    ["Tamamlanmış klub oyunu", stats.completedMatches]
  ].filter(([, value]) => Number(value) > 0);
  return (
    <>
      {realStats.length ? (
        <section className="border-b bg-card" aria-label="Platformanın real göstəriciləri">
          <div className="landing-container grid gap-4 py-8 sm:grid-cols-3">
            {realStats.map(([label, value]) => <div key={label} className="rounded-2xl border p-5 text-center"><strong className="block text-3xl font-black">{value}</strong><span className="mt-1 block text-sm text-muted-foreground">{label}</span></div>)}
          </div>
        </section>
      ) : null}
      <section className="landing-container py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">Praktik futbol biliyi</p>
            <h2 className="mt-3 text-3xl font-black">Oyundan əvvəl düzgün qərar ver</h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Komanda idarəçiliyi, oyun təşkili və təhlükəsizlik barədə redaksiya materialları iştirakçılara daha məsuliyyətli qərar verməyə kömək edir.</p>
            <div className="mt-7 grid gap-3">{guideLinks.map(([title, href]) => <Link key={href} href={href} className="rounded-xl border bg-card p-4 font-semibold hover:border-primary">{title} <span aria-hidden="true">→</span></Link>)}</div>
          </div>
          <aside className="rounded-3xl bg-primary/10 p-7">
            <h2 className="text-2xl font-black">Təhlükəsiz iştirak prinsipi</h2>
            <p className="mt-4 leading-7 text-muted-foreground">İlk görüşdə məkanı və vaxtı yaxınınıza bildirin, ödəniş şərtlərini əvvəlcədən dəqiqləşdirin, şəxsi məlumatları açıq paylaşmayın və şübhəli davranışı platformaya bildirin.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/safety" className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Təhlükəsizlik</Link><Link href="/community-guidelines" className="rounded-xl border bg-background px-5 py-3 font-bold">İcma qaydaları</Link></div>
          </aside>
        </div>
      </section>
    </>
  );
}
