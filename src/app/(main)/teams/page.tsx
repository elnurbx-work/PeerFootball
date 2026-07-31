import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPublicTeams } from "@/server/queries/public.queries";
import { PublicHero, PublicShell } from "@/components/public/public-shell";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";

export const metadata: Metadata = {
  title: "Futbol komandaları — PeerFootball",
  description: "Aktiv və ictimai həvəskar futbol klublarını region üzrə kəşf edin.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/teams" }
};

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ q?: string; region?: string; page?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const data = await getPublicTeams({ query: params.q, region: params.region, page: Number(params.page) || 1 });
  const content = <>
    <PublicHero eyebrow="İctimai kataloq" title="Futbol komandaları" description="Yalnız aktiv və ictimai klublar göstərilir. Daxili söhbətlər, taktika, dəvətlər və şəxsi üzv məlumatları public kataloqa çıxarılmır." />
    <div className="mx-auto max-w-7xl px-4 py-10">
      <form action="/teams" className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="grid gap-1 text-sm">Komanda adı<input name="q" defaultValue={params.q} className="h-10 rounded-md border bg-background px-3" /></label><label className="grid gap-1 text-sm">Şəhər və ya ölkə<input name="region" defaultValue={params.region} className="h-10 rounded-md border bg-background px-3" /></label><button className="self-end rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Axtar</button></form>
      {data.items.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((club) => <article key={club.id} className="rounded-xl border bg-card p-5"><div className="flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-secondary font-bold">{club.logoUrl ? <img src={club.logoUrl} alt={`${club.name} loqosu`} className="h-full w-full object-cover" /> : club.name.charAt(0)}</span><div className="min-w-0"><h2 className="truncate text-lg font-bold">{club.name}</h2><p className="text-sm text-muted-foreground">{[club.city, club.country].filter(Boolean).join(", ") || "Region qeyd edilməyib"}</p></div></div><p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">{club.description || "Klub hələ ictimai təsvir əlavə etməyib."}</p><p className="mt-4 text-sm">{club.memberCount} aktiv üzv</p><Link href={`/teams/${club.slug}`} className="mt-5 inline-flex font-semibold text-primary hover:underline">Komandaya bax</Link></article>)}</div> : <div className="mt-8 rounded-xl border border-dashed p-8 text-center"><h2 className="font-semibold">İctimai komanda tapılmadı</h2><p className="mt-2 text-sm text-muted-foreground">PeerFootball kataloqu real klublarla böyüyür; saxta komanda göstərilmir.</p></div>}
      {data.totalPages > 1 ? <div className="mt-8"><NumberedPagination page={data.page} totalPages={data.totalPages} pathname="/teams" searchParams={{ q: params.q, region: params.region }} /></div> : null}
    </div>
  </>;
  return user ? content : <PublicShell>{content}</PublicShell>;
}
