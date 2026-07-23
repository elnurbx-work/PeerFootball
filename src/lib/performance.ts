export type PerformanceMetadata = Record<string, string | number | boolean | null>;

const sensitiveMetadataKey =
  /(?:password|token|cookie|email|secret|content|body|message|signature|api.?key|database.?url|user.?id|notification.?id|conversation.?id|match.?id|club.?slug|username|full.?name)/i;

function isSensitiveMetadataKey(key: string) {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.endsWith("count") || normalizedKey.endsWith("length")) {
    return false;
  }
  return sensitiveMetadataKey.test(key);
}

export function performanceNow() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function logPerformance(
  operation: string,
  durationMs: number,
  status: "success" | "error",
  metadata: PerformanceMetadata = {}
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !isSensitiveMetadataKey(key))
  );
  const route = typeof safeMetadata.route === "string" ? safeMetadata.route : "unknown";
  delete safeMetadata.route;
  const line = `[PERF] operation=${operation} durationMs=${durationMs.toFixed(2)} status=${status} route=${route} meta=${JSON.stringify(safeMetadata)}`;

  if (status === "error") {
    console.error(line);
  } else {
    console.info(line);
  }
}

export async function measureAsync<T>(
  operation: string,
  callback: () => Promise<T>,
  metadata: PerformanceMetadata = {}
): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return callback();
  }

  const startedAt = performanceNow();

  try {
    const result = await callback();
    logPerformance(operation, performanceNow() - startedAt, "success", metadata);
    return result;
  } catch (error) {
    logPerformance(operation, performanceNow() - startedAt, "error", metadata);
    throw error;
  }
}
