import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide, guides } from "@/content/guides";
import { Breadcrumbs, PublicShell } from "@/components/public/public-shell";
import { siteConfig } from "@/config/site";

export function generateStaticParams() { return guides.map((guide) => ({ slug: guide.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return { title: "Bələdçi tapılmadı", robots: { index: false, follow: false } };
  return {
    title: `${guide.title} — PeerFootball`,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { type: "article", title: guide.title, description: guide.description, url: `/guides/${guide.slug}`, publishedTime: guide.publishedAt, modifiedTime: guide.updatedAt }
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const related = guides.filter((item) => item.slug !== guide.slug).slice(0, 3);
  const articleJson = {
    "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description,
    datePublished: guide.publishedAt, dateModified: guide.updatedAt, author: { "@type": "Organization", name: "PeerFootball Team" },
    publisher: { "@type": "Organization", name: "PeerFootball" }, mainEntityOfPage: `${siteConfig.url}/guides/${guide.slug}`
  };
  const breadcrumbJson = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Ana səhifə", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Bələdçilər", item: `${siteConfig.url}/guides` },
    { "@type": "ListItem", position: 3, name: guide.title, item: `${siteConfig.url}/guides/${guide.slug}` }
  ] };
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Breadcrumbs items={[{ label: "Ana səhifə", href: "/" }, { label: "Bələdçilər", href: "/guides" }, { label: guide.title }]} />
        <header><p className="text-sm font-semibold text-primary">{guide.readingMinutes} dəqiqə oxu</p><h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{guide.title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{guide.description}</p><p className="mt-4 text-sm text-muted-foreground">PeerFootball Team · Dərc: {guide.publishedAt} · Yenilənib: {guide.updatedAt}</p></header>
        <nav className="mt-8 rounded-xl border bg-card p-5" aria-label="Mündəricat"><h2 className="font-bold">Mündəricat</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{guide.sections.map((section) => <li key={section.heading}><a href={`#${slugify(section.heading)}`} className="hover:text-primary">{section.heading}</a></li>)}</ol></nav>
        <div className="mt-10 grid gap-10">{guide.sections.map((section) => <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-24"><h2 className="text-2xl font-bold">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-muted-foreground">{paragraph}</p>)}{section.steps ? <ol className="mt-5 list-decimal space-y-3 pl-6 leading-7">{section.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}</section>)}</div>
        <section className="mt-12 rounded-xl border bg-primary/5 p-6"><h2 className="text-2xl font-bold">Yoxlama siyahısı</h2><ul className="mt-4 grid gap-3">{guide.checklist.map((item) => <li key={item}>✓ {item}</li>)}</ul></section>
        <section className="mt-12"><h2 className="text-2xl font-bold">Tez-tez verilən suallar</h2><div className="mt-5 grid gap-5">{guide.faq.map((item) => <div key={item.question}><h3 className="font-bold">{item.question}</h3><p className="mt-2 leading-7 text-muted-foreground">{item.answer}</p></div>)}</div></section>
        <section className="mt-12 border-t pt-8"><h2 className="text-xl font-bold">Əlaqəli bələdçilər</h2><ul className="mt-4 grid gap-2">{related.map((item) => <li key={item.slug}><Link className="text-primary hover:underline" href={`/guides/${item.slug}`}>{item.title}</Link></li>)}</ul></section>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJson).replaceAll("<", "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson).replaceAll("<", "\\u003c") }} />
    </PublicShell>
  );
}

function slugify(value: string) { return value.toLocaleLowerCase("az").replace(/[^a-z0-9əğıöşüç]+/g, "-").replace(/^-|-$/g, ""); }
