import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchPlayersForUser } from "@/server/queries/user.queries";
import { getServerTranslator } from "@/i18n/server";

export async function GET(request: Request) {
  const t = await getServerTranslator();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ ok: true, players: [] });
  }

  const players = await searchPlayersForUser(currentUser.id, query);

  return NextResponse.json({
    ok: true,
    players: players.slice(0, 8).map((player) => ({
      id: player.id,
      name: player.name,
      username: player.username,
      image: player.image,
      preferredPosition: player.preferredPosition,
      location: player.location
    }))
  });
}
