"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { transferClubOwnershipAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClubDetails, ClubMemberDto } from "@/types/club.types";

type OwnerTransferFormProps = {
  club: ClubDetails;
  members: ClubMemberDto[];
};

export function OwnerTransferForm({ club, members }: OwnerTransferFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const eligibleMembers = members.filter((member) => member.status === "ACTIVE" && member.role !== "OWNER");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setMessage("");
    startTransition(async () => {
      const result = await transferClubOwnershipAction({
        clubId: club.id,
        newOwnerMemberId: formData.get("newOwnerMemberId"),
        oldOwnerNewRole: formData.get("oldOwnerNewRole"),
        confirm: formData.get("confirm")
      });
      setMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer ownership</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            New owner
            <select name="newOwnerMemberId" className={selectClassName} required>
              <option value="">Choose member</option>
              {eligibleMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user.name ?? member.user.username ?? member.userId} ({member.role})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Old owner role after transfer
            <select name="oldOwnerNewRole" className={selectClassName} defaultValue="TD">
              <option value="TD">TD</option>
              <option value="YTD">YTD</option>
              <option value="PLAYER">Player</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Confirmation
            <Input name="confirm" placeholder="Type TRANSFER" />
          </label>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={pending || !eligibleMembers.length} className="w-fit">
            <Crown className="h-4 w-4" />
            Transfer owner
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const selectClassName =
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";
