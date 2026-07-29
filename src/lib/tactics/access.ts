import type { ClubRole, TacticVisibility } from "@prisma/client";

export function canViewTacticVisibility({
  visibility,
  createdById,
  userId,
  clubRole
}: {
  visibility: TacticVisibility;
  createdById: string;
  userId?: string;
  clubRole?: ClubRole | null;
}) {
  if (visibility === "PUBLIC") return true;
  if (!userId) return false;
  if (visibility === "PRIVATE") return createdById === userId;
  if (!clubRole) return false;
  if (visibility === "TEAM_MEMBERS") return true;
  return clubRole === "OWNER" || clubRole === "TD" || clubRole === "YTD";
}
