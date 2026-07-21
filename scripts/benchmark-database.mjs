import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile?.(".env.local");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

neonConfig.webSocketConstructor = WebSocket;
const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.delete("channel_binding");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl.toString() })
});

const warmups = Number(process.env.PERF_DB_WARMUP_RUNS ?? "3");
const samples = Number(process.env.PERF_DB_SAMPLE_RUNS ?? "10");

function percentile(values, percentage) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((percentage / 100) * sorted.length) - 1)];
}

async function timeQuery() {
  const startedAt = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  return performance.now() - startedAt;
}

try {
  for (let index = 0; index < warmups; index += 1) await timeQuery();
  const durations = [];
  for (let index = 0; index < samples; index += 1) durations.push(await timeQuery());
  console.log(JSON.stringify({
    warmups,
    samples,
    minMs: Number(Math.min(...durations).toFixed(2)),
    medianMs: Number(percentile(durations, 50).toFixed(2)),
    p95Ms: Number(percentile(durations, 95).toFixed(2))
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
