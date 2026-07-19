import { Activity, MessageSquareText, ShieldAlert, ShieldCheck, Trophy, Users } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/services/admin-auth.service";

export default async function AdminPage() {
  await requireAdmin();
  const [users, clubs, matches, posts, feedbacks, reports] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.match.count(),
    prisma.post.count(),
    prisma.feedback.count({ where: { status: "OPEN" } }),
    prisma.postReport.count({ where: { status: "OPEN" } })
  ]);
  const stats = [
    { label: "İstifadəçilər", value: users, icon: Users },
    { label: "Klublar", value: clubs, icon: ShieldCheck },
    { label: "Matçlar", value: matches, icon: Trophy },
    { label: "Postlar", value: posts, icon: Activity },
    { label: "Açıq feedback", value: feedbacks, icon: MessageSquareText },
    { label: "Açıq report", value: reports, icon: ShieldAlert }
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminNav />
        <h1 className="mb-8 text-3xl font-bold">Admin panel</h1>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-slate-800 bg-slate-900 text-slate-50">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
                <Icon className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{value.toLocaleString("az-AZ")}</p></CardContent>
            </Card>
          ))}
        </section>
        <Card className="mt-6 border-slate-800 bg-slate-900 text-slate-50">
          <CardHeader><CardTitle>Təhlükəsizlik aktivdir</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-400">
            <p>Admin sessiyası 8 saatdan sonra avtomatik bitir.</p>
            <p>Hər girişdə parol və email-ə göndərilən 6 rəqəmli birdəfəlik kod tələb olunur.</p>
            <p>Admin cookie-si HttpOnly, SameSite=Strict və production-da Secure-dur.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
