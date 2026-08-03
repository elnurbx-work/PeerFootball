import { getCurrentUser } from "@/lib/auth";
import { privateJson } from "@/lib/http/no-store";
import { prisma } from "@/lib/prisma";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validations/push";
import { isWebPushConfigured } from "@/server/services/push-notification.service";
import { getServerTranslator } from "@/i18n/server";
import { buildOwnedSubscriptionWhere, buildPushSubscriptionUpsert, getPushRequestAuthError } from "@/lib/push-api";

export const runtime = "nodejs";

const MAX_SUBSCRIPTIONS_PER_USER = 20;

export async function POST(request: Request) {
  const t = await getServerTranslator();
  const user = await getCurrentUser();
  const authError = getPushRequestAuthError(user?.id, request);
  if (authError === 401) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  if (authError === 403) return privateJson({ ok: false, message: t("responses.pushApi.originInvalid") }, { status: 403 });
  if (!user) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  if (!isWebPushConfigured()) return privateJson({ ok: false, message: t("responses.pushApi.disabled") }, { status: 503 });

  const parsed = pushSubscriptionSchema.safeParse(await readJson(request));
  if (!parsed.success) return privateJson({ ok: false, message: t("responses.pushApi.invalidSubscription") }, { status: 400 });

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: parsed.data.endpoint },
    select: { userId: true }
  });
  if (existing?.userId !== user.id) {
    const count = await prisma.pushSubscription.count({ where: { userId: user.id } });
    if (count >= MAX_SUBSCRIPTIONS_PER_USER) {
      return privateJson({ ok: false, message: t("responses.pushApi.deviceLimit") }, { status: 429 });
    }
  }

  await prisma.pushSubscription.upsert(buildPushSubscriptionUpsert({
    userId: user.id,
    subscription: parsed.data,
    userAgent: request.headers.get("user-agent"),
    platform: getPlatform(request.headers),
    now: new Date()
  }));

  return privateJson({ ok: true, message: t("responses.pushApi.subscribed"), data: { subscribed: true } });
}

export async function DELETE(request: Request) {
  const t = await getServerTranslator();
  const user = await getCurrentUser();
  const authError = getPushRequestAuthError(user?.id, request);
  if (authError === 401) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  if (authError === 403) return privateJson({ ok: false, message: t("responses.pushApi.originInvalid") }, { status: 403 });
  if (!user) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });

  const parsed = pushUnsubscribeSchema.safeParse(await readJson(request));
  if (!parsed.success) return privateJson({ ok: false, message: t("responses.pushApi.invalidEndpoint") }, { status: 400 });

  const deleted = await prisma.pushSubscription.deleteMany({
    where: buildOwnedSubscriptionWhere(user.id, parsed.data.endpoint)
  });

  return privateJson({ ok: true, message: t("responses.pushApi.unsubscribed"), data: { subscribed: false, removed: deleted.count > 0 } });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getPlatform(headers: Headers) {
  return headers.get("sec-ch-ua-platform")?.replaceAll('"', "") || "unknown";
}
