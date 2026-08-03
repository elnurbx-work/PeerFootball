import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(getDatabaseUrl());
  const statements = [
    `ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CLUB_INVITATION'`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushDirectMessages" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushFriendRequests" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushClubNotifications" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushMatchNotifications" BOOLEAN NOT NULL DEFAULT true`,
    `CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "p256dh" TEXT NOT NULL,
      "auth" TEXT NOT NULL,
      "userAgent" TEXT,
      "platform" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "lastUsedAt" TIMESTAMP(3),
      CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint")`,
    `CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId")`
  ];

  for (const statement of statements) {
    await sql.query(statement, []);
  }
  console.log("Push schema synchronized without Prisma migrations.");
}

function getDatabaseUrl() {
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;
    const line = readFileSync(path, "utf8").split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
    if (line) return line.slice("DATABASE_URL=".length).trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error("DATABASE_URL is not configured.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Push schema synchronization failed.");
  process.exitCode = 1;
});
