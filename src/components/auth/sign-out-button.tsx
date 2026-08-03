"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { detachPushSubscriptionFromAccount } from "@/lib/push-notifications";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  label: string;
  className?: string;
  iconOnly?: boolean;
  variant?: "ghost" | "outline";
};

export function SignOutButton({
  label,
  className,
  iconOnly = false,
  variant = "outline"
}: SignOutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      await detachPushSubscriptionFromAccount();
    } catch {
      // Reassignment on the next authenticated session is the safety fallback.
    }
    await signOutAction();
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn(iconOnly && "h-11 w-11 px-0", className)}
      disabled={pending}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      onClick={handleSignOut}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
      {iconOnly ? null : label}
    </Button>
  );
}
