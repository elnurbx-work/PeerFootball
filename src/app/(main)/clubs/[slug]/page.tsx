import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BarChart3, ClipboardList, MessageCircle, Shield, Swords, Users } from "lucide-react";
import { ClubCard } from "@/components/clubs/club-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { createTranslator } from "@/i18n/dictionary";

type ClubPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClubPage({ params }: ClubPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);
  const futureModules = [
    { title: t("clubs.pages.detail.futureInternalTitle"), description: t("clubs.pages.detail.futureInternalDescription"), icon: Users },
    { title: t("clubs.pages.detail.futureClubVsClubTitle"), description: t("clubs.pages.detail.futureClubVsClubDescription"), icon: Shield },
    { title: t("clubs.pages.detail.tacticsTitle"), description: t("clubs.pages.detail.tacticsDescription"), icon: ClipboardList },
    { title: t("clubs.pages.detail.statisticsTitle"), description: t("clubs.pages.detail.statisticsDescription"), icon: BarChart3 },
    { title: t("clubs.pages.detail.analysisTitle"), description: t("clubs.pages.detail.analysisDescription"), icon: ClipboardList },
    { title: t("clubs.pages.detail.chatTitle"), description: t("clubs.pages.detail.chatDescription"), icon: MessageCircle }
  ];

  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), currentUser.id);

  if (!club) {
    notFound();
  }

  const location = [club.city, club.country].filter(Boolean).join(", ");

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="overflow-hidden rounded-md border bg-card">
        <div className="flex aspect-[4/1] min-h-36 items-center justify-center border-b bg-background">
          {club.coverUrl ? (
            <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-card">
              <span className="max-w-full truncate px-6 text-5xl font-bold text-muted-foreground/15 sm:text-7xl">
                {club.name}
              </span>
            </div>
          )}
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex min-w-0 gap-4">
            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-primary text-3xl font-bold text-primary-foreground">
              {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-full w-full object-cover" /> : club.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-bold">{club.name}</h1>
                {!club.isActive ? <Badge variant="secondary">{t("clubs.pages.detail.deactivated")}</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{club.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{club.currentUserRole === "OWNER" ? t("clubs.common.roleOwner") : club.currentUserRole === "PLAYER" ? t("clubs.common.rolePlayer") : club.currentUserRole ?? t("clubs.pages.detail.visitor")}</Badge>
                <Badge variant="secondary">{club.visibility === "OPEN" ? t("clubs.common.visibilityOpen") : club.visibility === "REQUEST_ONLY" ? t("clubs.common.visibilityRequestOnly") : t("clubs.common.visibilityInviteOnly")}</Badge>
                <Badge variant="secondary">{t("clubs.card.memberCount", { count: club.memberCount })}</Badge>
                {location ? <Badge variant="secondary">{location}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/members`}>{t("clubs.pages.detail.members")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/guests`}>{t("clubs.pages.detail.guests")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/metrics`}>{t("clubs.pages.detail.metrics")}</Link>
            </Button>
            {club.currentUserRole === "OWNER" ? (
              <Button asChild>
                <Link href={`/clubs/${club.slug}/settings`}>{t("clubs.pages.detail.settings")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("clubs.pages.detail.overview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {club.description ?? t("clubs.pages.detail.noDescription")}
            </p>
          </CardContent>
        </Card>
        <ClubCard club={club} />
      </div>

      {club.currentUserMemberStatus === "ACTIVE" ? (
        <Card className="border-primary/30">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <Swords className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-lg font-semibold">{t("clubs.pages.detail.matchesTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("clubs.pages.detail.matchesDescription")}
              </p>
            </div>
            <Button asChild>
              <Link href={`/clubs/${club.slug}/matches`}>{t("clubs.pages.detail.openMatches")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {futureModules.map((module) => (
          <Card key={module.title}>
            <CardContent className="p-5">
              <module.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{module.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
              <Badge variant="secondary" className="mt-4">{t("clubs.pages.detail.futurePhase")}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
