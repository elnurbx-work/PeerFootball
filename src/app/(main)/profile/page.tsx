import { ProfileSummary } from "@/components/profile/profile-summary";
import { getCurrentUser } from "@/lib/auth";
import { getProfileSummaryByUserId } from "@/server/queries/profile.queries";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const profile = await getProfileSummaryByUserId(currentUser.id);

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <ProfileSummary
        user={profile}
      />
    </section>
  );
}
