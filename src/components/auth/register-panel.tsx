"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Chrome, UserPlus } from "lucide-react";
import { registerWithEmailAction, signInWithGoogleAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

const initialState: AuthActionState = {
  ok: true,
  message: ""
};

export function RegisterPanel() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(registerWithEmailAction, initialState);
  const issues = state.ok ? undefined : state.issues;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.register.title")}</CardTitle>
        <CardDescription>{t("auth.register.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            {t("auth.register.name")}
            <Input name="name" autoComplete="name" aria-invalid={Boolean(issues?.name)} />
            {issues?.name?.[0] ? <span className="text-xs text-destructive">{issues.name[0]}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t("auth.register.email")}
            <Input name="email" type="email" autoComplete="email" aria-invalid={Boolean(issues?.email)} />
            {issues?.email?.[0] ? <span className="text-xs text-destructive">{issues.email[0]}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t("auth.register.password")}
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(issues?.password)}
            />
            {issues?.password?.[0] ? <span className="text-xs text-destructive">{issues.password[0]}</span> : null}
          </label>
          {state.message ? (
            <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
          ) : null}
          <Button className="w-full" type="submit" size="lg" disabled={pending}>
            <UserPlus className="h-4 w-4" />
            {pending ? t("auth.register.submitting") : t("auth.register.submit")}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("auth.register.or")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithGoogleAction}>
          <Button className="w-full" type="submit" size="lg">
            <Chrome className="h-4 w-4" />
            {t("auth.register.google")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.register.alreadyRegistered")}{" "}
          <Link className="font-medium text-primary underline" href="/auth/login">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
