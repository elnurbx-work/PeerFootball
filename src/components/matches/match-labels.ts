import type { Translate } from "@/i18n/dictionary";

export function getMatchTypeLabel(value: string, t: Translate) {
  return value === "INTERNAL" ? t("matches.summary.typeInternal") : t("matches.summary.typeClubVsClub");
}

export function getMatchStatusLabel(value: string, t: Translate) {
  if (value === "DRAFT") return t("matches.summary.statusDraft");
  if (value === "PENDING") return t("matches.summary.statusPendingOpponentApproval");
  if (value === "ACCEPTED") return value;
  if (value === "REJECTED") return value;
  if (value === "SCHEDULED") return t("matches.summary.statusScheduled");
  if (value === "LIVE") return t("matches.summary.statusLive");
  if (value === "RESULT_PENDING") return t("matches.summary.statusResultPendingConfirmation");
  if (value === "COMPLETED") return t("matches.summary.statusFinished");
  if (value === "DISPUTED") return t("matches.summary.statusDisputed");
  if (value === "CANCELLED") return t("matches.summary.statusCancelled");
  return value;
}

export function getMatchCategoryLabel(value: string, t: Translate) {
  if (value === "TRAINING") return t("matches.common.training");
  if (value === "FRIENDLY") return t("matches.common.friendly");
  if (value === "OFFICIAL") return t("matches.common.official");
  return value;
}
