import { MapPin, Shield, Shirt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProfileSummaryProps = {
  user: {
    name: string | null;
    username: string | null;
    favoriteClub: string | null;
    preferredPosition: string | null;
    avoidedPosition: string | null;
    location: string | null;
    bio: string | null;
    stats: {
      matchesPlayed: number;
      goals: number;
      assists: number;
    } | null;
  };
};

export function ProfileSummary({ user }: ProfileSummaryProps) {
  const displayName = user.name ?? "FanPitch Player";
  const stats = user.stats ?? { matchesPlayed: 0, goals: 0, assists: 0 };

  return (
    <Card>
      <CardContent className="grid gap-8 p-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-primary text-2xl font-bold text-primary-foreground">
              {displayName.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">@{user.username ?? "set-your-username"}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {user.bio ?? "Add a short football bio so nearby players know your style."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Badge variant="secondary">
              <Shield className="h-3.5 w-3.5" />
              {user.favoriteClub ?? "Favorite club"}
            </Badge>
            <Badge variant="secondary">
              <Shirt className="h-3.5 w-3.5" />
              {user.preferredPosition ?? "Preferred position"}
            </Badge>
            <Badge variant="secondary">
              <MapPin className="h-3.5 w-3.5" />
              {user.location ?? "Location"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          <Stat label="Matches" value={stats.matchesPlayed} />
          <Stat label="Goals" value={stats.goals} />
          <Stat label="Assists" value={stats.assists} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
