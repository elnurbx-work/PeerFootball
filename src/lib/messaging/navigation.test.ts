import test from "node:test";
import assert from "node:assert/strict";
import {
  clubMessagingHref,
  directMessagingHref,
  resolveMessagingTab,
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
