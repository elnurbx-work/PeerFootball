"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Save } from "lucide-react";
import { deactivateClubAction, updateClubSettingsAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClubDetails } from "@/types/club.types";

type ClubSettingsFormProps = {
  club: ClubDetails;
};

export function ClubSettingsForm({ club }: ClubSettingsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setMessage("");
    startTransition(async () => {
      const result = await updateClubSettingsAction(club.id, Object.fromEntries(formData));
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function deactivateClub() {
    setMessage("");
    startTransition(async () => {
      const result = await deactivateClubAction(club.id);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <PolicySelect
              label="Who can approve join requests"
              name="joinApprovalPolicy"
              defaultValue={club.settings.joinApprovalPolicy}
            />
            <PolicySelect
              label="Who can invite players"
              name="invitePermissionPolicy"
              defaultValue={club.settings.invitePermissionPolicy}
            />
            <PolicySelect
              label="Who can create future matches"
              name="matchCreatePermissionPolicy"
              defaultValue={club.settings.matchCreatePermissionPolicy}
            />
            <label className="grid gap-2 text-sm font-medium">
              Guest invite policy
              <select name="guestInvitePolicy" defaultValue={club.settings.guestInvitePolicy} className={selectClassName}>
                <option value="CLOSED">Closed</option>
                <option value="ONLY_OWNER_TD_YTD">Owner, TD, YTD</option>
                <option value="PLAYERS_CAN_INVITE_FRIENDS">Players can invite friends</option>
              </select>
            </label>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button type="submit" disabled={pending} className="w-fit">
              <Save className="h-4 w-4" />
              {pending ? "Saving..." : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deactivate club</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            Deactivation keeps club history but blocks new members, matches, and settings changes.
          </p>
          <Input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder={`Type ${club.slug} to confirm`}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending || confirm !== club.slug || !club.isActive}
            onClick={deactivateClub}
            className="w-fit"
          >
            <Power className="h-4 w-4" />
            Deactivate club
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const selectClassName =
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

function PolicySelect({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select name={name} defaultValue={defaultValue} className={selectClassName}>
        <option value="OWNER_ONLY">Owner only</option>
        <option value="OWNER_TD">Owner + TD</option>
        <option value="OWNER_TD_YTD">Owner + TD + YTD</option>
      </select>
    </label>
  );
}
