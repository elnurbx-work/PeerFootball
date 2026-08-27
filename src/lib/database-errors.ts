const NEON_COMPUTE_QUOTA_MESSAGE = "exceeded the compute time quota";

export function isNeonComputeQuotaError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes(NEON_COMPUTE_QUOTA_MESSAGE);
}
