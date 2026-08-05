"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image, Save } from "lucide-react";
import { updateProfileAction } from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/profile.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { AZERBAIJAN_CITIES, getPositionLabel, PROFILE_POSITIONS } from "@/lib/profile-options";

const initialState: ApiResponse = {
  ok: true,
  message: ""
};

const fileInputClassName =
  "cursor-pointer overflow-hidden p-0 file:mr-3 file:h-full file:cursor-pointer file:border-0 file:border-r file:bg-primary file:px-4 file:py-0 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90";

type ProfileEditFormProps = {
  profile: UserProfile;
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const issues = state.ok ? undefined : state.issues;
  const displayInitial = profile.name.trim().charAt(0).toUpperCase() || "F";

  useEffect(() => {
    if (state.ok && state.message) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.editForm.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <Field label={t("profile.editForm.name")} name="name" defaultValue={profile.name} error={issues?.name?.[0]} />
          <Field label={t("profile.editForm.username")} name="username" defaultValue={profile.username} error={issues?.username?.[0]} />
          <input type="hidden" name="image" value={profile.image ?? ""} />
          <input type="hidden" name="coverImage" value={profile.coverImage ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid grid-rows-[auto_1fr_auto] gap-3 rounded-md border bg-secondary/35 p-4 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {t("profile.editForm.photo")}
              </span>
              <span className="flex min-h-32 items-center justify-center rounded-md border bg-background p-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background text-xl font-semibold text-muted-foreground">
                  {profile.image ? (
                    <img src={profile.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    displayInitial
                  )}
                </span>
              </span>
              <Input
                name="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-invalid={Boolean(issues?.imageFile)}
                className={fileInputClassName}
              />
              {issues?.imageFile?.[0] ? (
                <span className="text-xs text-destructive">{issues.imageFile[0]}</span>
              ) : null}
            </label>
            <label className="grid grid-rows-[auto_1fr_auto] gap-3 rounded-md border bg-secondary/35 p-4 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {t("profile.editForm.cover")}
              </span>
              <span className="flex min-h-32 w-full items-center justify-center overflow-hidden rounded-md border bg-background text-sm text-muted-foreground">
                {profile.coverImage ? (
                  <img src={profile.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  t("profile.editForm.noCover")
                )}
              </span>
              <Input
                name="coverImageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-invalid={Boolean(issues?.coverImageFile)}
                className={fileInputClassName}
              />
              {issues?.coverImageFile?.[0] ? (
                <span className="text-xs text-destructive">{issues.coverImageFile[0]}</span>
              ) : null}
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            {t("profile.editForm.bio")}
            <Textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} maxLength={240} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label={t("profile.editForm.city")}
              name="location"
              defaultValue={profile.location ?? ""}
              placeholder={t("profile.editForm.chooseCity")}
              options={AZERBAIJAN_CITIES.map((city) => ({ label: city, value: city }))}
            />
            <SelectField
              label={t("profile.editForm.preferredPosition")}
              name="preferredPosition"
              defaultValue={profile.preferredPosition ?? ""}
              placeholder={t("profile.editForm.choosePosition")}
              options={PROFILE_POSITIONS.map((position) => ({ label: getPositionLabel(position, locale), value: position }))}
            />
            <SelectField
              label={t("profile.editForm.avoidedPosition")}
              name="avoidedPosition"
              defaultValue={profile.avoidedPosition ?? ""}
              placeholder={t("profile.editForm.choosePosition")}
              options={PROFILE_POSITIONS.map((position) => ({ label: getPositionLabel(position, locale), value: position }))}
            />
          </div>
          {state.message ? (
            <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-fit">
            <Save className="h-4 w-4" />
            {pending ? t("common.saving") : t("profile.editForm.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  placeholder,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
}) {
  const hasLegacyValue = Boolean(defaultValue) && !options.some((option) => option.value === defaultValue);

  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-offset-background hover:border-input-hover focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{placeholder}</option>
        {hasLegacyValue ? <option value={defaultValue}>{defaultValue}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} defaultValue={defaultValue} aria-invalid={Boolean(error)} />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
