import { updateFeedbackAction } from "@/actions/moderation.actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/services/admin-auth.service";
import { normalizePage, PAGINATION_LIMITS } from "@/lib/pagination";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { measureAsync } from "@/lib/performance";

export default async function AdminFeedbackPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const page = normalizePage((await searchParams).page);
  const [feedbacks, totalItems] = await measureAsync("admin.feedbackPage", () => Promise.all([
    prisma.feedback.findMany({
      include: { user: { select: { name: true, email: true, username: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGINATION_LIMITS.admin,
      take: PAGINATION_LIMITS.admin
    }),
    prisma.feedback.count()
  ]), { route: "/admin/feedback" });
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGINATION_LIMITS.admin));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AdminNav />
        <h1 className="mb-5 text-3xl font-bold">Feedbacks</h1>
        <div className="grid gap-4">
          {feedbacks.length ? feedbacks.map((feedback) => (
            <Card key={feedback.id} className="border-slate-800 bg-slate-900 text-slate-50">
              <CardHeader>
                <CardTitle className="text-base">{feedback.user.name ?? feedback.user.username ?? feedback.user.email}</CardTitle>
                <p className="text-xs text-slate-500">{feedback.createdAt.toLocaleString("az-AZ")} · {feedback.status}</p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="whitespace-pre-wrap text-sm text-slate-200">{feedback.message}</p>
                <form action={updateFeedbackAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                  <input type="hidden" name="feedbackId" value={feedback.id} />
                  <Input name="adminNote" defaultValue={feedback.adminNote ?? ""} placeholder="Admin qeydi" className="border-slate-700 bg-slate-950" />
                  <Button name="status" value="REVIEWED" variant="outline">Baxıldı</Button>
                  <Button name="status" value="RESOLVED">Həll edildi</Button>
                  <Button name="status" value="DISMISSED" variant="ghost">Bağla</Button>
                </form>
              </CardContent>
            </Card>
          )) : <p className="text-slate-400">Feedback yoxdur.</p>}
        </div>
        <NumberedPagination page={page} totalPages={totalPages} pathname="/admin/feedback" />
      </div>
    </main>
  );
}
