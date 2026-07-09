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

type ClubCardProps = {
  club: ClubSummary;
};

export function ClubCard({ club }: ClubCardProps) {
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
          {club.description ?? "No club description yet."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Users className="h-3.5 w-3.5" />
            {club.memberCount} members
          </Badge>
          <Badge variant="secondary">{club.visibility.replaceAll("_", " ")}</Badge>
          {location ? (
            <Badge variant="secondary">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </Badge>
          ) : null}
          {club.currentUserRole ? <Badge>{club.currentUserRole}</Badge> : null}
          {club.currentUserMemberStatus === "REQUESTED" ? (
            <Badge variant="secondary">
              <Clock className="h-3.5 w-3.5" />
              Requested
            </Badge>
          ) : null}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/clubs/${club.slug}`}>Open club</Link>
          </Button>
          {!club.currentUserMemberStatus && club.visibility === "OPEN" ? (
            <Button type="button" disabled={pending} onClick={() => runAction(() => joinOpenClubAction(club.id))}>
              <Check className="h-4 w-4" />
              Join
            </Button>
          ) : null}
          {!club.currentUserMemberStatus && club.visibility === "REQUEST_ONLY" ? (
            <Button type="button" disabled={pending} onClick={() => runAction(() => requestJoinClubAction(club.id))}>
              Request to join
            </Button>
          ) : null}
          {club.currentUserMemberStatus === "INVITED" ? (
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                setMessage("Open the club members page to accept this invite.");
              }}
            >
              Invite pending
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
