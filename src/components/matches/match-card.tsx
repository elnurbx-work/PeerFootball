import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchDto } from "@/types/match.types";

export function MatchCard({ match }: { match: MatchDto }) {
  const playerCount = match.sides.reduce((total, side) => total + side.players.length, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{match.title ?? match.sides.map((side) => side.name).join(" vs ")}</CardTitle>
          <Badge variant="secondary">{match.status.replaceAll("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(match.startTime)}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{match.venue ?? "Venue not set"}</p>
          <p className="flex items-center gap-2"><Users className="h-4 w-4" />{playerCount} selected players</p>
        </div>
        <div className="flex flex-wrap gap-2"><Badge>{match.type.replaceAll("_", " ")}</Badge><Badge variant="secondary">{match.category}</Badge></div>
        <Button asChild variant="outline" className="w-fit"><Link href={`/matches/${match.id}`}>Open match</Link></Button>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
