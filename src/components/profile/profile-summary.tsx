import Link from "next/link";
import type { ReactNode } from "react";
import { Globe2, Lock, MapPin, Settings, Shield, Shirt, Sparkles, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfileSummaryProps = {
  action?: ReactNode;
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

export function ProfileSummary({ action, user }: ProfileSummaryProps) {
  const displayName = user.name ?? "FanPitch Player";
  const stats = user.stats ?? { matchesPlayed: 0, goals: 0, assists: 0 };
  const isPrivate = user.profileVisibility !== "PUBLIC";
  const profileAction = action ?? (
    <Button asChild variant="outline">
      <Link href="/settings">
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </Button>
  );

  return (
    <Card className="relative isolate overflow-hidden">
      <div className="relative z-0 h-48 bg-[linear-gradient(135deg,hsl(151_68%_28%),hsl(206_46%_38%)_52%,hsl(7_82%_55%))]">
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_76%_38%,rgba(255,255,255,0.18),transparent_24%)]" />
        {user.coverImage ? <div className="absolute inset-0 bg-black/25" /> : null}
      </div>
      <CardContent className="relative z-10 grid gap-8 p-6 pt-0 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative z-20 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-primary text-4xl font-bold text-primary-foreground shadow-sm">
                {user.image ? (
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0)
                )}
              </div>
              <div className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{displayName}</h1>
                  <Badge variant="secondary">
                    {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
                    {isPrivate ? "Private" : "Public"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">@{user.username ?? "set-your-username"}</p>
              </div>
            </div>
            {profileAction}
          </div>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {user.bio ?? "Add a short football bio so nearby players know your style."}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Badge variant="secondary">
              <Shirt className="h-3.5 w-3.5" />
              {user.preferredPosition ?? "Preferred position"}
            </Badge>
            <Badge variant="secondary">
              <MapPin className="h-3.5 w-3.5" />
              {user.location ?? "City"}
            </Badge>
          </div>

          <FavoriteTeamsSummary teams={user.favoriteTeams} />

          <div className="grid gap-3 sm:grid-cols-2">
            <SocialStat label="Posts" value={user.social.posts} />
            <SocialStat label="Friends" value={user.social.friends} />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-md border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Player metrics
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Matches" value={stats.matchesPlayed} />
              <Stat label="Goals" value={stats.goals} />
              <Stat label="Assists" value={stats.assists} />
            </div>
          </div>
          <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
            Avoided position:{" "}
            <span className="font-medium text-foreground">
              {user.avoidedPosition ?? "Not set"}
            </span>
          </div>
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
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-primary" />
        Favorite teams
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
          No favorite teams yet.
        </div>
      )}
    </div>
  );
}

function SocialStat({ label, value }: { label: string; value: number }) {
  const Icon = label === "Friends" ? UserPlus : Users;

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
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
