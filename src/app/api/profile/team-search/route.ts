import { NextResponse } from "next/server";
import { searchTeamsByName, TeamSearchServiceError } from "@/server/services/thesportsdb.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ ok: false, message: "Search must be at least 2 characters." }, { status: 400 });
  }

  try {
    const teams = await searchTeamsByName(query);
    return NextResponse.json({ ok: true, teams: teams.slice(0, 5) });
  } catch (error) {
    if (error instanceof TeamSearchServiceError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, message: "Team search is unavailable right now." }, { status: 502 });
  }
}
