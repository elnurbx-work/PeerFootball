"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Clock, MapPin, Users } from "lucide-react";
import { joinOpenClubAction, requestJoinClubAction } from "@/actions/club.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClubSummary } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Translate } from "@/i18n/dictionary";

type ClubCardProps = {
  club: ClubSummary;
};

export function ClubCard({ club }: ClubCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const location = [club.city, club.country].filter(Boolean).join(", ");

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
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-full w-full object-cover" /> : club.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{club.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">@{club.slug}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="line-clamp-3 min-h-12 text-sm leading-6 text-muted-foreground">
          {club.description ?? t("clubs.card.noDescription")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Users className="h-3.5 w-3.5" />
            {t("clubs.card.memberCount", { count: club.memberCount })}
          </Badge>
          <Badge variant="secondary">{getVisibilityLabel(club.visibility, t)}</Badge>
          {location ? (
            <Badge variant="secondary">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </Badge>
          ) : null}
          {club.currentUserRole ? <Badge>{getRoleLabel(club.currentUserRole, t)}</Badge> : null}
          {club.currentUserMemberStatus === "REQUESTED" ? (
            <Badge variant="secondary">
              <Clock className="h-3.5 w-3.5" />
              {t("clubs.card.requested")}
            </Badge>
          ) : null}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/clubs/${club.slug}`}>{t("clubs.card.open")}</Link>
          </Button>
          {!club.currentUserMemberStatus && club.visibility === "OPEN" ? (
            <Button type="button" disabled={pending} onClick={() => runAction(() => joinOpenClubAction(club.id))}>
              <Check className="h-4 w-4" />
              {t("clubs.card.join")}
            </Button>
          ) : null}
          {!club.currentUserMemberStatus && club.visibility === "REQUEST_ONLY" ? (
            <Button type="button" disabled={pending} onClick={() => runAction(() => requestJoinClubAction(club.id))}>
              {t("clubs.card.requestJoin")}
            </Button>
          ) : null}
          {club.currentUserMemberStatus === "INVITED" ? (
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                setMessage(t("clubs.card.acceptInviteHint"));
              }}
            >
              {t("clubs.card.invitePending")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function getVisibilityLabel(value: string, t: Translate) {
  if (value === "OPEN") return t("clubs.common.visibilityOpen");
  if (value === "REQUEST_ONLY") return t("clubs.common.visibilityRequestOnly");
  return t("clubs.common.visibilityInviteOnly");
}

function getRoleLabel(value: string, t: Translate) {
  if (value === "OWNER") return t("clubs.common.roleOwner");
  if (value === "PLAYER") return t("clubs.common.rolePlayer");
  return value;
}
