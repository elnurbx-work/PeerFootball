import "server-only";

import type { FavoriteTeamSearchResult } from "@/types/profile.types";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

type TheSportsDbTeam = {
  idTeam?: string | null;
  strTeam?: string | null;
  strCountry?: string | null;
  strLeague?: string | null;
  strBadge?: string | null;
  strLogo?: string | null;
};

type TheSportsDbResponse = {
  teams?: TheSportsDbTeam[] | null;
};

export class TeamSearchServiceError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "TeamSearchServiceError";
  }
}

export function normalizeTeam(team: TheSportsDbTeam): FavoriteTeamSearchResult | null {
  const externalId = clean(team.idTeam);
  const name = clean(team.strTeam);

  if (!externalId || !name) {
    return null;
  }

  return {
    externalId,
    name,
    country: clean(team.strCountry),
    league: clean(team.strLeague),
    badgeUrl: clean(team.strBadge),
    logoUrl: clean(team.strLogo)
  };
}

export async function searchTeamsByName(query: string): Promise<FavoriteTeamSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const data = await fetchTeams(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(trimmed)}`);
  const teams = data.teams ?? [];

  return teams.map(normalizeTeam).filter((team): team is FavoriteTeamSearchResult => Boolean(team));
}

export async function lookupTeamById(idTeam: string): Promise<FavoriteTeamSearchResult | null> {
  const trimmed = idTeam.trim();

  if (!trimmed) {
    return null;
  }

  const data = await fetchTeams(`${BASE_URL}/lookupteam.php?id=${encodeURIComponent(trimmed)}`);
  const [team] = data.teams ?? [];

  return team ? normalizeTeam(team) : null;
}

async function fetchTeams(url: string): Promise<TheSportsDbResponse> {
  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new TeamSearchServiceError("Team search is unavailable right now.");
  }

  if (response.status === 429) {
    throw new TeamSearchServiceError("Team search is temporarily rate limited. Try again soon.", 429);
  }

  if (!response.ok) {
    throw new TeamSearchServiceError("Team search is unavailable right now.");
  }

  try {
    return (await response.json()) as TheSportsDbResponse;
  } catch {
    throw new TeamSearchServiceError("Team search returned an invalid response.");
  }
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
