import { PrismaClient, TeamRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "alex@fanpitch.local" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "alex@fanpitch.local",
      username: "alexplays",
      bio: "Sunday league midfielder looking for sharp passing and better finishing.",
      favoriteClub: "Arsenal",
      preferredPosition: "CM",
      avoidedPosition: "GK",
      location: "Baku",
      playerStats: {
        create: {
          matchesPlayed: 12,
          goals: 5,
          assists: 8,
          preferredFoot: "Right"
        }
      }
    }
  });

  await prisma.post.create({
    data: {
      authorId: user.id,
      content: "Looking for players for a 7-a-side match this weekend."
    }
  });

  await prisma.team.create({
    data: {
      name: "Northside FC",
      description: "Casual but competitive weekend football team.",
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: TeamRole.OWNER,
          position: "CM"
        }
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
