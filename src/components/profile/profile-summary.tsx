"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Globe2, Lock, MapPin, Settings, Shield, Shirt, Sparkles, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";

type ProfileSummaryProps = {
  action?: ReactNode;
  friendsHref?: string;
  user: {
    name: string | null;
    image: string | null;
    coverImage: string | null;
    username: string | null;
    favoriteClub: string | null;
    favoriteTeams: {
      id: string;
      name: string;
      logoUrl?: string | null;
      badgeUrl?: string | null;
    }[];
    preferredPosition: string | null;
    avoidedPosition: string | null;
    location: string | null;
    profileVisibility: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
    bio: string | null;
    social: {
      posts: number;
      friends: number;
    };
    stats: {
      matchesPlayed: number;
      goals: number;
      assists: number;
    } | null;
  };
};

export function ProfileSummary({ action, friendsHref, user }: ProfileSummaryProps) {
  const { t } = useI18n();
  const displayName = user.name ?? t("profile.summary.playerFallback");
  const stats = user.stats ?? { matchesPlayed: 0, goals: 0, assists: 0 };
  const isPrivate = user.profileVisibility !== "PUBLIC";
  const profileAction = action ?? (
    <Button asChild variant="outline">
      <Link href="/settings">
        <Settings className="h-4 w-4" />
        {t("profile.summary.settings")}
      </Link>
    </Button>
  );

  return (
    <Card className="relative isolate overflow-hidden">
      <div className="relative z-0 h-36 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--info))_55%,hsl(var(--accent)))] sm:h-44">
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_76%_38%,rgba(255,255,255,0.18),transparent_24%)]" />
        {user.coverImage ? <div className="absolute inset-0 bg-overlay" /> : null}
      </div>
      <CardContent className="relative z-10 p-3 pt-0 min-[360px]:p-4 min-[360px]:pt-0 sm:p-6 sm:pt-0">
        <header className="-mt-12 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:items-end sm:gap-4">
            <div className="relative z-20 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-primary text-3xl font-bold text-primary-foreground shadow-md sm:h-28 sm:w-28 sm:text-4xl">
              {user.image ? (
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                displayName.charAt(0)
              )}
            </div>
            <div className="min-w-0 pb-1 min-[420px]:translate-y-2 min-[420px]:pb-2">
              <h1 className="max-w-full text-2xl font-bold leading-tight sm:text-3xl">{displayName}</h1>
              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 truncate text-sm text-muted-foreground sm:text-base">
                  @{user.username ?? t("profile.summary.usernameFallback")}
                </p>
                <Badge variant="secondary" className="shrink-0 px-2 py-0.5 text-[11px] font-medium">
                  {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
                  {isPrivate ? t("profile.summary.private") : t("profile.summary.public")}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex max-w-full flex-wrap gap-2 sm:shrink-0 sm:justify-end sm:pb-2">{profileAction}</div>
        </header>

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid min-w-0 content-start gap-5">
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {user.bio ?? t("profile.summary.bioFallback")}
            </p>

            <div className="grid gap-2 min-[480px]:grid-cols-2">
              <Badge variant="secondary" className="justify-start px-3 py-2">
                <Shirt className="h-3.5 w-3.5" />
                {user.preferredPosition ?? t("profile.summary.preferredPosition")}
              </Badge>
              <Badge variant="secondary" className="justify-start px-3 py-2">
                <MapPin className="h-3.5 w-3.5" />
                {user.location ?? t("profile.summary.city")}
              </Badge>
            </div>

            <FavoriteTeamsSummary teams={user.favoriteTeams} />

            <div className="grid gap-3 min-[480px]:grid-cols-2">
              <SocialStat label={t("profile.summary.posts")} value={user.social.posts} />
              <SocialStat label={t("profile.summary.friends")} value={user.social.friends} href={friendsHref} friends />
            </div>
          </div>

          <aside className="grid content-start gap-3 min-[560px]:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-md border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                {t("profile.summary.metrics")}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <Stat label={t("profile.summary.matches")} value={stats.matchesPlayed} />
                <Stat label={t("profile.summary.goals")} value={stats.goals} />
                <Stat label={t("profile.summary.assists")} value={stats.assists} />
              </div>
            </div>
            <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
              {t("profile.summary.avoidedPosition")}{" "}
              <span className="font-medium text-foreground">
                {user.avoidedPosition ?? t("profile.summary.notSet")}
              </span>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteTeamsSummary({
  teams
}: {
  teams: {
    id: string;
    name: string;
    logoUrl?: string | null;
    badgeUrl?: string | null;
  }[];
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-primary" />
        {t("profile.favoriteTeams.title")}
      </div>
      {teams.length ? (
        <div className="flex flex-wrap gap-2">
          {teams.map((team) => (
            <div key={team.id} className="flex max-w-full items-center gap-2 rounded-md border bg-background px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                {team.badgeUrl ?? team.logoUrl ? (
                  <img src={team.badgeUrl ?? team.logoUrl ?? ""} alt="" className="h-full w-full object-contain p-0.5" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <span className="truncate text-sm font-medium">{team.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
          {t("profile.favoriteTeams.empty")}
        </div>
      )}
    </div>
  );
}

function SocialStat({
  label,
  value,
  friends = false,
  href
}: {
  label: string;
  value: number;
  friends?: boolean;
  href?: string;
}) {
  const Icon = friends ? UserPlus : Users;
  const content = (
    <>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-md border bg-background p-3 transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-md border bg-background p-3">
      {content}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
