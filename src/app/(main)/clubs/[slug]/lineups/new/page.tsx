import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreateLineupForm } from "@/components/tactics/create-lineup-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { canManageClubTactics } from "@/server/services/club-permissions.service";

export default async function NewLineupPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), user.id);
  if (!club || !(await canManageClubTactics(user.id, club.id))) notFound();
  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <Button asChild variant="ghost" className="w-fit"><Link href={`/clubs/${club.slug}/lineups`}><ArrowLeft className="h-4 w-4" />Heyət planları</Link></Button>
      <div><h1 className="text-3xl font-bold">Yeni heyət planı</h1><p className="text-sm text-muted-foreground">{club.name} üçün baza düzülüşü yarat.</p></div>
      <CreateLineupForm clubId={club.id} slug={club.slug} />
    </section>
  );
}
