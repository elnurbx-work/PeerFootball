import { getCurrentUser } from "@/lib/auth";
import { privateJson } from "@/lib/http/no-store";
import { prisma } from "@/lib/prisma";
import { isWebPushConfigured } from "@/server/services/push-notification.service";
import { getServerTranslator } from "@/i18n/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const t = await getServerTranslator();
  const user = await getCurrentUser();
  if (!user) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });

  const endpoint = new URL(request.url).searchParams.get("endpoint");
  const subscribed = endpoint
    ? Boolean(await prisma.pushSubscription.findFirst({ where: { endpoint, userId: user.id }, select: { id: true } }))
    : false;

  return privateJson({ ok: true, data: { enabled: isWebPushConfigured(), subscribed } });
}
