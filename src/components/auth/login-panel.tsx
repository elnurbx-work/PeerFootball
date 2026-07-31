"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn, MailCheck } from "lucide-react";
import { signInWithEmailAction, signInWithGoogleAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { GoogleLogo } from "@/components/auth/google-logo";
import { useI18n } from "@/components/i18n/i18n-provider";

const initialState: AuthActionState = {
  ok: true,
  message: ""
};

export function LoginPanel() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(signInWithEmailAction, initialState);
  const issues = state.ok ? undefined : state.issues;
  const showResend = !state.ok && issues?.email?.includes("Email is not verified.");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            {t("auth.login.email")}
            <Input name="email" type="email" autoComplete="email" aria-invalid={Boolean(issues?.email)} />
            {issues?.email?.[0] ? <span className="text-xs text-destructive">{issues.email[0]}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t("auth.login.password")}
            <Input name="password" type="password" autoComplete="current-password" aria-invalid={Boolean(issues?.password)} />
            {issues?.password?.[0] ? <span className="text-xs text-destructive">{issues.password[0]}</span> : null}
          </label>
          {state.message ? (
            <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
          ) : null}
          <Button className="w-full" type="submit" size="lg" disabled={pending}>
            <LogIn className="h-4 w-4" />
            {pending ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>

        {showResend ? <ResendVerificationForm /> : null}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("auth.login.or")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithGoogleAction}>
          <Button
            className="w-full border-border !bg-[#fff] !text-[#202124] hover:!bg-[#f8f9fa]"
            type="submit"
            size="lg"
            variant="outline"
          >
            <GoogleLogo />
            {t("auth.login.google")}
          </Button>
        </form>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/register">
            <MailCheck className="h-4 w-4" />
            {t("auth.login.createAccount")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
