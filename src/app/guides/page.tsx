import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/content/guides";
import { PublicHero, PublicShell } from "@/components/public/public-shell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Futbol bələdçiləri — PeerFootball",
  description: "Komanda qurmaq, oyun təşkil etmək, təhlükəsizlik və həvəskar futbol idarəçiliyi üzrə praktik Azərbaycan dilində bələdçilər.",
  alternates: { canonical: "/guides" }
};

export default function GuidesPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Praktik futbol bilikləri" title="Futbol bələdçiləri" description="Meydan seçimi, komanda idarəsi, oyun təşkili və təhlükəsizliklə bağlı real problemləri həll edən redaksiya materialları." />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2">
        {guides.map((guide) => <article key={guide.slug} className="rounded-xl border bg-card p-6"><p className="text-xs font-semibold text-primary">{guide.readingMinutes} dəqiqə oxu</p><h2 className="mt-2 text-xl font-bold"><Link href={`/guides/${guide.slug}`} className="hover:text-primary">{guide.title}</Link></h2><p className="mt-3 leading-7 text-muted-foreground">{guide.description}</p><p className="mt-5 text-xs text-muted-foreground">Yenilənib: {guide.updatedAt}</p></article>)}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "PeerFootball futbol bələdçiləri", url: `${siteConfig.url}/guides`, hasPart: guides.map((guide) => ({ "@type": "Article", headline: guide.title, url: `${siteConfig.url}/guides/${guide.slug}` })) }).replaceAll("<", "\\u003c") }} />
    </PublicShell>
  );
}
