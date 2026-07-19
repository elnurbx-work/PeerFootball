import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Lock, MessageSquareText, Paintbrush, UserCircle } from "lucide-react";
import { FavoriteTeamsPicker } from "@/components/profile/favorite-teams-picker";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getEditableProfileByUserId } from "@/server/queries/profile.queries";
import { LanguageSettings } from "@/components/settings/language-settings";
import { createTranslator } from "@/i18n/dictionary";
import { AccountSettings } from "@/components/settings/account-settings";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const editableProfile = await getEditableProfileByUserId(currentUser.id);

  if (!editableProfile) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);
  const settingsNav = [
    { label: t("settings.profile"), description: t("settings.profileDescription"), icon: UserCircle, active: true },
    { label: t("settings.account"), description: t("settings.accountDescription"), icon: Lock, active: false },
    { label: t("settings.notifications"), description: t("settings.notificationsDescription"), icon: Bell, active: false },
    { label: t("settings.appearance"), description: t("settings.appearanceDescription"), icon: Paintbrush, active: false }
  ];

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardContent className="p-3">
            <div className="px-3 py-2">
              <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
            </div>
            <nav className="mt-3 grid gap-1">
              {settingsNav.map((item) => (
                <div
                  key={item.label}
                  className={
                    item.active
                      ? "flex items-center gap-3 rounded-md bg-secondary px-3 py-3 text-sm"
                      : "flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground"
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </div>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <div className="grid gap-5">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold">Feedback göndər</p>
              <p className="text-sm text-muted-foreground">Problem və təkliflərinizi birbaşa admin komandasına çatdırın.</p>
            </div>
            <Button asChild variant="outline"><Link href="/feedback"><MessageSquareText className="h-4 w-4" />Feedback</Link></Button>
          </CardContent>
        </Card>
        <LanguageSettings />
        <ProfileEditForm profile={editableProfile} />
        <FavoriteTeamsPicker favoriteTeams={editableProfile.favoriteTeams} />
        <AccountSettings />
      </div>
    </section>
  );
}
