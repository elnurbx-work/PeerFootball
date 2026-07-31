"use client";

import { useState, useTransition } from "react";
import { submitContactAction } from "@/actions/contact.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form className="mt-10 grid gap-4 rounded-xl border bg-card p-5" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startTransition(async () => {
        const result = await submitContactAction(data);
        setMessage(result.message);
        if (result.ok) (event.target as HTMLFormElement).reset();
      });
    }}>
      <h2 className="text-2xl font-bold">Mesaj göndər</h2>
      <label className="grid gap-1 text-sm font-medium">E-poçt<Input name="email" type="email" required autoComplete="email" /></label>
      <label className="grid gap-1 text-sm font-medium">Mövzu<Input name="subject" required minLength={3} maxLength={120} /></label>
      <label className="grid gap-1 text-sm font-medium">Mesaj<Textarea name="message" required minLength={20} maxLength={4000} rows={7} /></label>
      <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="flex items-center gap-4"><Button disabled={pending}>{pending ? "Göndərilir..." : "Göndər"}</Button><p aria-live="polite" className="text-sm text-muted-foreground">{message}</p></div>
    </form>
  );
}
