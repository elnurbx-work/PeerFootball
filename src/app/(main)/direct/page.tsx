import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";

export default async function DirectPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Direct</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations with teammates, players, and match organizers.
        </p>
      </div>
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Messages will live here</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This page is ready for the future chat experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
