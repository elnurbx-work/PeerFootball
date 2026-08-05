import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectDevice,
  type NavigatorLike
} from "./device-detection";
import { isInstalledEnvironment } from "./install-status";
import {
  requestPwaInstall,
  type BeforeInstallPromptEvent
} from "./install-prompt";

function navigatorFixture(userAgent: string, platform: string, maxTouchPoints = 0): NavigatorLike {
  return { userAgent, platform, maxTouchPoints };
}

describe("PWA device detection", () => {
  it("detects Android Chrome", () => {
    const result = detectDevice(navigatorFixture(
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
      "Linux armv8l",
      5
    ));
    assert.deepEqual(result, { platform: "android", browser: "chrome" });
  });

  it("detects Samsung Internet before Chrome", () => {
    const result = detectDevice(navigatorFixture(
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36",
      "Linux armv8l",
      5
    ));
    assert.deepEqual(result, { platform: "android", browser: "samsung" });
  });

  it("detects Windows Edge before Chrome", () => {
    const result = detectDevice(navigatorFixture(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0",
      "Win32"
    ));
    assert.deepEqual(result, { platform: "windows", browser: "edge" });
  });

  it("detects macOS Safari", () => {
    const result = detectDevice(navigatorFixture(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
      "MacIntel"
    ));
    assert.deepEqual(result, { platform: "macos", browser: "safari" });
  });

  it("detects iPhone Safari", () => {
    const result = detectDevice(navigatorFixture(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1",
      "iPhone",
      5
    ));
    assert.deepEqual(result, { platform: "ios", browser: "safari" });
  });

  it("detects iPadOS using the desktop user agent hint", () => {
    const result = detectDevice(navigatorFixture(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
      "MacIntel",
      5
    ));
    assert.deepEqual(result, { platform: "ipados", browser: "safari" });
  });

  it("falls back safely for an unknown browser", () => {
    assert.deepEqual(
      detectDevice(navigatorFixture("ExampleBot/1.0", "MysteryOS")),
      { platform: "unknown", browser: "unknown" }
    );
  });
});

describe("PWA installed status", () => {
  it("detects standalone display mode", () => {
    assert.equal(isInstalledEnvironment({ matchesStandalone: true }), true);
  });

  it("detects iOS navigator standalone mode", () => {
    assert.equal(isInstalledEnvironment({ matchesStandalone: false, navigatorStandalone: true }), true);
  });

  it("detects an Android app referrer", () => {
    assert.equal(isInstalledEnvironment({ matchesStandalone: false, referrer: "android-app://com.android.chrome" }), true);
  });

  it("leaves normal browser mode uninstalled", () => {
    assert.equal(isInstalledEnvironment({ matchesStandalone: false, navigatorStandalone: false }), false);
  });
});

describe("beforeinstallprompt handling", () => {
  function promptFixture(outcome: "accepted" | "dismissed", calls: string[]) {
    const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
    event.prompt = async () => {
      calls.push("prompt");
    };
    Object.defineProperty(event, "userChoice", {
      value: Promise.resolve({ outcome, platform: "web" })
    });
    return event;
  }

  it("calls prompt only when explicitly requested and returns accepted", async () => {
    const calls: string[] = [];
    const event = promptFixture("accepted", calls);
    assert.deepEqual(calls, []);
    assert.equal(await requestPwaInstall(event), "accepted");
    assert.deepEqual(calls, ["prompt"]);
  });

  it("returns dismissed", async () => {
    const calls: string[] = [];
    assert.equal(await requestPwaInstall(promptFixture("dismissed", calls)), "dismissed");
    assert.deepEqual(calls, ["prompt"]);
  });

  it("returns unavailable without a stored prompt", async () => {
    assert.equal(await requestPwaInstall(null), "unavailable");
  });
});
