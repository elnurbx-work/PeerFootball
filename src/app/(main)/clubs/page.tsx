import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { ClubCard } from "@/components/clubs/club-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { getMyClubs, searchClubs } from "@/server/queries/club.queries";

type ClubsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function getSearchQuery(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function ClubsPage({ searchParams }: ClubsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const query = getSearchQuery(params.q);
  const [myClubs, clubs] = await Promise.all([
    getMyClubs(currentUser.id),
    searchClubs(query)
  ]);

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Clubs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your football workspace.</p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="h-4 w-4" />
            Create club
          </Link>
        </Button>
      </div>

      <form action="/clubs" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" defaultValue={query} name="q" placeholder="Search clubs" type="search" />
        </div>
        <Button type="submit">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">My clubs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Owned, joined, invited, and requested clubs.</p>
        </div>
        {myClubs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              You do not have any clubs yet.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">{query ? "Search results" : "Discover clubs"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {query ? `Clubs matching "${query}".` : "Recently active clubs you can join or request to join."}
          </p>
        </div>
        {clubs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No clubs found.</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
