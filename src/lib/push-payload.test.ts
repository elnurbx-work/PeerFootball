import assert from "node:assert/strict";
import type { AppNotification } from "@/types/notification.types";
import { urlBase64ToUint8Array } from "@/lib/push-notifications";
import {
  DEFAULT_PUSH_PAYLOAD,
  buildPushPayloadFromNotification,
  normalizePushPayload,
  shouldDeletePushSubscription
} from "@/lib/push-payload";

const bytes = Uint8Array.from([1, 2, 3, 254, 255]);
const encoded = Buffer.from(bytes).toString("base64url");
assert.deepEqual([...urlBase64ToUint8Array(encoded)], [...bytes], "VAPID public keys must decode from base64url");

const directNotification: AppNotification = {
  id: "notification-1",
  type: "MESSAGE",
  title: null,
  body: "This private message must never be exposed",
  readAt: null,
  createdAt: new Date(0).toISOString(),
  actor: { id: "sender-1", name: "Elnur", username: "elnur", image: null },
  postId: null,
  commentId: null,
  conversationId: "conversation-1",
  friendshipId: null,
  matchId: null
};
const directPayload = buildPushPayloadFromNotification(directNotification, "az");
assert.equal(directPayload.url, "/direct?tab=messages&conversationId=conversation-1");
assert.match(directPayload.body, /Elnur/);
assert.doesNotMatch(directPayload.body, /private message/);
assert.equal(directPayload.tag, "message-conversation-1");

const matchPayload = buildPushPayloadFromNotification({
  ...directNotification,
  id: "notification-2",
  type: "MATCH_RESULT_SUBMITTED",
  actor: null,
  conversationId: null,
  matchId: "match-1"
}, "en");
assert.equal(matchPayload.url, "/matches/match-1");
assert.equal(matchPayload.tag, "match_result_submitted-match-1");

assert.deepEqual(normalizePushPayload("not-json"), DEFAULT_PUSH_PAYLOAD);
assert.deepEqual(normalizePushPayload({ title: "missing fields" }), DEFAULT_PUSH_PAYLOAD);
assert.equal(shouldDeletePushSubscription(404), true);
assert.equal(shouldDeletePushSubscription(410), true);
assert.equal(shouldDeletePushSubscription(400), false);
assert.equal(shouldDeletePushSubscription(429), false);
assert.equal(shouldDeletePushSubscription(500), false);

console.log("Push payload privacy, VAPID conversion, fallback and stale-subscription tests passed.");
