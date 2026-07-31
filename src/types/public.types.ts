export type PublicPlayer = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  preferredPosition: string | null;
  location: string | null;
  favoriteClub: string | null;
  clubs: Array<{ name: string; slug: string }>;
};

export type PublicClub = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  country: string | null;
  city: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicMatch = {
  id: string;
  title: string | null;
  format: string | null;
  category: string;
  status: string;
  venue: string | null;
  startTime: string;
  homeScore: number | null;
  awayScore: number | null;
  updatedAt: string;
  sides: Array<{ id: string; name: string; logoUrl: string | null; score: number | null }>;
  goals: Array<{ id: string; playerName: string | null; minute: number | null; extraMinute: number | null; sideId: string }>;
};

export type PublicPage<T> = {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
};

export type PublicPlatformStats = {
  players: number;
  clubs: number;
  completedMatches: number;
};
