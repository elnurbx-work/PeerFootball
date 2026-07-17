import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClubGuestList } from "@/components/clubs/club-guest-list";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug, getClubGuests } from "@/server/queries/club.queries";
import { canManageGuestList } from "@/server/services/club-permissions.service";
import { createTranslator } from "@/i18n/dictionary";

type ClubGuestsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClubGuestsPage({ params }: ClubGuestsPageProps) {
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

  const [guests, canManage] = await Promise.all([
    getClubGuests(club.id),
    canManageGuestList(currentUser.id, club.id)
  ]);

  return (
    <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href={`/clubs/${club.slug}`}>
          <ArrowLeft className="h-4 w-4" />
          {club.name}
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{t("clubs.pages.guests.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("clubs.pages.guests.description")}
        </p>
      </div>
      <ClubGuestList clubId={club.id} guests={guests} canManage={canManage && club.isActive} />
    </section>
  );
}
