import { Plus } from "lucide-react";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const matches = [
  {
    id: "match-1",
    title: "Friday 7-a-side",
    location: "City Arena",
    date: "July 5, 2026",
    maxPlayers: 14,
    joinedPlayers: 11,
    positionsNeeded: ["CB", "RB", "GK"],
    status: "OPEN"
  },
  {
    id: "match-2",
    title: "Sunday Futsal",
    location: "Neftchilar Sports Hall",
    date: "July 7, 2026",
    maxPlayers: 10,
    joinedPlayers: 8,
    positionsNeeded: ["ST", "CM"],
    status: "OPEN"
  }
];

export default async function MatchesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="mt-1 text-muted-foreground">Organize local games and fill the missing positions.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Create Match
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
