"use client";

import { useActionState } from "react";
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import {
  adminLoginAction,
  adminVerifyCodeAction,
  type AdminLoginState
} from "@/actions/admin-auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: AdminLoginState = { ok: true, message: "", step: "credentials" };
const initialCodeState: AdminLoginState = { ok: true, message: "", step: "code" };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);
  const [codeState, codeAction, codePending] = useActionState(adminVerifyCodeAction, initialCodeState);
  const showCodeForm = state.step === "code" && codeState.step !== "credentials";

  return (
    <Card className="w-full max-w-md border-border bg-background text-foreground shadow-2xl">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/100/15 text-success">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle>Admin girişi</CardTitle>
        <CardDescription className="text-muted-foreground">
          Bu zona parol və email-ə göndərilən birdəfəlik kodla qorunur.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showCodeForm ? (
          <form action={codeAction} className="grid gap-4">
            <div className="rounded-md border border-success/30 bg-primary/100/10 p-3 text-sm text-success">
              <MailCheck className="mr-2 inline h-4 w-4" />
              {state.message}
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Email təsdiq kodu
              <Input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                className="border-border-strong bg-card font-mono tracking-[0.35em]"
              />
            </label>
            {codeState.message ? <p className="text-sm text-destructive">{codeState.message}</p> : null}
            <Button type="submit" size="lg" disabled={codePending} className="mt-1 w-full">
              <KeyRound className="h-4 w-4" />
              {codePending ? "Kod yoxlanılır..." : "Kodu təsdiqlə"}
            </Button>
          </form>
        ) : (
        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input name="email" type="email" autoComplete="username" required className="border-border-strong bg-card" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Parol
            <Input name="password" type="password" autoComplete="current-password" required className="border-border-strong bg-card" />
          </label>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            <KeyRound className="h-4 w-4" />
            {pending ? "Göndərilir..." : "Email kodu göndər"}
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
}
