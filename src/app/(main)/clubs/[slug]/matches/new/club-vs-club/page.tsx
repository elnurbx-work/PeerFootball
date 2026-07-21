import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateClubVsClubMatchForm } from "@/components/matches/create-club-vs-club-match-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug, searchClubs } from "@/server/queries/club.queries";
import { canRoleCreateClubMatches } from "@/server/services/club-permissions.service";
import { createTranslator } from "@/i18n/dictionary";
export default async function NewClubVsClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/auth/login"); const { slug } = await params;
  const t = createTranslator(user.locale);
  const club = await getClubBySlug(decodeURIComponent(slug), user.id);
  if (!club || club.currentUserMemberStatus !== "ACTIVE" || !canRoleCreateClubMatches(club.currentUserRole, club.settings.matchCreatePermissionPolicy)) notFound();
  const opponents = (await searchClubs()).filter((item) => item.id !== club.id);
  return <section className="mx-auto grid max-w-2xl gap-5 px-4 py-8"><Button asChild variant="ghost" className="w-fit"><Link href={`/clubs/${club.slug}/matches`}>← {t("matches.pages.new.back")}</Link></Button><Card><CardHeader><CardTitle>{t("matches.pages.new.clubVsClubTitle")}</CardTitle></CardHeader><CardContent><CreateClubVsClubMatchForm homeClubId={club.id} opponents={opponents} /></CardContent></Card></section>;
}
