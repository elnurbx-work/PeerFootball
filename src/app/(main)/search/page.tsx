import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default async function SearchPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find players, posts, teams, and matches.
        </p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search FanPitch" />
      </div>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Search results will appear here.
        </CardContent>
      </Card>
    </section>
  );
}
