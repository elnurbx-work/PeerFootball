import { Plus } from "lucide-react";
import { TeamCard } from "@/components/teams/team-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const teams = [
  {
    id: "team-1",
    name: "Northside FC",
    description: "Casual but competitive weekend football team.",
    membersCount: 12,
    location: "Baku"
  },
  {
    id: "team-2",
    name: "City Five",
    description: "Fast futsal group with weekly training and rotating squads.",
    membersCount: 8,
    location: "Yasamal"
  }
];

export default async function TeamsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="mt-1 text-muted-foreground">Find groups to train, compete, and play with.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}
