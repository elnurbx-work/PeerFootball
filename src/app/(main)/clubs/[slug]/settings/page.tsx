import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClubSettingsForm } from "@/components/clubs/club-settings-form";
import { EditClubForm } from "@/components/clubs/edit-club-form";
import { OwnerTransferForm } from "@/components/clubs/owner-transfer-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug, getClubMembers } from "@/server/queries/club.queries";
import { createTranslator } from "@/i18n/dictionary";

type ClubSettingsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClubSettingsPage({ params }: ClubSettingsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), currentUser.id);

  if (!club) {
    notFound();
  }

  if (club.currentUserMemberStatus !== "ACTIVE" || club.currentUserRole !== "OWNER") {
    redirect(`/clubs/${club.slug}`);
  }

  const members = await getClubMembers(club.id);

  return (
    <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href={`/clubs/${club.slug}`}>
          <ArrowLeft className="h-4 w-4" />
          {club.name}
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{t("clubs.pages.settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("clubs.pages.settings.description")}</p>
      </div>
      <EditClubForm club={club} />
      <ClubSettingsForm club={club} />
      <OwnerTransferForm club={club} members={members} />
    </section>
  );
}
