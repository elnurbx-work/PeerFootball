import { getCurrentUser } from "@/lib/auth";
import { searchPlayersForUser } from "@/server/queries/user.queries";
import { getServerTranslator } from "@/i18n/server";
import { privateJson } from "@/lib/http/no-store";

export async function GET(request: Request) {
  const t = await getServerTranslator();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return privateJson({ ok: true, players: [] });
  }

  const players = await searchPlayersForUser(currentUser.id, query);

  return privateJson({
    ok: true,
    players: players.items.slice(0, 8).map((player) => ({
      id: player.id,
      name: player.name,
      username: player.username,
      image: player.image,
      preferredPosition: player.preferredPosition,
      location: player.location
    }))
  });
}
