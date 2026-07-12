import type { FootballPosition, MatchCategory, MatchPlayerStatus, MatchSideType, MatchStatus, MatchType, MatchVideoProvider, MatchVideoType } from "@prisma/client";

export type MatchPermissions = {
  canEditMatch: boolean;
  canAddPlayers: boolean;
  canSubmitResult: boolean;
  canConfirmResult: boolean;
  canDisputeResult: boolean;
  canAddMatchVideo: boolean;
  canManagePlayers: boolean;
};

export type MatchClubDto = { id: string; name: string; slug: string; logoUrl: string | null };
export type MatchUserDto = { id: string; name: string | null; username: string | null; image: string | null };

export type MatchPlayerDto = {
  id: string;
  matchId: string;
  matchSideId: string;
  userId: string | null;
  clubGuestId: string | null;
  guestName: string | null;
  position: FootballPosition | null;
  shirtNumber: number | null;
  status: MatchPlayerStatus;
  user: MatchUserDto | null;
  clubGuest: { id: string; fullName: string; position: FootballPosition | null } | null;
};

export type MatchSideDto = {
  id: string;
  matchId: string;
  clubId: string | null;
  name: string;
  side: MatchSideType;
  score: number | null;
  club: MatchClubDto | null;
  players: MatchPlayerDto[];
};

export type MatchVideoDto = {
  id: string;
  matchId: string;
  originalUrl: string;
  embedUrl: string;
  provider: MatchVideoProvider;
  videoType: MatchVideoType;
  matchStartSecond: number;
  publicId: string | null;
  title: string | null;
  description: string | null;
  uploadedBy: MatchUserDto;
  createdAt: string;
  updatedAt: string;
};

export type MatchGoalDto = {
  id: string;
  matchId: string;
  matchSideId: string;
  matchPlayerId: string | null;
  playerName: string;
  minute: number | null;
  extraMinute: number | null;
};

export type MatchCommentDto = {
  id: string;
  matchId: string;
  parentId: string | null;
  content: string;
  author: MatchUserDto;
  createdAt: string;
  replies: MatchCommentDto[];
};

export type MatchDto = {
  id: string;
  type: MatchType;
  category: MatchCategory;
  status: MatchStatus;
  creatorClubId: string;
  homeClubId: string | null;
  awayClubId: string | null;
  title: string | null;
  venue: string | null;
  startTime: string;
  endTime: string | null;
  homeScore: number | null;
  awayScore: number | null;
  resultNote: string | null;
  disputeReason: string | null;
  creatorClub: MatchClubDto;
  homeClub: MatchClubDto | null;
  awayClub: MatchClubDto | null;
  sides: MatchSideDto[];
  videos: MatchVideoDto[];
  goals: MatchGoalDto[];
  comments: MatchCommentDto[];
  permissions: MatchPermissions;
  createdAt: string;
  updatedAt: string;
};
