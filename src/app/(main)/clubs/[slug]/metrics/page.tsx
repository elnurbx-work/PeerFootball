import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClubMetricsList } from "@/components/clubs/club-metrics-list";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug, getClubMetricDefinitions } from "@/server/queries/club.queries";
import { canManageClubMetrics } from "@/server/services/club-permissions.service";

type ClubMetricsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClubMetricsPage({ params }: ClubMetricsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), currentUser.id);

  if (!club) {
    notFound();
  }

  const [metrics, canManage] = await Promise.all([
    getClubMetricDefinitions(club.id),
    canManageClubMetrics(currentUser.id, club.id)
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
        <h1 className="text-3xl font-bold">Internal metrics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define up to 6 club-specific player metrics.
        </p>
      </div>
      <ClubMetricsList clubId={club.id} metrics={metrics} canManage={canManage && club.isActive} />
    </section>
  );
}
