"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Globe2, Image, Lock, Save } from "lucide-react";
import { updateProfileAction } from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/profile.types";

const initialState: ApiResponse = {
  ok: true,
  message: ""
};

type ProfileEditFormProps = {
  profile: UserProfile;
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
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
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} encType="multipart/form-data" className="grid gap-4">
          <Field label="Name" name="name" defaultValue={profile.name} error={issues?.name?.[0]} />
          <Field label="Username" name="username" defaultValue={profile.username} error={issues?.username?.[0]} />
          <input type="hidden" name="image" value={profile.image ?? ""} />
          <input type="hidden" name="coverImage" value={profile.coverImage ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-3 rounded-md border bg-secondary/35 p-4 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Profile photo
              </span>
              <span className="flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background text-xl font-semibold text-muted-foreground">
                  {profile.image ? (
                    <img src={profile.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    displayInitial
                  )}
                </span>
                <Input
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-invalid={Boolean(issues?.imageFile)}
                  className="file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                />
              </span>
              {issues?.imageFile?.[0] ? (
                <span className="text-xs text-destructive">{issues.imageFile[0]}</span>
              ) : null}
            </label>
            <label className="grid gap-3 rounded-md border bg-secondary/35 p-4 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Cover photo
              </span>
              <span className="grid gap-3">
                <span className="flex aspect-[5/2] w-full items-center justify-center overflow-hidden rounded-md border bg-background text-sm text-muted-foreground">
                  {profile.coverImage ? (
                    <img src={profile.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "No cover photo"
                  )}
                </span>
                <Input
                  name="coverImageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-invalid={Boolean(issues?.coverImageFile)}
                  className="file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                />
              </span>
              {issues?.coverImageFile?.[0] ? (
                <span className="text-xs text-destructive">{issues.coverImageFile[0]}</span>
              ) : null}
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Account visibility
            <select
              name="profileVisibility"
              defaultValue={profile.profileVisibility === "PUBLIC" ? "PUBLIC" : "FRIENDS_ONLY"}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="PUBLIC">Public account</option>
              <option value="FRIENDS_ONLY">Private account</option>
            </select>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {profile.profileVisibility === "PUBLIC" ? (
                <Globe2 className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              Private profiles are visible only to accepted friends.
            </span>
            {issues?.profileVisibility?.[0] ? (
              <span className="text-xs text-destructive">{issues.profileVisibility[0]}</span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Bio
            <Textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} maxLength={240} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City" name="location" defaultValue={profile.location ?? ""} />
            <Field label="Preferred position" name="preferredPosition" defaultValue={profile.preferredPosition ?? ""} />
            <Field label="Avoided position" name="avoidedPosition" defaultValue={profile.avoidedPosition ?? ""} />
          </div>
          {state.message ? (
            <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-fit">
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
