export type AdSenseQueue = Array<Record<string, unknown>>;

type AdElement = {
  getAttribute(name: string): string | null;
};

export type AdSenseInitializationResult = "already-initialized" | "initialized";

export function initializeAdSenseElement(
  adElement: AdElement,
  adsbygoogle: AdSenseQueue
): AdSenseInitializationResult {
  const status = adElement.getAttribute("data-adsbygoogle-status");

  if (status === "done" || status === "reserved") {
    return "already-initialized";
  }

  adsbygoogle.push({});
  return "initialized";
}
