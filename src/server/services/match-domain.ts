import type { ClubPermissionPolicy, ClubRole, MatchFormat, MatchStatus } from "@prisma/client";

export const ACTIVE_CLUB_MATCH_STATUSES: MatchStatus[] = [
  "PENDING",
  "ACCEPTED",
  "SCHEDULED",
  "LIVE",
  "RESULT_PENDING"
];

export const CANCELLABLE_MATCH_STATUSES: MatchStatus[] = ["PENDING", "ACCEPTED", "SCHEDULED"];

const transitions: Partial<Record<MatchStatus, readonly MatchStatus[]>> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["RESULT_PENDING", "CANCELLED"],
  RESULT_PENDING: ["COMPLETED", "DISPUTED"]
};

export function canTransitionMatch(from: MatchStatus, to: MatchStatus) {
  return transitions[from]?.includes(to) ?? false;
}

export function assertMatchTransition(from: MatchStatus, to: MatchStatus) {
  if (!canTransitionMatch(from, to)) {
    throw new MatchDomainError("INVALID_STATUS_TRANSITION", `Match cannot transition from ${from} to ${to}.`);
  }
}

export function getProposalAcceptancePath(status: MatchStatus): MatchStatus[] {
  assertMatchTransition(status, "ACCEPTED");
  assertMatchTransition("ACCEPTED", "SCHEDULED");
  return ["ACCEPTED", "SCHEDULED"];
}

export function getStarterLimit(format: MatchFormat | null) {
  const limits: Record<MatchFormat, number> = {
    FIVE_V_FIVE: 5,
    SIX_V_SIX: 6,
    SEVEN_V_SEVEN: 7,
    EIGHT_V_EIGHT: 8,
    NINE_V_NINE: 9,
    ELEVEN_V_ELEVEN: 11
  };
  return format ? limits[format] : null;
}

export function getClubResult(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return { home: "D" as const, away: "D" as const };
  return homeScore > awayScore
    ? { home: "W" as const, away: "L" as const }
    : { home: "L" as const, away: "W" as const };
}

export function appendRecentForm(current: unknown, result: "W" | "D" | "L") {
  const values = Array.isArray(current)
    ? current.filter((item): item is "W" | "D" | "L" => item === "W" || item === "D" || item === "L")
    : [];
  return [...values, result].slice(-5);
}

export function assertProposalRules(proposerClubId: string, opponentClubId: string, startTime: Date, now = new Date()) {
  if (proposerClubId === opponentClubId) {
    throw new MatchDomainError("SELF_MATCH", "A club cannot invite itself.");
  }
  if (startTime.getTime() <= now.getTime()) {
    throw new MatchDomainError("PAST_MATCH", "A match must be scheduled in the future.");
  }
}

export function canClubManageMatchSide(managerClubId: string, sideClubId: string | null) {
  return Boolean(sideClubId && managerClubId === sideClubId);
}

export function canClubReviewResult(submittingClubId: string | null, reviewingClubId: string) {
  return Boolean(submittingClubId && submittingClubId !== reviewingClubId);
}

export function submittedScoresDiffer(
  submittedHomeScore: number,
  submittedAwayScore: number,
  alternativeHomeScore: number,
  alternativeAwayScore: number
) {
  return submittedHomeScore !== alternativeHomeScore || submittedAwayScore !== alternativeAwayScore;
}

export function shouldApplyStats(status: MatchStatus, statsAppliedAt: Date | null) {
  return status === "RESULT_PENDING" && statsAppliedAt === null;
}

export function canRoleManageMatches(role: ClubRole | null | undefined, policy: ClubPermissionPolicy) {
  if (!role) return false;
  if (policy === "OWNER_ONLY") return role === "OWNER";
  if (policy === "OWNER_TD_YTD") return role === "OWNER" || role === "TD" || role === "YTD";
  return role === "OWNER" || role === "TD";
}

export function clubFixtureKey(firstClubId: string, secondClubId: string, startTime: Date) {
  return [[firstClubId, secondClubId].sort().join(":"), startTime.toISOString()].join("@");
}

export class MatchDomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "MatchDomainError";
  }
}
