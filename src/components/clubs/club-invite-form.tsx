"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { inviteUserToClubAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClubInviteFormProps = {
  clubId: string;
  canAssignTd: boolean;
};

type InviteSearchResult = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  preferredPosition: string | null;
  location: string | null;
};

export function ClubInviteForm({ clubId, canAssignTd }: ClubInviteFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("PLAYER");
  const [players, setPlayers] = useState<InviteSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    setMessage("");

    if (trimmedQuery.length < 2) {
      setPlayers([]);
      setMessage(t("clubs.inviteForm.minSearch"));
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/clubs/player-search?q=${encodeURIComponent(trimmedQuery)}`);
      const data = (await response.json().catch(() => null)) as
        | { ok: true; players: InviteSearchResult[] }
        | { ok: false; message: string }
        | null;

      if (!data?.ok) {
        setPlayers([]);
        setMessage(data?.message ?? t("clubs.inviteForm.searchFailed"));
        return;
      }

      setPlayers(data.players);
      setMessage(data.players.length ? "" : t("clubs.inviteForm.empty"));
    });
  }

  function invitePlayer(userId: string) {
    setMessage("");
    startTransition(async () => {
      const result = await inviteUserToClubAction({
        clubId,
        userId,
        role
      });
      setMessage(result.message);

      if (result.ok) {
        setPlayers((current) => current.filter((player) => player.id !== userId));
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("clubs.inviteForm.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form className="grid gap-3 md:grid-cols-[1fr_160px_auto]" onSubmit={handleSearch}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("clubs.inviteForm.searchPlaceholder")}
              type="search"
            />
          </div>
          <select value={role} onChange={(event) => setRole(event.target.value)} className={selectClassName}>
            <option value="PLAYER">{t("clubs.common.rolePlayer")}</option>
            <option value="YTD">YTD</option>
            {canAssignTd ? <option value="TD">TD</option> : null}
          </select>
          <Button type="submit" disabled={pending}>
            <Search className="h-4 w-4" />
            {t("clubs.inviteForm.search")}
          </Button>
        </form>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        {players.length ? (
          <div className="grid gap-2">
            {players.map((player) => {
              const displayName = player.name ?? t("clubs.inviteForm.playerFallback");
              const meta = [player.preferredPosition, player.location].filter(Boolean).join(" / ");

              return (
                <div key={player.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {player.image ? <img src={player.image} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">@{player.username ?? t("clubs.inviteForm.profileFallback")}</p>
                      {meta ? <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p> : null}
                    </div>
                  </div>
                  <Button type="button" size="sm" disabled={pending} onClick={() => invitePlayer(player.id)}>
                    <UserPlus className="h-4 w-4" />
                    {t("clubs.inviteForm.invite")}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const selectClassName =
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";
