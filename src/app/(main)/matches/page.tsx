import Link from "next/link";
import { Plus } from "lucide-react";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProfileCityByUserId } from "@/server/queries/profile.queries";
import { redirect } from "next/navigation";

const matches = [
  {
    id: "match-1",
    title: "Friday 7-a-side",
    city: "Baku",
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
    city: "Baku",
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

  const city = await getProfileCityByUserId(currentUser.id);
  const cityMatches = city
    ? matches.filter((match) => match.city.toLowerCase() === city.toLowerCase())
    : matches;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="mt-1 text-muted-foreground">
            {city
              ? `Games in ${city}.`
              : "Set your city in profile settings to see games near you."}
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <Plus className="h-4 w-4" />
            Create Match
          </Link>
        </Button>
      </div>
      {!city ? (
        <div className="mb-5 rounded-md border bg-card p-4 text-sm text-muted-foreground">
          Add only your city, for example Baku, so FanPitch can show matches in the same city.
          <Button asChild variant="outline" size="sm" className="ml-0 mt-3 sm:ml-3 sm:mt-0">
            <Link href="/settings">Set city</Link>
          </Button>
        </div>
      ) : null}
      {cityMatches.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cityMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          No matches found in {city}. Check again later or create the first match in your city.
          <Button asChild variant="outline" size="sm" className="ml-0 mt-3 sm:ml-3 sm:mt-0">
            <Link href="/create">
              <Plus className="h-4 w-4" />
              Create Match
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
