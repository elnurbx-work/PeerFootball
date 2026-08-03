import assert from "node:assert/strict";
import { buildOwnedSubscriptionWhere, buildPushSubscriptionUpsert, getPushRequestAuthError } from "@/lib/push-api";
import { pushSubscriptionSchema } from "@/lib/validations/push";

const sameOriginRequest = new Request("https://peerfootball.app/api/push/subscribe", {
  method: "POST",
  headers: { origin: "https://peerfootball.app" }
});
assert.equal(getPushRequestAuthError(null, sameOriginRequest), 401, "unauthenticated requests must be rejected");
assert.equal(getPushRequestAuthError("user-1", sameOriginRequest), null);
assert.equal(getPushRequestAuthError("user-1", new Request(sameOriginRequest.url, {
  method: "POST",
  headers: { origin: "https://attacker.example" }
})), 403, "cross-origin mutations must be rejected");

assert.equal(pushSubscriptionSchema.safeParse({ endpoint: "invalid", keys: {} }).success, false);
const valid = pushSubscriptionSchema.parse({
  endpoint: "https://push.example/subscriptions/device-1",
  keys: { p256dh: "abcDEF123_-abcDEF123_-", auth: "authKEY123_-" }
});
const now = new Date(0);
const upsert = buildPushSubscriptionUpsert({ userId: "user-1", subscription: valid, userAgent: "Browser", platform: "Android", now });
assert.equal(upsert.where.endpoint, valid.endpoint);
assert.equal(upsert.create.userId, "user-1", "valid subscriptions must be assigned to the authenticated user");
assert.equal(upsert.update.userId, "user-1", "an existing endpoint must be reassigned only to the authenticated user");
assert.deepEqual(buildOwnedSubscriptionWhere("user-1", valid.endpoint), {
  userId: "user-1",
  endpoint: valid.endpoint
}, "unsubscribe must always be scoped to the authenticated owner");

console.log("Push API auth, validation, upsert and owner-scoped delete tests passed.");
