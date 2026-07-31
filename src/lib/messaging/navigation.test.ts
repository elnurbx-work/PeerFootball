import assert from "node:assert/strict";
import {
  clubMessagingHref,
  directMessagingHref,
  resolveMessagingTab,
  sumUnreadCounts
} from "./navigation";

assert.equal(resolveMessagingTab(), "messages");
assert.equal(resolveMessagingTab("messages"), "messages");
assert.equal(resolveMessagingTab("unknown"), "messages");
assert.equal(resolveMessagingTab("clubs"), "clubs");

assert.equal(directMessagingHref(), "/direct?tab=messages");
assert.equal(directMessagingHref("direct/1"), "/direct?tab=messages&conversationId=direct%2F1");
assert.equal(clubMessagingHref(), "/direct?tab=clubs");
assert.equal(clubMessagingHref("club/1"), "/direct?tab=clubs&clubId=club%2F1");
assert.equal(sumUnreadCounts({ directA: 4, directB: 2 }), 6);
assert.equal(sumUnreadCounts({}), 0);

console.info("Messaging tab defaults, room URLs, back targets and unread totals passed.");
