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
    url: env("DATABASE_URL")
  }
});

function parseEnvFile(path: string) {
  const values: Record<string, string> = {};

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue = ""] = match;
    const value = rawValue.trim();
    values[key] = value.replace(/^(['"])(.*)\1$/, "$2");
  }

  return values;
}
