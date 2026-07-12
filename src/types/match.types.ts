export type MatchStatus = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

export type MatchParticipantStatus = "JOINED" | "WAITING" | "CANCELLED";

export type Match = {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  matchDate: Date;
  maxPlayers: number;
  status: MatchStatus;
  creatorId: string;
  teamId?: string | null;
  clubId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MatchParticipant = {
  id: string;
  matchId: string;
  userId: string;
  position: string;
  status: MatchParticipantStatus;
  joinedAt: Date;
};
