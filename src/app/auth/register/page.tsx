import { redirect } from "next/navigation";
import { RegisterPanel } from "@/components/auth/register-panel";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/profile");
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
      <RegisterPanel />
    </section>
  );
}
