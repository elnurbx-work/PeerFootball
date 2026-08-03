import assert from "node:assert/strict";
import { buildOwnedSubscriptionWhere, buildPushSubscriptionUpsert, getPushRequestAuthError } from "@/lib/push-api";
import { pushSubscriptionSchema } from "@/lib/validations/push";
import { shouldAttemptSilentPushSync } from "@/lib/push-notifications";

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

const reassigned = buildPushSubscriptionUpsert({
  userId: "user-2",
  subscription: valid,
  userAgent: "Same browser, new account",
  platform: "Android",
  now
});
assert.equal(reassigned.where.endpoint, upsert.where.endpoint, "account switching must target the same unique endpoint");
assert.equal(reassigned.update.userId, "user-2", "account switching must reassign the endpoint to the current session user");

const secondDevice = pushSubscriptionSchema.parse({
  endpoint: "https://push.example/subscriptions/device-2",
  keys: { p256dh: "secondP256dhKey_123456", auth: "secondAuthKey_123" }
});
const secondDeviceUpsert = buildPushSubscriptionUpsert({
  userId: "user-1",
  subscription: secondDevice,
  userAgent: "Desktop Browser",
  platform: "Windows",
  now
});
assert.notEqual(secondDeviceUpsert.where.endpoint, upsert.where.endpoint, "one user may own multiple device endpoints");
assert.equal(secondDeviceUpsert.create.userId, "user-1");

assert.equal(shouldAttemptSilentPushSync(true, true, "default"), false, "login must not request notification permission");
assert.equal(shouldAttemptSilentPushSync(true, true, "denied"), false);
assert.equal(shouldAttemptSilentPushSync(true, true, "granted"), true, "an existing granted subscription may be synced silently");

console.log("Push API auth, account reassignment, multi-device, silent-sync and owner-scoped delete tests passed.");
