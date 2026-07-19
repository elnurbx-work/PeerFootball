"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitFeedbackAction, type FeedbackState } from "@/actions/moderation.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: FeedbackState = { ok: true, message: "" };

export function FeedbackForm() {
  const [state, action, pending] = useActionState(submitFeedbackAction, initialState);

  return (
    <form action={action} className="grid gap-4">
      <Textarea name="message" minLength={10} maxLength={1500} rows={7} required placeholder="Problem, təklif və ya fikrinizi qısa şəkildə yazın..." />
      {state.message ? <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-fit"><Send className="h-4 w-4" />{pending ? "Göndərilir..." : "Feedback göndər"}</Button>
    </form>
  );
}
