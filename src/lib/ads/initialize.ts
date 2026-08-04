export type AdSenseQueue = Array<Record<string, unknown>>;

type AdElement = {
  dataset: {
    adsbygoogleStatus?: string;
  };
};

export type AdSenseInitializationResult = "already-initialized" | "initialized";

export function initializeAdSenseElement(
  adElement: AdElement,
  adsbygoogle: AdSenseQueue
): AdSenseInitializationResult {
  const status = adElement.dataset.adsbygoogleStatus;

  if (status === "done" || status === "reserved") {
    return "already-initialized";
  }

  adsbygoogle.push({});
  return "initialized";
}
