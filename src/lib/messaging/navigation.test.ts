import test from "node:test";
import assert from "node:assert/strict";
import {
  clubMessagingHref,
  directMessagingHref,
  resolveMessagingTab,
  sortConversationsByLatestMessage,
  sumUnreadCounts
} from "./navigation";

test("resolveMessagingTab defaults and resolves tabs", () => {
  assert.equal(resolveMessagingTab(), "messages");
  assert.equal(resolveMessagingTab("messages"), "messages");
  assert.equal(resolveMessagingTab("unknown"), "messages");
  assert.equal(resolveMessagingTab("clubs"), "clubs");
});

test("directMessagingHref builds direct messaging URLs", () => {
  assert.equal(directMessagingHref(), "/direct?tab=messages");
  assert.equal(directMessagingHref("direct/1"), "/direct?tab=messages&conversationId=direct%2F1");
});

test("clubMessagingHref builds club messaging URLs", () => {
  assert.equal(clubMessagingHref(), "/direct?tab=clubs");
  assert.equal(clubMessagingHref("club/1"), "/direct?tab=clubs&clubId=club%2F1");
});

test("sumUnreadCounts totals unread counts", () => {
  assert.equal(sumUnreadCounts({ directA: 4, directB: 2 }), 6);
  assert.equal(sumUnreadCounts({}), 0);
});

test("sortConversationsByLatestMessage puts the latest conversation first", () => {
  const conversations = [
    { id: "no-messages", lastMessage: null },
    { id: "older", lastMessage: { createdAt: "2026-08-01T10:00:00.000Z" } },
    { id: "latest", lastMessage: { createdAt: "2026-08-05T10:00:00.000Z" } }
  ];

  assert.deepEqual(
    sortConversationsByLatestMessage(conversations).map(({ id }) => id),
    ["latest", "older", "no-messages"]
  );
  assert.equal(conversations[0]?.id, "no-messages");
});
