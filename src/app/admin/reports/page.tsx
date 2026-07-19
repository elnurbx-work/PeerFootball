import Link from "next/link";
import { moderatePostReportAction } from "@/actions/moderation.actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/services/admin-auth.service";

export default async function AdminReportsPage() {
  await requireAdmin();
  const reports = await prisma.postReport.findMany({
    include: {
      reporter: { select: { name: true, username: true, email: true } },
      postAuthor: { select: { name: true, username: true, email: true, isBanned: true } },
      post: { select: { content: true, isHidden: true } }
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AdminNav />
        <h1 className="mb-5 text-3xl font-bold">Post reports</h1>
        <div className="grid gap-4">
          {reports.length ? reports.map((report) => (
            <Card key={report.id} className="border-slate-800 bg-slate-900 text-slate-50">
              <CardHeader>
                <CardTitle className="text-base">{report.postAuthor.name ?? report.postAuthor.username ?? report.postAuthor.email}</CardTitle>
                <p className="text-xs text-slate-500">{report.createdAt.toLocaleString("az-AZ")} · {report.status}{report.post.isHidden ? " · GİZLİ" : ""}{report.postAuthor.isBanned ? " · BANLI" : ""}</p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
                  <p className="text-slate-500">Post</p>
                  <p className="mt-1 whitespace-pre-wrap">{report.post.content || "Media postu"}</p>
                  <Link href={`/admin/posts/${report.postId}`} className="mt-2 inline-block text-emerald-400 hover:underline">Moderator görünüşündə aç</Link>
                </div>
                <div className="text-sm"><span className="text-slate-500">Report qeydi:</span> {report.note}</div>
                <div className="text-xs text-slate-500">Göndərən: {report.reporter.name ?? report.reporter.username ?? report.reporter.email}</div>
                <form action={moderatePostReportAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                  <input type="hidden" name="reportId" value={report.id} />
                  <Input name="adminNote" defaultValue={report.adminNote ?? ""} placeholder="Qərar səbəbi" className="border-slate-700 bg-slate-950" />
                  <Button name="decision" value="DISMISS" variant="ghost">Rədd et</Button>
                  <Button name="decision" value="HIDE_POST" variant="outline">Postu gizlət</Button>
                  <Button name="decision" value="BAN_AUTHOR" className="bg-red-600 hover:bg-red-700">Müəllifi ban et</Button>
                </form>
              </CardContent>
            </Card>
          )) : <p className="text-slate-400">Report yoxdur.</p>}
        </div>
      </div>
    </main>
  );
}
