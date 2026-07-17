"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Save } from "lucide-react";
import { deactivateClubAction, updateClubSettingsAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClubDetails } from "@/types/club.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClubSettingsFormProps = {
  club: ClubDetails;
};

export function ClubSettingsForm({ club }: ClubSettingsFormProps) {
  const { t } = useI18n();
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
          <CardTitle>{t("clubs.settingsForm.permissions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <PolicySelect
              label={t("clubs.settingsForm.approvePolicy")}
              name="joinApprovalPolicy"
              defaultValue={club.settings.joinApprovalPolicy}
            />
            <PolicySelect
              label={t("clubs.settingsForm.invitePolicy")}
              name="invitePermissionPolicy"
              defaultValue={club.settings.invitePermissionPolicy}
            />
            <PolicySelect
              label={t("clubs.settingsForm.matchPolicy")}
              name="matchCreatePermissionPolicy"
              defaultValue={club.settings.matchCreatePermissionPolicy}
            />
            <label className="grid gap-2 text-sm font-medium">
              {t("clubs.settingsForm.guestPolicy")}
              <select name="guestInvitePolicy" defaultValue={club.settings.guestInvitePolicy} className={selectClassName}>
                <option value="CLOSED">{t("clubs.settingsForm.closed")}</option>
                <option value="ONLY_OWNER_TD_YTD">{t("clubs.settingsForm.ownerTdYtd")}</option>
                <option value="PLAYERS_CAN_INVITE_FRIENDS">{t("clubs.settingsForm.playersInviteFriends")}</option>
              </select>
            </label>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button type="submit" disabled={pending} className="w-fit">
              <Save className="h-4 w-4" />
              {pending ? t("common.saving") : t("clubs.settingsForm.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("clubs.settingsForm.deactivateTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("clubs.settingsForm.deactivateDescription")}
          </p>
          <Input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder={t("clubs.settingsForm.confirmSlug", { slug: club.slug })}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending || confirm !== club.slug || !club.isActive}
            onClick={deactivateClub}
            className="w-fit"
          >
            <Power className="h-4 w-4" />
            {t("clubs.settingsForm.deactivate")}
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
  const { t } = useI18n();
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select name={name} defaultValue={defaultValue} className={selectClassName}>
        <option value="OWNER_ONLY">{t("clubs.settingsForm.ownerOnly")}</option>
        <option value="OWNER_TD">{t("clubs.settingsForm.ownerTd")}</option>
        <option value="OWNER_TD_YTD">{t("clubs.settingsForm.ownerTdYtdPlus")}</option>
      </select>
    </label>
  );
}
