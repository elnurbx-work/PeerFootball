import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { FriendButton } from "@/components/friends/FriendButton";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { searchPlayersForUser } from "@/server/queries/user.queries";

type SearchPageProps = {
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const query = getSearchQuery(params.q);
  const players = query.length >= 2 ? await searchPlayersForUser(currentUser.id, query) : [];

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find players by name, username, club, position, or city.
        </p>
      </div>
      <form action="/search" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            defaultValue={query}
            name="q"
            placeholder="Search players"
            type="search"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">
            <Search className="h-4 w-4" />
            Search
          </Button>
          {query ? (
            <Button asChild type="button" variant="outline">
              <Link href="/search">Clear</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {!query ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Search for players to view profiles and send friend requests.
          </CardContent>
        </Card>
      ) : null}

      {query && query.length < 2 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Type at least 2 characters to search players.
          </CardContent>
        </Card>
      ) : null}

      {query.length >= 2 && players.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No players found for "{query}".
          </CardContent>
        </Card>
      ) : null}

      {players.length > 0 ? (
        <div className="grid gap-3">
          {players.map((player) => {
            const displayName = player.name ?? "FanPitch Player";
            const profileMeta = [player.favoriteClub, player.preferredPosition].filter(Boolean).join(" · ");
            const profileHref = player.username ? `/profile/${player.username}` : "/profile";

            return (
              <Card key={player.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={profileHref} className="flex min-w-0 flex-1 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                      {player.image ? (
                        <img src={player.image} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        displayName.charAt(0)
                      )}
                    </div>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{displayName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        @{player.username ?? "profile"}
                      </span>
                      {profileMeta ? (
                        <span className="mt-1 block truncate text-xs text-muted-foreground">{profileMeta}</span>
                      ) : null}
                      {player.location ? (
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{player.location}</span>
                        </span>
                      ) : null}
                    </span>
                  </Link>

                  <div className="sm:shrink-0">
                    <FriendButton
                      targetUserId={player.id}
                      initialState={player.friendship.state}
                      friendshipId={player.friendship.friendshipId}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
