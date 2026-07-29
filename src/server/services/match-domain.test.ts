import assert from "node:assert/strict";
import {
  assertMatchTransition,
  assertProposalRules,
  canClubManageMatchSide,
  canClubReviewResult,
  canRoleManageMatches,
  clubFixtureKey,
  getProposalAcceptancePath,
  getStarterLimit,
  MatchDomainError,
  shouldApplyStats,
  submittedScoresDiffer
} from "./match-domain";

const future = new Date("2030-01-01T12:00:00.000Z");
const now = new Date("2029-01-01T12:00:00.000Z");

assert.throws(() => assertProposalRules("club-a", "club-a", future, now), (error) =>
  error instanceof MatchDomainError && error.code === "SELF_MATCH"
);
assert.throws(() => assertProposalRules("club-a", "club-b", new Date("2028-01-01"), now), (error) =>
  error instanceof MatchDomainError && error.code === "PAST_MATCH"
);

assert.equal(canRoleManageMatches("PLAYER", "OWNER_TD_YTD"), false);
assert.equal(canRoleManageMatches("TD", "OWNER_TD"), true);
assert.equal(canRoleManageMatches("YTD", "OWNER_TD"), false);

assert.equal(
  clubFixtureKey("club-a", "club-b", future),
  clubFixtureKey("club-b", "club-a", future)
);

assert.deepEqual(getProposalAcceptancePath("PENDING"), ["ACCEPTED", "SCHEDULED"]);
assert.throws(() => assertMatchTransition("CANCELLED", "RESULT_PENDING"), MatchDomainError);
assert.throws(() => assertMatchTransition("REJECTED", "SCHEDULED"), MatchDomainError);

assert.equal(canClubReviewResult("club-a", "club-a"), false);
assert.equal(canClubReviewResult("club-a", "club-b"), true);
assert.equal(submittedScoresDiffer(3, 2, 3, 2), false);
assert.equal(submittedScoresDiffer(3, 2, 2, 3), true);

assert.equal(shouldApplyStats("RESULT_PENDING", null), true);
assert.equal(shouldApplyStats("RESULT_PENDING", new Date()), false);
assert.equal(shouldApplyStats("DISPUTED", null), false);
assert.equal(shouldApplyStats("CANCELLED", null), false);

assert.equal(canClubManageMatchSide("club-a", "club-b"), false);
assert.equal(canClubManageMatchSide("club-a", "club-a"), true);

assert.equal(getStarterLimit("FIVE_V_FIVE"), 5);
assert.equal(getStarterLimit("ELEVEN_V_ELEVEN"), 11);

console.log("Team-vs-team match domain tests passed.");
