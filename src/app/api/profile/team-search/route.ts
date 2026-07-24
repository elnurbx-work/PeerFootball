import { searchTeamsByName, TeamSearchServiceError } from "@/server/services/thesportsdb.service";
import { getServerTranslator } from "@/i18n/server";
import { privateJson } from "@/lib/http/no-store";

export async function GET(request: Request) {
  const t = await getServerTranslator();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return privateJson({ ok: false, message: t("responses.api.searchMin") }, { status: 400 });
  }

  try {
    const teams = await searchTeamsByName(query);
    return privateJson({ ok: true, teams: teams.slice(0, 5) });
  } catch (error) {
    if (error instanceof TeamSearchServiceError) return privateJson({ ok: false, message: t("responses.api.teamSearchUnavailable") }, { status: error.status });

    return privateJson({ ok: false, message: t("responses.api.teamSearchUnavailable") }, { status: 502 });
  }
}
