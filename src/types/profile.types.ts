export type PlayerStats = {
  matchesPlayed: number;
  goals: number;
  assists: number;
  preferredFoot?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username: string;
  bio?: string | null;
  favoriteClub?: string | null;
  preferredPosition?: string | null;
  avoidedPosition?: string | null;
  location?: string | null;
  stats?: PlayerStats | null;
};
