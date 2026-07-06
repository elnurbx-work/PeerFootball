import { createIconResponse } from "../_icon-response";

export const runtime = "edge";

export function GET() {
  return createIconResponse(180);
}
