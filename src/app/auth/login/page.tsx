import { LoginPanel } from "@/components/auth/login-panel";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/profile");
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
      <LoginPanel />
    </section>
  );
}
