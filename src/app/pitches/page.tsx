import type { Metadata } from "next";
import Link from "next/link";
import { PublicHero, PublicShell } from "@/components/public/public-shell";

export const metadata: Metadata = {
  title: "Futbol meydançaları — PeerFootball",
  description: "Meydança seçərkən örtük, ölçü, işıqlandırma, təhlükəsizlik və rezervasiya şərtlərini necə yoxlamağı öyrənin.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/pitches" }
};

const checks = [
  ["Örtük və ölçü", "Örtüyün vəziyyətini və meydançanın oyun formatına uyğun ölçüsünü soruşun."],
  ["İşıqlandırma", "Axşam oyunu üçün işıqların işlək olduğunu və əlavə ödənişi dəqiqləşdirin."],
  ["Soyunub-geyinmə sahəsi", "Duş, sanitar qovşaq və əşyaların təhlükəsiz saxlanması barədə məlumat alın."],
  ["Rezervasiya qaydası", "Depozit, ləğv müddəti, yağış halında dəyişiklik və ümumi qiyməti yazılı təsdiqləyin."],
  ["Təcili yardım", "İlk yardım çantası, giriş yolu və administratorun əlaqəsini əvvəlcədən bilin."],
  ["Nəqliyyat", "İctimai nəqliyyat, parkinq və komandanın görüş nöqtəsini oyunçularla paylaşın."]
] as const;

export default function PitchesPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Meydança bələdçisi" title="Oyuna uyğun meydançanı seç" description="PeerFootball hazırda təsdiqlənməmiş obyektləri kataloq kimi göstərmir. Bu səhifə rezervasiyadan əvvəl vacib yoxlamaları izah edir; real meydança kataloqu yalnız doğrulanmış məlumat olduqda açılacaq." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <section><h2 className="text-2xl font-black">Rezervasiyadan əvvəl yoxla</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{checks.map(([title, text], index) => <article key={title} className="rounded-xl border bg-card p-5"><p className="text-sm font-bold text-primary">0{index + 1}</p><h3 className="mt-2 text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-muted-foreground">{text}</p></article>)}</div></section>
        <section className="mt-10 rounded-2xl border border-dashed p-7"><h2 className="text-xl font-bold">Meydança kataloqu hazırlanır</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">İndi saxta ünvan, qiymət və mövcudluq göstərilmir. Məlumatların sahibi və aktuallığı təsdiqləndikdən sonra axtarış və filtr imkanları əlavə ediləcək.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/guides/futbol-meydancasi-secmek" className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground">Tam bələdçini oxu</Link><Link href="/contact" className="rounded-lg border px-4 py-2.5 font-semibold">Əlaqə saxla</Link></div></section>
      </div>
    </PublicShell>
  );
}
