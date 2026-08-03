import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const expected = new Set([
  "PushSubscription.auth",
  "PushSubscription.createdAt",
  "PushSubscription.endpoint",
  "PushSubscription.id",
  "PushSubscription.lastUsedAt",
  "PushSubscription.p256dh",
  "PushSubscription.platform",
  "PushSubscription.updatedAt",
  "PushSubscription.userAgent",
  "PushSubscription.userId",
  "User.pushClubNotifications",
  "User.pushDirectMessages",
  "User.pushFriendRequests",
  "User.pushMatchNotifications",
  "User.pushNotificationsEnabled"
]);
async function main() {
  const sql = neon(getDatabaseUrl());
  const rows = await sql.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = $1
       AND (table_name = $2 OR (table_name = $3 AND column_name LIKE $4))
     ORDER BY table_name, column_name`,
    ["public", "PushSubscription", "User", "push%"]
  ) as Array<{ table_name: string; column_name: string }>;
  const actual = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));
  const missing = [...expected].filter((column) => !actual.has(column));

  const enumRows = await sql.query(
    `SELECT enumlabel
     FROM pg_enum
     JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
     WHERE pg_type.typname = $1 AND enumlabel = $2`,
    ["NotificationType", "CLUB_INVITATION"]
  ) as Array<{ enumlabel: string }>;
  const indexRows = await sql.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = $1 AND tablename = $2 AND indexname = ANY($3::text[])`,
    [
      "public",
      "PushSubscription",
      ["PushSubscription_endpoint_key", "PushSubscription_userId_idx"]
    ]
  ) as Array<{ indexname: string }>;
  const constraintRows = await sql.query(
    `SELECT conname
     FROM pg_constraint
     WHERE conrelid = $1::regclass AND conname = $2`,
    ['"PushSubscription"', "PushSubscription_userId_fkey"]
  ) as Array<{ conname: string }>;

  if (enumRows.length === 0) missing.push("NotificationType.CLUB_INVITATION");

  const indexes = new Set(indexRows.map((row) => row.indexname));
  for (const index of ["PushSubscription_endpoint_key", "PushSubscription_userId_idx"]) {
    if (!indexes.has(index)) missing.push(`index.${index}`);
  }

  if (constraintRows.length === 0) missing.push("foreignKey.PushSubscription_userId_fkey");

  if (missing.length) {
    throw new Error(`Push schema is incomplete. Missing: ${missing.join(", ")}`);
  }
  console.log("Push schema columns, enum, indexes and foreign key are present.");
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
  console.error(error instanceof Error ? error.message : "Push schema verification failed.");
  process.exitCode = 1;
});
