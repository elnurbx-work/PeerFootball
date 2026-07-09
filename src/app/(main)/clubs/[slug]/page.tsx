import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BarChart3, ClipboardList, MessageCircle, Shield, Swords, Users } from "lucide-react";
import { ClubCard } from "@/components/clubs/club-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";

type ClubPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const futureModules = [
  { title: "Matches", description: "Future club match hub.", icon: Swords },
  { title: "Internal training matches", description: "Future internal squad games.", icon: Users },
  { title: "Club vs Club matches", description: "Future external match requests.", icon: Shield },
  { title: "Tactics", description: "Future formations and tactical notes.", icon: ClipboardList },
  { title: "Statistics", description: "Future player and club stats.", icon: BarChart3 },
  { title: "Analysis", description: "Future match and training analysis.", icon: ClipboardList },
  { title: "Club chat", description: "Future club conversation space.", icon: MessageCircle }
];

export default async function ClubPage({ params }: ClubPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), currentUser.id);

  if (!club) {
    notFound();
  }

  const location = [club.city, club.country].filter(Boolean).join(", ");

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="overflow-hidden rounded-md border bg-card">
        <div className="flex aspect-[4/1] min-h-36 items-center justify-center border-b bg-background">
          {club.coverUrl ? (
            <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-card">
              <span className="max-w-full truncate px-6 text-5xl font-bold text-muted-foreground/15 sm:text-7xl">
                {club.name}
              </span>
            </div>
          )}
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex min-w-0 gap-4">
            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-primary text-3xl font-bold text-primary-foreground">
              {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-full w-full object-cover" /> : club.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-bold">{club.name}</h1>
                {!club.isActive ? <Badge variant="secondary">Deactivated</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{club.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{club.currentUserRole ?? "Visitor"}</Badge>
                <Badge variant="secondary">{club.visibility.replaceAll("_", " ")}</Badge>
                <Badge variant="secondary">{club.memberCount} members</Badge>
                {location ? <Badge variant="secondary">{location}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/members`}>Members</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/guests`}>Guests</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/metrics`}>Metrics</Link>
            </Button>
            {club.currentUserRole === "OWNER" ? (
              <Button asChild>
                <Link href={`/clubs/${club.slug}/settings`}>Settings</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {club.description ?? "This club has not added a description yet."}
            </p>
          </CardContent>
        </Card>
        <ClubCard club={club} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {futureModules.map((module) => (
          <Card key={module.title}>
            <CardContent className="p-5">
              <module.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{module.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
              <Badge variant="secondary" className="mt-4">Future phase</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
