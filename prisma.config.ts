import { existsSync, readFileSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    for (const [key, value] of Object.entries(parseEnvFile(envFile))) {
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  engine: "classic",
  datasource: {
    url: cleanDatabaseUrl(env("DATABASE_URL")),
    directUrl: getDirectDatabaseUrl()
  }
});

function getDirectDatabaseUrl() {
  const directUrl = process.env.DIRECT_URL;

  if (directUrl && !directUrl.includes("123456")) {
    return directUrl;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return env("DIRECT_URL");
  }

  // Schema operations are more reliable over Neon's direct endpoint. A pooled
  // hostname differs only by the `-pooler` suffix, so derive the direct URL
  // when DIRECT_URL is still the example placeholder.
  return toDirectDatabaseUrl(databaseUrl);
}

function toDirectDatabaseUrl(databaseUrl: string) {
  const url = new URL(cleanDatabaseUrl(databaseUrl));
  url.hostname = url.hostname.replace("-pooler.", ".");
  return url.toString();
}

function cleanDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("channel_binding");

  return url.toString();
}

function parseEnvFile(path: string) {
  const values: Record<string, string> = {};

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue = ""] = match;
    const value = rawValue.trim();
    values[key] = value.replace(/^(['"])(.*)\1$/, "$2");
  }

  return values;
}
