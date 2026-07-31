import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PublicShell } from "@/components/public/public-shell";
import { getPublicPlayerByUsername } from "@/server/queries/public.queries";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const player = await getPublicPlayerByUsername(username);
  if (!player) return { title: "Profil tapılmadı", robots: { index: false, follow: false } };
  return {
    title: `${player.name} (@${player.username}) — PeerFootball`,
    description: player.bio?.slice(0, 155) || `${player.name} adlı futbolçunun ictimai PeerFootball profili.`,
    alternates: { canonical: `/players/${player.username}` }
  };
}

export default async function PublicPlayerPage({ params }: { params: Promise<{ username: string }> }) {
  const player = await getPublicPlayerByUsername((await params).username);
  if (!player) notFound();
  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl px-4 py-12">
        <Breadcrumbs items={[{ label: "Ana səhifə", href: "/" }, { label: "Oyunçular", href: "/players" }, { label: player.name }]} />
        <header className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-secondary text-3xl font-black">{player.image ? <img src={player.image} alt={`${player.name} profil şəkli`} className="h-full w-full object-cover" /> : player.name.charAt(0)}</span>
          <div><h1 className="text-3xl font-black">{player.name}</h1><p className="text-muted-foreground">@{player.username}</p></div>
        </header>
        <section className="mt-6 rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">Futbol məlumatları</h2><p className="mt-4 whitespace-pre-wrap leading-7 text-muted-foreground">{player.bio || "Bu oyunçu hələ ictimai bio əlavə etməyib."}</p><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Əsas mövqe" value={player.preferredPosition} /><Info label="Region" value={player.location} /><Info label="Sevimli klub" value={player.favoriteClub} /><Info label="İctimai klub üzvlüyü" value={player.clubs.map((club) => club.name).join(", ") || null} /></dl></section>
      </article>
    </PublicShell>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-sm font-semibold">{label}</dt><dd className="mt-1 text-sm text-muted-foreground">{value || "Qeyd edilməyib"}</dd></div>;
}
