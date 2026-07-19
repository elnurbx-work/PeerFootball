import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated } from "@/server/services/admin-auth.service";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <AdminLoginForm />
    </main>
  );
}
