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

type ClubGuestFormProps = {
  clubId: string;
  guest?: ClubGuestDto;
  onDone?: () => void;
};

export function ClubGuestForm({ clubId, guest, onDone }: ClubGuestFormProps) {
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
        <Input name="fullName" placeholder="Full name" defaultValue={guest?.fullName ?? ""} required />
        <select name="position" defaultValue={guest?.position ?? ""} className={selectClassName}>
          <option value="">Mövqe seçilməyib</option>
          {FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
        </select>
        <Input name="phone" placeholder="Phone" defaultValue={guest?.phone ?? ""} />
      </div>
      <Textarea name="note" placeholder="Note" defaultValue={guest?.note ?? ""} rows={3} />
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        <Save className="h-4 w-4" />
        {pending ? "Saving..." : guest ? "Save guest" : "Add guest"}
      </Button>
    </form>
  );
}

const selectClassName = "h-10 rounded-md border bg-background px-3 text-sm";
