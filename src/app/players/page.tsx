import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDot, MapPin, Search, ShieldCheck } from "lucide-react";
import { getPublicPlayers } from "@/server/queries/public.queries";
import { PublicShell } from "@/components/public/public-shell";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Futbolçu axtar — PeerFootball",
  description: "Yalnız profilini açıq göstərməyi seçmiş PeerFootball oyunçularını məqsədli axtarışla tapın.",
  alternates: { canonical: "/players" },
  openGraph: { title: "Futbolçu axtar — PeerFootball", url: "/players" }
};

type PlayersPageProps = {
  searchParams: Promise<{
    q?: string;
    position?: string;
    region?: string;
    page?: string;
  }>;
};

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const position = params.position?.trim() ?? "";
  const region = params.region?.trim() ?? "";
  const hasSearch = query.length >= 2 || Boolean(position) || region.length >= 2;
  const data = hasSearch
    ? await getPublicPlayers({
        query: query.length >= 2 ? query : undefined,
        position: position || undefined,
        region: region.length >= 2 ? region : undefined,
        page: Number(params.page) || 1
      })
    : null;

  return (
    <PublicShell>
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Məxfilik əsaslı oyunçu kəşfi
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Siyahını gəzmə, uyğun oyunçunu axtar
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Bu səhifə insanları açıq kataloq kimi sıralamır. Yalnız məqsədli axtarış etdikdən sonra profilini ictimai seçmiş oyunçuların minimum futbol məlumatları göstərilir.
            </p>
            <Link href="/privacy" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Məxfilik prinsiplərini oxu <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <form className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6" action="/players">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold">Oyunçu axtarışı</h2>
                <p className="text-sm text-muted-foreground">Ən azı bir meyar daxil edin.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">
                Ad və ya istifadəçi adı
                <input
                  className="h-11 rounded-lg border bg-background px-3 font-normal"
                  name="q"
                  defaultValue={params.q}
                  minLength={2}
                  placeholder="Məsələn, Elvin"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium">
                  Mövqe
                  <select className="h-11 rounded-lg border bg-background px-3 font-normal" name="position" defaultValue={params.position ?? ""}>
                    <option value="">Bütün mövqelər</option>
                    <option value="GK">Qapıçı</option>
                    <option value="DEF">Müdafiəçi</option>
                    <option value="MID">Yarımmüdafiəçi</option>
                    <option value="FWD">Hücumçu</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Ümumi region
                  <input
                    className="h-11 rounded-lg border bg-background px-3 font-normal"
                    name="region"
                    defaultValue={params.region}
                    minLength={2}
                    placeholder="Bakı"
                  />
                </label>
              </div>
            </div>

            <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90">
              <Search className="h-4 w-4" /> Axtar
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-live="polite">
        {!data ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <PrivacyPoint icon={Search} title="Yalnız axtarışdan sonra" description="Səhifə açılan kimi heç bir oyunçu siyahısı göstərilmir." />
            <PrivacyPoint icon={ShieldCheck} title="Yalnız ictimai profillər" description="Nəticələrdə yalnız profilini açıq seçmiş oyunçular yer alır." />
            <PrivacyPoint icon={MapPin} title="Minimum məlumat" description="Kartlarda şəxsi əlaqə məlumatı, dəqiq ünvan, şəkil və bio göstərilmir." />
          </div>
        ) : data.items.length ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Axtarış nəticəsi</p>
                <h2 className="mt-1 text-2xl font-black">{data.totalItems} uyğun oyunçu</h2>
              </div>
              <Link href="/players" className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
                Axtarışı təmizlə
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((player) => (
                <article key={player.id} className="group rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-black text-secondary-foreground" aria-hidden="true">
                      {player.name.charAt(0).toLocaleUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{player.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">@{player.username}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5">
                      <CircleDot className="h-3.5 w-3.5 text-primary" />
                      {player.preferredPosition || "Mövqe qeyd edilməyib"}
                    </span>
                    {player.location ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {player.location}
                      </span>
                    ) : null}
                  </div>

                  <Link href={`/players/${player.username}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    İctimai futbol profilini aç <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </article>
              ))}
            </div>

            {data.totalPages > 1 ? (
              <div className="mt-8">
                <NumberedPagination
                  page={data.page}
                  totalPages={data.totalPages}
                  pathname="/players"
                  searchParams={{ q: query || undefined, position: position || undefined, region: region || undefined }}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground"><Search className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-bold">Uyğun ictimai profil tapılmadı</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Axtarış meyarlarını dəyişdirin. Profil sahibi hesabını ictimai etməyibsə, burada görünməyəcək.</p>
            <Link href="/players" className="mt-5 inline-flex font-semibold text-primary hover:underline">Yeni axtarış et</Link>
          </div>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            name: "PeerFootball ictimai futbolçu axtarışı",
            url: `${siteConfig.url}/players`
          }).replaceAll("<", "\\u003c")
        }}
      />
    </PublicShell>
  );
}

function PrivacyPoint({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Search;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border bg-card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      <h2 className="mt-4 font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
