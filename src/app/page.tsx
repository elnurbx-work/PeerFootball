import Link from "next/link";
import { CalendarPlus, Radio, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  "Build a player profile that feels like your football CV.",
  "Post match plans, quick takes, photos, and future highlights.",
  "Create teams and organize local football matches."
];

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Football starts with your people
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
            FanPitch brings players, fans, teams, and local matches into one place.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Create your profile, share football posts, find players nearby, form teams,
            and organize the next match without losing the thread.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">
              <UserPlus className="h-4 w-4" />
              Join FanPitch
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/feed">
              <Radio className="h-4 w-4" />
              View Feed
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/matches">
              <CalendarPlus className="h-4 w-4" />
              Create Match
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-primary/15 bg-card/90">
        <CardContent className="space-y-6 p-6">
          <div className="rounded-md bg-primary p-5 text-primary-foreground">
            <p className="text-sm font-medium">Tonight at 20:30</p>
            <h2 className="mt-2 text-2xl font-bold">7-a-side at City Arena</h2>
            <p className="mt-2 text-sm opacity-90">Need 2 defenders and 1 keeper</p>
          </div>
          <div className="grid gap-3">
            {highlights.map((item) => (
              <div key={item} className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
