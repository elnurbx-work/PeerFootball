import { NextResponse } from "next/server";

export const PRIVATE_NO_STORE = "private, no-store, max-age=0, must-revalidate";

export function withPrivateNoStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", PRIVATE_NO_STORE);
  return response;
}

export function privateJson(data: unknown, init?: ResponseInit) {
  return withPrivateNoStore(NextResponse.json(data, init));
}
