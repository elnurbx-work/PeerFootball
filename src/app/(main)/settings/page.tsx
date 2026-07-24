import { redirect } from "next/navigation";
import { FavoriteTeamsPicker } from "@/components/profile/favorite-teams-picker";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { getCurrentUser } from "@/lib/auth";
import { getEditableProfileByUserId } from "@/server/queries/profile.queries";
import { LanguageSettings } from "@/components/settings/language-settings";
import { createTranslator } from "@/i18n/dictionary";
import { AccountSettings } from "@/components/settings/account-settings";
import {
  SettingsTabs,
  type SettingsTabKey
} from "@/components/settings/settings-tabs";

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const SETTINGS_TABS: SettingsTabKey[] = [
  "profile",
  "account",
  "appearance"
];

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const editableProfile = await getEditableProfileByUserId(currentUser.id);

  if (!editableProfile) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);
  const params = await searchParams;
  const activeTab = SETTINGS_TABS.includes(params.tab as SettingsTabKey)
    ? (params.tab as SettingsTabKey)
    : "profile";

  return (
    <SettingsTabs
      initialTab={activeTab}
      subtitle={t("settings.subtitle")}
      title={t("settings.title")}
      tabs={[
        {
          key: "profile",
          label: t("settings.profile"),
          description: t("settings.profileDescription"),
          content: (
            <>
              <ProfileEditForm profile={editableProfile} />
              <FavoriteTeamsPicker favoriteTeams={editableProfile.favoriteTeams} />
            </>
          )
        },
        {
          key: "account",
          label: t("settings.account"),
          description: t("settings.accountDescription"),
          content: <AccountSettings />
        },
        {
          key: "appearance",
          label: t("settings.appearance"),
          description: t("settings.appearanceDescription"),
          content: <LanguageSettings />
        }
      ]}
    />
  );
}
