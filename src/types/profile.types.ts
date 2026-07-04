export type PlayerStats = {
  matchesPlayed: number;
  goals: number;
  assists: number;
  preferredFoot?: string | null;
};

export type FavoriteTeamSearchResult = {
  externalId: string;
  name: string;
  country?: string | null;
  league?: string | null;
  logoUrl?: string | null;
  badgeUrl?: string | null;
};

export type UserFavoriteTeamSummary = {
  id: string;
  externalId?: string | null;
  name: string;
  country?: string | null;
  league?: string | null;
  logoUrl?: string | null;
  badgeUrl?: string | null;
};

export type AddFavoriteTeamInput = {
  externalId?: string | null;
  name: string;
  country?: string | null;
  league?: string | null;
  logoUrl?: string | null;
  badgeUrl?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  coverImage?: string | null;
  username: string;
  bio?: string | null;
  favoriteClub?: string | null;
  preferredPosition?: string | null;
  avoidedPosition?: string | null;
  location?: string | null;
  profileVisibility: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  favoriteTeams: UserFavoriteTeamSummary[];
  stats?: PlayerStats | null;
};
