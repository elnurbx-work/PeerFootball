"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Plus, Search, Shield, X } from "lucide-react";
import { addFavoriteTeamAction, removeFavoriteTeamAction } from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FavoriteTeamSearchResult, UserFavoriteTeamSummary } from "@/types/profile.types";

type FavoriteTeamsPickerProps = {
  favoriteTeams: UserFavoriteTeamSummary[];
};

type TeamSearchResponse =
  | {
      ok: true;
      teams: FavoriteTeamSearchResult[];
    }
  | {
      ok: false;
      message: string;
    };

export function FavoriteTeamsPicker({ favoriteTeams }: FavoriteTeamsPickerProps) {
  const [savedTeams, setSavedTeams] = useState(favoriteTeams);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FavoriteTeamSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const savedTeamKeys = useMemo(() => {
    const keys = new Set<string>();

    for (const team of savedTeams) {
      if (team.externalId) {
        keys.add(team.externalId);
      }

      keys.add(team.name.toLowerCase());
    }

    return keys;
  }, [savedTeams]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();
    setMessage("");

    if (trimmed.length < 2) {
      setResults([]);
      setMessage("Search must be at least 2 characters.");
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/profile/team-search?q=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as TeamSearchResponse;

      if (!data.ok) {
        setResults([]);
        setMessage(data.message);
        return;
      }

      setResults(data.teams);
      setMessage(data.teams.length ? "" : "No teams found.");
    } catch {
      setResults([]);
      setMessage("Team search is unavailable right now.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleAdd(team: FavoriteTeamSearchResult) {
    if (isDuplicate(team) || savedTeams.length >= 5) {
      return;
    }

    setBusyTeamId(team.externalId);
    setMessage("");

    startTransition(async () => {
      const response = await addFavoriteTeamAction(team);

      if (response.ok && response.data) {
        setSavedTeams((current) => [...current, response.data as UserFavoriteTeamSummary]);
        setMessage(response.message);
      } else {
        setMessage(response.message);
      }

      setBusyTeamId(null);
    });
  }

  function handleRemove(teamId: string) {
    setBusyTeamId(teamId);
    setMessage("");

    startTransition(async () => {
      const response = await removeFavoriteTeamAction(teamId);

      if (response.ok) {
        setSavedTeams((current) => current.filter((team) => team.id !== teamId));
      }

      setMessage(response.message);
      setBusyTeamId(null);
    });
  }

  function isDuplicate(team: FavoriteTeamSearchResult) {
    return savedTeamKeys.has(team.externalId) || savedTeamKeys.has(team.name.toLowerCase());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favorite teams</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3">
          {savedTeams.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedTeams.map((team) => (
                <SavedTeamCard
                  key={team.id}
                  team={team}
                  disabled={isPending && busyTeamId === team.id}
                  onRemove={() => handleRemove(team.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
              No favorite teams yet.
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search football teams"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={isSearching}>
            <Search className="h-4 w-4" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        {results.length ? (
          <div className="grid gap-3">
            {results.map((team) => {
              const duplicate = isDuplicate(team);
              const atLimit = savedTeams.length >= 5;

              return (
                <SearchResultCard
                  key={team.externalId}
                  team={team}
                  disabled={duplicate || atLimit || (isPending && busyTeamId === team.externalId)}
                  label={duplicate ? "Added" : atLimit ? "Limit reached" : "Add"}
                  onAdd={() => handleAdd(team)}
                />
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SavedTeamCard({
  team,
  disabled,
  onRemove
}: {
  team: UserFavoriteTeamSummary;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border bg-background p-3">
      <TeamLogo src={team.badgeUrl ?? team.logoUrl} name={team.name} />
      <TeamDetails name={team.name} country={team.country} league={team.league} />
      <Button type="button" variant="ghost" size="sm" className="ml-auto shrink-0 px-2" disabled={disabled} onClick={onRemove}>
        <X className="h-4 w-4" />
        <span className="sr-only">Remove {team.name}</span>
      </Button>
    </div>
  );
}

function SearchResultCard({
  team,
  disabled,
  label,
  onAdd
}: {
  team: FavoriteTeamSearchResult;
  disabled: boolean;
  label: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <TeamLogo src={team.badgeUrl ?? team.logoUrl} name={team.name} />
        <TeamDetails name={team.name} country={team.country} league={team.league} />
      </div>
      <Button type="button" size="sm" className="sm:ml-auto" disabled={disabled} onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}

function TeamLogo({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-secondary">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <Shield className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="sr-only">{name}</span>
    </div>
  );
}

function TeamDetails({
  name,
  country,
  league
}: {
  name: string;
  country?: string | null;
  league?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{name}</p>
      <p className="truncate text-xs text-muted-foreground">
        {[country, league].filter(Boolean).join(" - ") || "Football team"}
      </p>
    </div>
  );
}
