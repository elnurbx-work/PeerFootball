"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClubGuestAction, updateClubGuestAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ClubGuestDto } from "@/types/club.types";
import { FOOTBALL_POSITIONS } from "@/lib/football-positions";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClubGuestFormProps = {
  clubId: string;
  guest?: ClubGuestDto;
  onDone?: () => void;
};

export function ClubGuestForm({ clubId, guest, onDone }: ClubGuestFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);

    setMessage("");
    startTransition(async () => {
      const result = guest
        ? await updateClubGuestAction({ guestId: guest.id, ...payload })
        : await createClubGuestAction({ clubId, ...payload });
      setMessage(result.message);

      if (result.ok) {
        form.reset();
        onDone?.();
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="fullName" placeholder={t("clubs.guestForm.fullName")} defaultValue={guest?.fullName ?? ""} required />
        <select name="position" defaultValue={guest?.position ?? ""} className={selectClassName}>
          <option value="">{t("clubs.guestForm.noPosition")}</option>
          {FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
        </select>
        <Input name="phone" placeholder={t("clubs.guestForm.phone")} defaultValue={guest?.phone ?? ""} />
      </div>
      <Textarea name="note" placeholder={t("clubs.guestForm.note")} defaultValue={guest?.note ?? ""} rows={3} />
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        <Save className="h-4 w-4" />
        {pending ? t("common.saving") : guest ? t("clubs.guestForm.save") : t("clubs.guestForm.add")}
      </Button>
    </form>
  );
}

const selectClassName = "h-10 rounded-md border bg-background px-3 text-sm";
