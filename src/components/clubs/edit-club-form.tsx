"use client";

import { FormEvent, type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image, Save } from "lucide-react";
import { updateClubAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ClubDetails } from "@/types/club.types";

type EditClubFormProps = {
  club: ClubDetails;
};

export function EditClubForm({ club }: EditClubFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Record<string, string[] | undefined> | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setMessage("");
    setIssues(undefined);
    startTransition(async () => {
      const result = await updateClubAction(club.id, formData);
      setMessage(result.message);

      if (result.ok) {
        router.refresh();

        if (result.data?.slug && result.data.slug !== club.slug) {
          router.replace(`/clubs/${result.data.slug}/settings`);
        }
      } else {
        setIssues(result.issues);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Club info</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Club name" name="name" defaultValue={club.name} required error={issues?.name?.[0]} />
          <Field label="Slug" name="slug" defaultValue={club.slug} required error={issues?.slug?.[0]} />
          <label className="grid gap-2 text-sm font-medium">
            Visibility
            <select name="visibility" defaultValue={club.visibility} className={selectClassName}>
              <option value="OPEN">Open</option>
              <option value="REQUEST_ONLY">Request only</option>
              <option value="INVITE_ONLY">Invite only</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <Textarea name="description" defaultValue={club.description ?? ""} maxLength={500} rows={4} />
            {issues?.description?.[0] ? <span className="text-xs text-destructive">{issues.description[0]}</span> : null}
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City" name="city" defaultValue={club.city ?? ""} error={issues?.city?.[0]} />
            <Field label="Country" name="country" defaultValue={club.country ?? ""} error={issues?.country?.[0]} />
          </div>
          <input type="hidden" name="logoUrl" value={club.logoUrl ?? ""} />
          <input type="hidden" name="coverUrl" value={club.coverUrl ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <ImageFileField
              error={issues?.logoFile?.[0]}
              icon="logo"
              label="Club logo"
              name="logoFile"
              preview={
                club.logoUrl ? (
                  <img src={club.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">No logo</span>
                )
              }
            />
            <ImageFileField
              error={issues?.coverFile?.[0]}
              icon="cover"
              label="Cover photo"
              name="coverFile"
              preview={
                club.coverUrl ? (
                  <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">No cover photo</span>
                )
              }
            />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={pending} className="w-fit">
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save club"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ImageFileField({
  error,
  icon,
  label,
  name,
  preview
}: {
  error?: string;
  icon: "logo" | "cover";
  label: string;
  name: string;
  preview: ReactNode;
}) {
  const Icon = icon === "logo" ? Camera : Image;

  return (
    <label className="grid gap-3 rounded-md border bg-secondary/35 p-4 text-sm font-medium">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={icon === "logo" ? "flex items-center gap-4" : "grid gap-3"}>
        <span
          className={
            icon === "logo"
              ? "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background text-xl font-semibold text-muted-foreground"
              : "flex aspect-[5/2] w-full items-center justify-center overflow-hidden rounded-md border bg-background text-sm text-muted-foreground"
          }
        >
          {preview}
        </span>
        <Input
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-invalid={Boolean(error)}
          className="file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </span>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

const selectClassName =
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  error
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} defaultValue={defaultValue} required={required} aria-invalid={Boolean(error)} />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
