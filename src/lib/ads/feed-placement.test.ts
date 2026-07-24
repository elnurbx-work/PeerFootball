import assert from "node:assert/strict";
import { createAdSenseConfig } from "../../config/adsense";
import { getFeedAdPostIndexes } from "./feed-placement";
import { initializeAdSenseElement } from "./initialize";
import {
  createBaselineContentSecurityPolicy,
  createStrictAdSenseContentSecurityPolicy
} from "../security/headers";
import { normalizeMatchVideoUrl } from "../videos/video-url";

const defaults = { enabled: true, interval: 2, maximumAds: 5 };

assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 0 }), []);
assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 1 }), []);

assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 2 }), [1]);
assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 4 }), [1, 3]);
assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 6 }), [1, 3, 5]);

assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 10 }), [1, 3, 5, 7, 9]);

assert.deepEqual(
  getFeedAdPostIndexes({ ...defaults, postCount: 10, interval: 4 }),
  [3, 7]
);

assert.deepEqual(getFeedAdPostIndexes({ ...defaults, postCount: 10, enabled: false }), []);

const flattenedPosts = [["p1", "p2", "p3"], ["p4", "p5"]].flat();
assert.deepEqual(
  getFeedAdPostIndexes({ ...defaults, postCount: flattenedPosts.length }),
  [1, 3]
);

const validEnvironment = {
  enabled: "true",
  clientId: "ca-pub-1234567890123456",
  feedSlot: "1234567890",
  feedLayoutKey: "-6t+ed+2i-1n-4w",
  feedInterval: "2",
  maximumFeedAds: "5"
};

assert.equal(createAdSenseConfig(validEnvironment).enabled, true);
assert.equal(createAdSenseConfig({ ...validEnvironment, enabled: "false" }).enabled, false);
assert.equal(createAdSenseConfig({ ...validEnvironment, clientId: undefined }).enabled, false);
assert.equal(createAdSenseConfig({ ...validEnvironment, feedSlot: undefined }).enabled, false);
assert.equal(createAdSenseConfig({ ...validEnvironment, feedLayoutKey: undefined }).enabled, false);
assert.equal(createAdSenseConfig({ ...validEnvironment, feedInterval: "0" }).feedInterval, 2);
assert.equal(createAdSenseConfig({ ...validEnvironment, maximumFeedAds: "invalid" }).maximumFeedAds, 5);
assert.equal(createAdSenseConfig({ ...validEnvironment, maximumFeedAds: "0" }).maximumFeedAds, 0);

const pendingAdElement = {
  getAttribute: () => null
};
const completedAdElement = {
  getAttribute: (name: string) => (name === "data-adsbygoogle-status" ? "done" : null)
};
const queue: Array<Record<string, unknown>> = [];

assert.equal(initializeAdSenseElement(pendingAdElement, queue), "initialized");
assert.equal(queue.length, 1);
assert.equal(initializeAdSenseElement(completedAdElement, queue), "already-initialized");
assert.equal(queue.length, 1);

const baselineCsp = createBaselineContentSecurityPolicy();
assert.match(baselineCsp, /frame-ancestors 'none'/);
assert.match(baselineCsp, /object-src 'none'/);

const strictCsp = createStrictAdSenseContentSecurityPolicy("testnonce");
assert.match(strictCsp, /script-src 'nonce-testnonce' 'strict-dynamic'/);
assert.match(strictCsp, /frame-ancestors 'none'/);

const youtubeVideo = normalizeMatchVideoUrl("https://youtu.be/dQw4w9WgXcQ");
assert.equal(youtubeVideo.provider, "YOUTUBE");
assert.equal(youtubeVideo.embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");

console.log("Ads, security header, and media privacy tests passed.");
