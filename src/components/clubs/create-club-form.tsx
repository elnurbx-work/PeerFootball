"use client";

import { FormEvent, type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image, Save } from "lucide-react";
import { createClubAction } from "@/actions/club.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateClubForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<Record<string, string[] | undefined> | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage("");
    setIssues(undefined);
    startTransition(async () => {
      const result = await createClubAction(formData);
      setMessage(result.message);

      if (result.ok && result.data?.slug) {
        router.push(`/clubs/${result.data.slug}`);
      } else if (!result.ok) {
        setIssues(result.issues);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create club</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Club name" name="name" required error={issues?.name?.[0]} />
          <Field label="Custom slug" name="slug" placeholder="optional, e.g. baku-elite" error={issues?.slug?.[0]} />
          <label className="grid gap-2 text-sm font-medium">
            Description
            <Textarea name="description" maxLength={500} rows={4} />
            {issues?.description?.[0] ? <span className="text-xs text-destructive">{issues.description[0]}</span> : null}
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City" name="city" error={issues?.city?.[0]} />
            <Field label="Country" name="country" error={issues?.country?.[0]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ImageFileField
              error={issues?.logoFile?.[0]}
              icon="logo"
              label="Club logo"
              name="logoFile"
              preview={<span className="text-sm text-muted-foreground">No logo</span>}
            />
            <ImageFileField
              error={issues?.coverFile?.[0]}
              icon="cover"
              label="Cover photo"
              name="coverFile"
              preview={<span className="text-sm text-muted-foreground">No cover photo</span>}
            />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={pending} className="w-fit">
            <Save className="h-4 w-4" />
            {pending ? "Creating..." : "Create club"}
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

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  error
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input name={name} type={type} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
