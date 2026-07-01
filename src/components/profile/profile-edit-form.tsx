"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
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
        <form action={formAction} className="grid gap-4">
          <Field label="Name" name="name" defaultValue={profile.name} error={issues?.name?.[0]} />
          <Field label="Username" name="username" defaultValue={profile.username} error={issues?.username?.[0]} />
          <label className="grid gap-2 text-sm font-medium">
            Bio
            <Textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} maxLength={240} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Favorite club" name="favoriteClub" defaultValue={profile.favoriteClub ?? ""} />
            <Field label="Location" name="location" defaultValue={profile.location ?? ""} />
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
  defaultValue,
  error
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} defaultValue={defaultValue} aria-invalid={Boolean(error)} />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
