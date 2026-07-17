import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreateClubForm } from "@/components/clubs/create-club-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { createTranslator } from "@/i18n/dictionary";

export default async function NewClubPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href="/clubs">
          <ArrowLeft className="h-4 w-4" />
          {t("clubs.pages.new.back")}
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{t("clubs.pages.new.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("clubs.pages.new.description")}
        </p>
      </div>
      <CreateClubForm />
    </section>
  );
}
