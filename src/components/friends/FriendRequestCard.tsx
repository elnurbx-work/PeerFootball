"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, UserMinus, X } from "lucide-react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend
} from "@/actions/friendship.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FriendshipWithUser } from "@/types/friendship.types";

type FriendRequestCardProps = {
  friendship: FriendshipWithUser;
  mode: "incoming" | "outgoing" | "friend";
};

export function FriendRequestCard({ friendship, mode }: FriendRequestCardProps) {
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const displayName = friendship.user.name ?? "FanPitch Player";
  const profileHref = friendship.user.username ? `/profile/${friendship.user.username}` : "/profile";

  const runAction = (action: () => Promise<{ ok: boolean; message: string }>) => {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        setVisible(false);
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <Link href={profileHref} className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {friendship.user.image ? (
              <img src={friendship.user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0)
            )}
          </div>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">
              @{friendship.user.username ?? "profile"}
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap gap-2">
          {mode === "incoming" ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => runAction(() => acceptFriendRequest(friendship.id))}
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => declineFriendRequest(friendship.id))}
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </>
          ) : null}

          {mode === "outgoing" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => runAction(() => cancelFriendRequest(friendship.id))}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : null}

          {mode === "friend" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => runAction(() => removeFriend(friendship.id))}
            >
              <UserMinus className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>

        {message ? <p className="w-full text-xs text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
