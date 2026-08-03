import { getCurrentUser } from "@/lib/auth";
import { privateJson } from "@/lib/http/no-store";
import { isSameOriginMutation } from "@/lib/http/same-origin";
import { isPushTestAllowed } from "@/lib/push-api";
import { isWebPushConfigured, sendPushToUser } from "@/server/services/push-notification.service";
import { getServerTranslator } from "@/i18n/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const t = await getServerTranslator();
  const user = await getCurrentUser();
  if (!user) return privateJson({ ok: false, message: t("responses.signInRequired") }, { status: 401 });
  if (!isSameOriginMutation(request)) return privateJson({ ok: false, message: t("responses.pushApi.originInvalid") }, { status: 403 });
  if (!isPushTestAllowed(process.env.NODE_ENV, user.email, process.env.ADMIN_EMAIL)) {
    return privateJson({ ok: false, success: false, message: t("responses.pushApi.notFound") }, { status: 404 });
  }
  if (!isWebPushConfigured()) {
    return privateJson({ ok: false, success: false, message: t("responses.pushApi.disabled") }, { status: 503 });
  }

  const result = await sendPushToUser({
    userId: user.id,
    payload: {
      title: "PeerFootball test bildirişi",
      body: "Push notification sistemi uğurla işləyir.",
      icon: "/icons/icon-192",
      badge: "/icons/icon-192",
      tag: "peerfootball-feed-push-test",
      url: "/feed",
      type: "PUSH_TEST"
    }
  });
  const success = result.sent > 0;
  const data = {
    subscriptionCount: result.found,
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    expiredRemoved: result.stale,
    results: result.results
  };

  return privateJson({
    ok: success,
    success,
    message: success ? t("responses.pushApi.testSent") : t("responses.pushApi.testFailed"),
    data
  }, { status: success ? 200 : 503 });
}
