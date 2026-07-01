import { ProfileSummary } from "@/components/profile/profile-summary";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      bio: true,
      favoriteClub: true,
      preferredPosition: true,
      avoidedPosition: true,
      location: true,
      playerStats: {
        select: {
          matchesPlayed: true,
          goals: true,
          assists: true,
          preferredFoot: true
        }
      }
    }
  });

  if (!profile?.email) {
    redirect("/auth/login");
  }

  const editableProfile = {
    ...profile,
    name: profile.name ?? "",
    email: profile.email,
    username: profile.username ?? ""
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <ProfileSummary user={{ ...profile, stats: profile.playerStats }} />
      <ProfileEditForm profile={{ ...editableProfile, stats: profile.playerStats }} />
    </section>
  );
}
