import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPublicTeamBySlug, getPublicMatchesForClub } from "@/server/queries/public.queries";
import { Breadcrumbs, PublicShell } from "@/components/public/public-shell";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const club = await getPublicTeamBySlug((await params).slug);
  if (!club) return { title: "Komanda tapılmadı", robots: { index: false, follow: false } };
  return { title: `${club.name} — PeerFootball`, description: club.description?.slice(0, 155) || `${club.name} ictimai futbol komandası.`, robots: { index: true, follow: true }, alternates: { canonical: `/teams/${club.slug}` } };
}

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [club, user] = await Promise.all([getPublicTeamBySlug((await params).slug), getCurrentUser()]);
  if (!club) notFound();
  const related = await getPublicMatchesForClub(club.id);
  const content = <article className="mx-auto max-w-5xl px-4 py-10">
    <Breadcrumbs items={[{ label: "Ana səhifə", href: "/" }, { label: "Komandalar", href: "/teams" }, { label: club.name }]} />
    <header className="overflow-hidden rounded-2xl border bg-card">{club.coverUrl ? <img src={club.coverUrl} alt="" className="h-48 w-full object-cover" /> : null}<div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"><span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-secondary text-3xl font-black">{club.logoUrl ? <img src={club.logoUrl} alt={`${club.name} loqosu`} className="h-full w-full object-cover" /> : club.name.charAt(0)}</span><div><h1 className="text-3xl font-black">{club.name}</h1><p className="mt-1 text-muted-foreground">{[club.city, club.country].filter(Boolean).join(", ") || "Region qeyd edilməyib"} · {club.memberCount} aktiv üzv</p></div></div></header>
    <section className="mt-6 rounded-xl border bg-card p-6"><h2 className="text-2xl font-bold">Komanda haqqında</h2><p className="mt-4 whitespace-pre-wrap leading-8 text-muted-foreground">{club.description || "Bu komanda hələ ətraflı ictimai təsvir əlavə etməyib."}</p></section>
    <section className="mt-8"><h2 className="text-2xl font-bold">İctimai oyunlar</h2>{related.length ? <div className="mt-4 grid gap-3">{related.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="rounded-xl border bg-card p-4 hover:border-primary"><strong>{match.sides.map((side) => side.name).join(" — ")}</strong><p className="mt-1 text-sm text-muted-foreground"><ClientDateTime value={match.startTime} /> · {match.status}</p></Link>)}</div> : <p className="mt-4 rounded-xl border border-dashed p-6 text-muted-foreground">Bu komanda üçün public statuslu qarşıdakı və ya tamamlanmış oyun yoxdur.</p>}</section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SportsTeam", name: club.name, url: `${siteConfig.url}/teams/${club.slug}`, sport: "Football", location: [club.city, club.country].filter(Boolean).join(", ") || undefined }).replaceAll("<", "\\u003c") }} />
  </article>;
  return user ? content : <PublicShell>{content}</PublicShell>;
}
