"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power } from "lucide-react";
import { deactivateClubGuestAction } from "@/actions/club.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubGuestForm } from "@/components/clubs/club-guest-form";
import type { ClubGuestDto } from "@/types/club.types";

type ClubGuestListProps = {
  clubId: string;
  guests: ClubGuestDto[];
  canManage: boolean;
};

export function ClubGuestList({ clubId, guests, canManage }: ClubGuestListProps) {
  const router = useRouter();
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function deactivateGuest(guestId: string) {
    setMessage("");
    startTransition(async () => {
      const result = await deactivateClubGuestAction(guestId);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-4">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add guest</CardTitle>
          </CardHeader>
          <CardContent>
            <ClubGuestForm clubId={clubId} />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Guest list</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          {guests.map((guest) => (
            <div key={guest.id} className="rounded-md border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{guest.fullName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {guest.position || "No position set"}
                  </p>
                  {guest.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{guest.note}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={guest.isActive ? "default" : "secondary"}>{guest.isActive ? "Active" : "Inactive"}</Badge>
                  {canManage && guest.isActive ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingGuestId(editingGuestId === guest.id ? null : guest.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => deactivateGuest(guest.id)}
                      >
                        <Power className="h-4 w-4" />
                        Deactivate
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              {editingGuestId === guest.id ? (
                <div className="mt-4 border-t pt-4">
                  <ClubGuestForm clubId={clubId} guest={guest} onDone={() => setEditingGuestId(null)} />
                </div>
              ) : null}
            </div>
          ))}
          {!guests.length ? <p className="text-center text-sm text-muted-foreground">No guests yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
