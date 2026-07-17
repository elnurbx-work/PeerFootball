import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClubInviteForm } from "@/components/clubs/club-invite-form";
import { ClubMembersTable } from "@/components/clubs/club-members-table";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  getClubBySlug,
  getClubInvitationForUser,
  getClubMembers,
  getPendingJoinRequests
} from "@/server/queries/club.queries";
import { canApproveJoinRequests, canInvitePlayers, isClubOwner } from "@/server/services/club-permissions.service";
import { createTranslator } from "@/i18n/dictionary";

type ClubMembersPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClubMembersPage({ params }: ClubMembersPageProps) {
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

  const [activeMembers, canManageRequests, canInvite, owner, pendingRequests, ownInvite] = await Promise.all([
    getClubMembers(club.id),
    canApproveJoinRequests(currentUser.id, club.id),
    canInvitePlayers(currentUser.id, club.id),
    isClubOwner(currentUser.id, club.id),
    getPendingJoinRequests(club.id, currentUser.id),
    getClubInvitationForUser(club.id, currentUser.id)
  ]);
  const members = [...activeMembers, ...pendingRequests, ...(ownInvite ? [ownInvite] : [])]
    .filter((member, index, all) => all.findIndex((item) => item.id === member.id) === index);

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href={`/clubs/${club.slug}`}>
          <ArrowLeft className="h-4 w-4" />
          {club.name}
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{t("clubs.pages.members.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("clubs.pages.members.description", { active: activeMembers.length, pending: pendingRequests.length })}
        </p>
      </div>
      {canInvite && club.isActive ? <ClubInviteForm clubId={club.id} canAssignTd={owner} /> : null}
      <ClubMembersTable
        members={members}
        canManageRequests={canManageRequests}
        canManageRoles={owner}
        currentUserId={currentUser.id}
      />
    </section>
  );
}
