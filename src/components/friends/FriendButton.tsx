"use client";

import { useState, useTransition } from "react";
import { Check, UserCheck, UserPlus, X } from "lucide-react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest
} from "@/actions/friendship.actions";
import { Button } from "@/components/ui/button";
import type { FriendshipButtonState } from "@/types/friendship.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type FriendButtonProps = {
  targetUserId: string;
  initialState: FriendshipButtonState;
  friendshipId?: string;
};

export function FriendButton({ targetUserId, initialState, friendshipId }: FriendButtonProps) {
  const { t } = useI18n();
  const [state, setState] = useState(initialState);
  const [activeFriendshipId, setActiveFriendshipId] = useState(friendshipId);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const runAction = (
    action: () => Promise<{ ok: boolean; message: string; data?: { friendshipId: string } }>,
    nextState: FriendshipButtonState,
    clearFriendship = false
  ) => {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);

      if (result.ok) {
        setState(nextState);
        setActiveFriendshipId(clearFriendship ? undefined : result.data?.friendshipId ?? activeFriendshipId);
      }
    });
  };

  if (state === "BLOCKED") {
    return (
      <Button type="button" variant="outline" disabled>
        {t("friends.button.blocked")}
      </Button>
    );
  }

  if (state === "RESPOND" && activeFriendshipId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => runAction(() => acceptFriendRequest(activeFriendshipId), "FRIENDS")}
        >
          <Check className="h-4 w-4" />
          {t("friends.button.accept")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => runAction(() => declineFriendRequest(activeFriendshipId), "ADD_FRIEND", true)}
        >
          <X className="h-4 w-4" />
          {t("friends.button.decline")}
        </Button>
        {message ? <p className="w-full text-xs text-muted-foreground">{message}</p> : null}
      </div>
    );
  }

  if (state === "REQUEST_SENT" && activeFriendshipId) {
    return (
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => runAction(() => cancelFriendRequest(activeFriendshipId), "ADD_FRIEND", true)}
        >
          <X className="h-4 w-4" />
          {t("friends.button.requestSent")}
        </Button>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    );
  }

  if (state === "FRIENDS" && activeFriendshipId) {
    return (
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => runAction(() => removeFriend(activeFriendshipId), "ADD_FRIEND", true)}
        >
          <UserCheck className="h-4 w-4" />
          {t("friends.button.friends")}
        </Button>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() => runAction(() => sendFriendRequest(targetUserId), "REQUEST_SENT")}
      >
        <UserPlus className="h-4 w-4" />
        {t("friends.button.add")}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
