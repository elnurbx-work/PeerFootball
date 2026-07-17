"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Shield, UserMinus, X } from "lucide-react";
import {
  acceptClubInviteAction,
  approveJoinRequestAction,
  changeClubMemberRoleAction,
  rejectJoinRequestAction,
  removeClubMemberAction
} from "@/actions/club.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClubMemberDto, ClubRole } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Translate } from "@/i18n/dictionary";

type ClubMembersTableProps = {
  members: ClubMemberDto[];
  canManageRequests: boolean;
  canManageRoles: boolean;
  currentUserId: string;
};

export function ClubMembersTable({ members, canManageRequests, canManageRoles, currentUserId }: ClubMembersTableProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="grid gap-3 border-b p-4">
        <h2 className="font-semibold">{t("clubs.members.title")}</h2>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
      <div className="divide-y">
        {members.map((member) => (
          <div key={member.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold">
                {member.user.image ? (
                  <img src={member.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  (member.user.name ?? member.user.username ?? "P").charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{member.user.name ?? t("clubs.members.playerFallback")}</p>
                <p className="truncate text-xs text-muted-foreground">@{member.user.username ?? member.userId}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{getMemberRoleLabel(member.role, t)}</Badge>
                  <Badge variant="secondary">{getMemberStatusLabel(member.status, t)}</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {member.status === "REQUESTED" && canManageRequests ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => runAction(() => approveJoinRequestAction(member.id))}
                  >
                    <Check className="h-4 w-4" />
                    {t("clubs.members.approve")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => runAction(() => rejectJoinRequestAction(member.id))}
                  >
                    <X className="h-4 w-4" />
                    {t("clubs.members.reject")}
                  </Button>
                </>
              ) : null}
              {member.status === "INVITED" && member.userId === currentUserId ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => runAction(() => acceptClubInviteAction(member.id))}
                >
                  <Check className="h-4 w-4" />
                  {t("clubs.members.acceptInvite")}
                </Button>
              ) : null}
              {member.status === "ACTIVE" && canManageRoles && member.role !== "OWNER" ? (
                <>
                  <select
                    className={selectClassName}
                    defaultValue={member.role}
                    disabled={pending}
                    onChange={(event) =>
                      runAction(() =>
                        changeClubMemberRoleAction({
                          memberId: member.id,
                          role: event.target.value as Exclude<ClubRole, "OWNER">
                        })
                      )
                    }
                  >
                    <option value="PLAYER">{t("clubs.common.rolePlayer")}</option>
                    <option value="YTD">YTD</option>
                    <option value="TD">TD</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => runAction(() => removeClubMemberAction(member.id))}
                  >
                    <UserMinus className="h-4 w-4" />
                    {t("clubs.members.remove")}
                  </Button>
                </>
              ) : null}
              {member.role === "OWNER" ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  {t("clubs.members.ownerProtected")}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {!members.length ? <p className="p-6 text-center text-sm text-muted-foreground">{t("clubs.members.empty")}</p> : null}
      </div>
    </div>
  );
}

const selectClassName =
  "h-9 rounded-md border bg-background px-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

function getMemberRoleLabel(value: string, t: Translate) {
  if (value === "OWNER") return t("clubs.common.roleOwner");
  if (value === "PLAYER") return t("clubs.common.rolePlayer");
  return value;
}

function getMemberStatusLabel(value: string, t: Translate) {
  if (value === "ACTIVE") return t("clubs.members.statusActive");
  if (value === "INVITED") return t("clubs.members.statusInvited");
  if (value === "REQUESTED") return t("clubs.members.statusRequested");
  if (value === "REJECTED") return t("clubs.members.statusRejected");
  if (value === "REMOVED") return t("clubs.members.statusRemoved");
  return value;
}
