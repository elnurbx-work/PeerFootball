import { NextResponse } from "next/server";
import { searchTeamsByName, TeamSearchServiceError } from "@/server/services/thesportsdb.service";
import { getServerTranslator } from "@/i18n/server";

export async function GET(request: Request) {
  const t = await getServerTranslator();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ ok: false, message: t("responses.api.searchMin") }, { status: 400 });
  }

  try {
    const teams = await searchTeamsByName(query);
    return NextResponse.json({ ok: true, teams: teams.slice(0, 5) });
  } catch (error) {
    if (error instanceof TeamSearchServiceError) return NextResponse.json({ ok: false, message: t("responses.api.teamSearchUnavailable") }, { status: error.status });

    return NextResponse.json({ ok: false, message: t("responses.api.teamSearchUnavailable") }, { status: 502 });
  }
}
