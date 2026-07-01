"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogleAction(_formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: "/profile" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
