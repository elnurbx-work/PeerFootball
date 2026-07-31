import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const patterns = [
  /\b(test|demo|lorem ipsum|asdf|qwerty)\b/i,
  /^(.)\1{4,}$/i,
  /^.{0,2}$/
];

async function main() {
  if (apply && process.env.ALLOW_CONTENT_MODERATION_APPLY !== "true") {
    throw new Error("Apply blocked. Set ALLOW_CONTENT_MODERATION_APPLY=true and run again with --apply.");
  }
  const posts = await prisma.post.findMany({
    where: { isHidden: false, visibility: "PUBLIC", content: { not: null } },
    select: { id: true, content: true, createdAt: true, authorId: true },
    orderBy: { createdAt: "asc" }
  });
  const candidates = posts.filter((post) => {
    const content = post.content?.trim() ?? "";
    return patterns.some((pattern) => pattern.test(content));
  });
  console.table(candidates.map((post) => ({
    id: post.id,
    authorId: post.authorId,
    createdAt: post.createdAt.toISOString(),
    preview: post.content?.slice(0, 80)
  })));
  console.info(`${candidates.length} candidate(s). Mode: ${apply ? "APPLY" : "DRY RUN"}.`);
  if (!apply || candidates.length === 0) return;
  const result = await prisma.post.updateMany({
    where: { id: { in: candidates.map((post) => post.id) }, isHidden: false },
    data: {
      isHidden: true,
      hiddenAt: new Date(),
      moderationNote: "Low-quality public content audit; reversible moderation action."
    }
  });
  console.info(`${result.count} post(s) hidden. No post was deleted.`);
}

main().finally(() => prisma.$disconnect());
