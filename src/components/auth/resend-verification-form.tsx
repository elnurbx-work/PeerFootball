"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { resendVerificationEmailAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

const initialState: AuthActionState = {
  ok: true,
  message: ""
};

export function ResendVerificationForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(resendVerificationEmailAction, initialState);
  const issues = state.ok ? undefined : state.issues;

  return (
    <form action={formAction} className="grid gap-3 rounded-md border bg-secondary/45 p-4">
      <label className="grid gap-2 text-sm font-medium">
        {t("auth.verification.email")}
        <Input name="email" type="email" placeholder={t("auth.verification.placeholder")} autoComplete="email" />
        {issues?.email?.[0] ? <span className="text-xs text-destructive">{issues.email[0]}</span> : null}
      </label>
      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        <Send className="h-4 w-4" />
        {pending ? t("auth.verification.sending") : t("auth.verification.send")}
      </Button>
    </form>
  );
}
