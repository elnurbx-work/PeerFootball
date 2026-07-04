import { redirect } from "next/navigation";
import { Bell, Lock, Paintbrush, UserCircle } from "lucide-react";
import { FavoriteTeamsPicker } from "@/components/profile/favorite-teams-picker";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getEditableProfileByUserId } from "@/server/queries/profile.queries";

const settingsNav = [
  {
    label: "Profile",
    description: "Name, bio, position",
    icon: UserCircle,
    active: true
  },
  {
    label: "Account",
    description: "Login and identity",
    icon: Lock,
    active: false
  },
  {
    label: "Notifications",
    description: "Match and message alerts",
    icon: Bell,
    active: false
  },
  {
    label: "Appearance",
    description: "Future display options",
    icon: Paintbrush,
    active: false
  }
];

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const editableProfile = await getEditableProfileByUserId(currentUser.id);

  if (!editableProfile) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardContent className="p-3">
            <div className="px-3 py-2">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your FanPitch account.</p>
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
        <ProfileEditForm profile={editableProfile} />
        <FavoriteTeamsPicker favoriteTeams={editableProfile.favoriteTeams} />
      </div>
    </section>
  );
}
