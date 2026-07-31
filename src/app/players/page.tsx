import type { Metadata } from "next";
import Link from "next/link";
import { getPublicPlayers } from "@/server/queries/public.queries";
import { PublicHero, PublicShell } from "@/components/public/public-shell";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Futbolçular tap — PeerFootball",
  description: "İctimai PeerFootball profillərində mövqe və region üzrə həvəskar futbolçular tapın.",
  alternates: { canonical: "/players" },
  openGraph: { title: "Futbolçular tap — PeerFootball", url: "/players" }
};

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ q?: string; position?: string; region?: string; page?: string }> }) {
  const params = await searchParams;
  const data = await getPublicPlayers({
    query: params.q,
    position: params.position,
    region: params.region,
    page: Number(params.page) || 1
  });
  return (
    <PublicShell>
      <PublicHero eyebrow="İctimai kataloq" title="Futbolçular tap" description="Mövqeyinə, ümumi regionuna və futbol maraqlarına görə ictimai profilləri kəşf edin. E-poçt, telefon və dəqiq ünvan kimi şəxsi məlumatlar bu kataloqda göstərilmir." />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <form className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4" action="/players">
          <label className="grid gap-1 text-sm">Ad və ya istifadəçi adı<input className="h-10 rounded-md border bg-background px-3" name="q" defaultValue={params.q} /></label>
          <label className="grid gap-1 text-sm">Mövqe<input className="h-10 rounded-md border bg-background px-3" name="position" defaultValue={params.position} placeholder="Məsələn, MID" /></label>
          <label className="grid gap-1 text-sm">Region<input className="h-10 rounded-md border bg-background px-3" name="region" defaultValue={params.region} /></label>
          <button className="self-end rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground">Axtar</button>
        </form>
        {data.items.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((player) => (
              <article key={player.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-secondary font-bold">{player.image ? <img src={player.image} alt={`${player.name} profil şəkli`} className="h-full w-full object-cover" /> : player.name.charAt(0)}</span>
                  <div className="min-w-0"><h2 className="truncate font-bold">{player.name}</h2><p className="truncate text-sm text-muted-foreground">@{player.username}</p></div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{player.bio || "Oyunçu ictimai bio əlavə etməyib."}</p>
                <dl className="mt-4 grid gap-1 text-sm"><div><dt className="inline font-semibold">Mövqe: </dt><dd className="inline">{player.preferredPosition || "Qeyd edilməyib"}</dd></div><div><dt className="inline font-semibold">Region: </dt><dd className="inline">{player.location || "Qeyd edilməyib"}</dd></div></dl>
                <Link href={`/players/${player.username}`} className="mt-5 inline-flex font-semibold text-primary hover:underline">İctimai profilə bax</Link>
              </article>
            ))}
          </div>
        ) : <div className="mt-8 rounded-xl border border-dashed p-8 text-center"><h2 className="font-semibold">Uyğun ictimai profil tapılmadı</h2><p className="mt-2 text-sm text-muted-foreground">Filtrləri sadələşdirin və ya daha sonra yenidən yoxlayın.</p></div>}
        {data.totalPages > 1 ? <div className="mt-8"><NumberedPagination page={data.page} totalPages={data.totalPages} pathname="/players" searchParams={{ q: params.q, position: params.position, region: params.region }} /></div> : null}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "PeerFootball ictimai futbolçu kataloqu", url: `${siteConfig.url}/players` }).replaceAll("<", "\\u003c") }} />
    </PublicShell>
  );
}
