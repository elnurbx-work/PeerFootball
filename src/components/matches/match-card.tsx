import { Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MatchCardProps = {
  match: {
    title: string;
    city: string;
    location: string;
    date: string;
    maxPlayers: number;
    joinedPlayers: number;
    positionsNeeded: string[];
    status: string;
  };
};

export function MatchCard({ match }: MatchCardProps) {
  const missingPlayers = match.maxPlayers - match.joinedPlayers;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>{match.title}</CardTitle>
          <Badge>{match.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {match.location}, {match.city}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {match.date}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {missingPlayers} players missing
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {match.positionsNeeded.map((position) => (
            <Badge key={position} variant="secondary">
              {position}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
