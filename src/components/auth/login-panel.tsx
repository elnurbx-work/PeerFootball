"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn, MailCheck } from "lucide-react";
import { signInWithEmailAction, signInWithGoogleAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

const initialState: AuthActionState = {
  ok: true,
  message: ""
};

function GoogleLogo() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.83-.07-1.62-.21-2.39H12v4.52h6.47a5.53 5.53 0 0 1-2.4 3.63v2.96h3.88c2.27-2.08 3.55-5.15 3.55-8.72Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.06 7.95-2.88l-3.88-2.96c-1.08.72-2.45 1.14-4.07 1.14-3.13 0-5.78-2.07-6.73-4.86H1.26v3.05A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.44A7.08 7.08 0 0 1 4.9 12c0-.85.13-1.67.37-2.44V6.51H1.26A11.8 11.8 0 0 0 0 12c0 1.94.47 3.78 1.26 5.49l4.01-3.05Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.76 0 3.34.59 4.58 1.75l3.45-3.39A12.02 12.02 0 0 0 12 0 12 12 0 0 0 1.26 6.51l4.01 3.05C6.22 6.77 8.87 4.7 12 4.7Z"
      />
    </svg>
  );
}

export function LoginPanel() {
  const [state, formAction, pending] = useActionState(signInWithEmailAction, initialState);
  const issues = state.ok ? undefined : state.issues;
  const showResend = !state.ok && issues?.email?.includes("Email is not verified.");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to FanPitch</CardTitle>
        <CardDescription>Use your email and password, or continue with Google.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input name="email" type="email" autoComplete="email" aria-invalid={Boolean(issues?.email)} />
            {issues?.email?.[0] ? <span className="text-xs text-destructive">{issues.email[0]}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <Input name="password" type="password" autoComplete="current-password" aria-invalid={Boolean(issues?.password)} />
            {issues?.password?.[0] ? <span className="text-xs text-destructive">{issues.password[0]}</span> : null}
          </label>
          {state.message ? (
            <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
          ) : null}
          <Button className="w-full" type="submit" size="lg" disabled={pending}>
            <LogIn className="h-4 w-4" />
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {showResend ? <ResendVerificationForm /> : null}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithGoogleAction}>
          <Button
            className="w-full border-border !bg-white !text-slate-950 hover:!bg-white/90"
            type="submit"
            size="lg"
            variant="outline"
          >
            <GoogleLogo />
            Continue with Google
          </Button>
        </form>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/register">
            <MailCheck className="h-4 w-4" />
            Create account
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
