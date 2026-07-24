import { handlers } from "@/auth";
import { withPrivateNoStore } from "@/lib/http/no-store";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return withPrivateNoStore(await handlers.GET(request));
}

export async function POST(request: NextRequest) {
  return withPrivateNoStore(await handlers.POST(request));
}
