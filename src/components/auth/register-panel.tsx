"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Chrome, UserPlus } from "lucide-react";
import { registerWithEmailAction, signInWithGoogleAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = {
  ok: true,
  message: ""
};

export function RegisterPanel() {
  const [state, formAction, pending] = useActionState(registerWithEmailAction, initialState);
  const issues = state.ok ? undefined : state.issues;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your FanPitch account</CardTitle>
        <CardDescription>Register with email, then verify your inbox before signing in.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Name
            <Input name="name" autoComplete="name" aria-invalid={Boolean(issues?.name)} />
            {issues?.name?.[0] ? <span className="text-xs text-destructive">{issues.name[0]}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input name="email" type="email" autoComplete="email" aria-invalid={Boolean(issues?.email)} />
            {issues?.email?.[0] ? <span className="text-xs text-destructive">{issues.email[0]}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
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
            {pending ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithGoogleAction}>
          <Button className="w-full" type="submit" size="lg">
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link className="font-medium text-primary underline" href="/auth/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
