"use client";

import { useState, useTransition } from "react";
import { Check, Globe2, Lock, LogOut } from "lucide-react";
import { updateProfileVisibilityAction } from "@/actions/settings.actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type ProfileVisibility = "PUBLIC" | "FRIENDS_ONLY";

export function AccountSettings({ profileVisibility }: { profileVisibility: ProfileVisibility | "PRIVATE" }) {
  const { t } = useI18n();
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    profileVisibility === "PUBLIC" ? "PUBLIC" : "FRIENDS_ONLY"
  );
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function changeVisibility(nextVisibility: ProfileVisibility) {
    const previousVisibility = visibility;
    setVisibility(nextVisibility);
    startTransition(async () => {
      const result = await updateProfileVisibilityAction(nextVisibility);
      setMessage(result.message);
      setSuccess(result.ok);
      setToastOpen(true);
      if (!result.ok) setVisibility(previousVisibility);
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Globe2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>{t("settings.visibilityTitle")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.visibilityDescription")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <fieldset disabled={pending}>
            <legend className="sr-only">{t("settings.visibilityTitle")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <VisibilityOption
                checked={visibility === "PUBLIC"}
                description={t("settings.visibilityPublicDescription")}
                icon={Globe2}
                label={t("profile.editForm.publicAccount")}
                onChange={() => changeVisibility("PUBLIC")}
                value="PUBLIC"
              />
              <VisibilityOption
                checked={visibility === "FRIENDS_ONLY"}
                description={t("settings.visibilityFriendsDescription")}
                icon={Lock}
                label={t("profile.editForm.privateAccount")}
                onChange={() => changeVisibility("FRIENDS_ONLY")}
                value="FRIENDS_ONLY"
              />
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>{t("settings.signOutTitle")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.signOutDescription")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SignOutButton
            label={t("settings.signOutButton")}
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto"
          />
        </CardContent>
      </Card>
      <Toast message={message} open={toastOpen} variant={success ? "success" : "error"} onOpenChange={setToastOpen} />
    </>
  );
}

function VisibilityOption({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
  value
}: {
  checked: boolean;
  description: string;
  icon: typeof Globe2;
  label: string;
  onChange: () => void;
  value: ProfileVisibility;
}) {
  return (
    <label className={cn(
      "relative flex cursor-pointer gap-3 rounded-lg border bg-surface p-4 transition-colors hover:bg-surface-hover focus-within:ring-2 focus-within:ring-ring",
      checked && "border-primary bg-primary/10"
    )}>
      <input className="sr-only" type="radio" name="profileVisibility" value={value} checked={checked} onChange={onChange} />
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold">
          {label}
          {checked ? <Check className="h-4 w-4 text-primary" /> : null}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
