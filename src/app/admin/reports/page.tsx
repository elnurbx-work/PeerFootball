import Link from "next/link";
import { moderatePostReportAction, moderateUserReportAction } from "@/actions/moderation.actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/services/admin-auth.service";
import { normalizePage, PAGINATION_LIMITS } from "@/lib/pagination";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { measureAsync } from "@/lib/performance";

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; userPage?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = normalizePage(params.page);
  const userPage = normalizePage(params.userPage);
  const [reports, totalItems, userReports, totalUserReports] = await measureAsync("admin.reportsPage", () => Promise.all([
    prisma.postReport.findMany({
      include: {
        reporter: { select: { name: true, username: true, email: true } },
        postAuthor: { select: { name: true, username: true, email: true, isBanned: true } },
        post: { select: { content: true, isHidden: true } }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGINATION_LIMITS.admin,
      take: PAGINATION_LIMITS.admin
    }),
    prisma.postReport.count(),
    prisma.userReport.findMany({
      include: {
        reporter: { select: { name: true, username: true, email: true } },
        reportedUser: { select: { name: true, username: true, email: true, isBanned: true } }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (userPage - 1) * PAGINATION_LIMITS.admin,
      take: PAGINATION_LIMITS.admin
    }),
    prisma.userReport.count()
  ]), { route: "/admin/reports" });
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGINATION_LIMITS.admin));
  const totalUserPages = Math.max(1, Math.ceil(totalUserReports / PAGINATION_LIMITS.admin));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AdminNav />
        <h1 className="mb-5 text-3xl font-bold">Reportlar</h1>
        <section className="mb-10 grid gap-4">
          <h2 className="text-xl font-semibold">Profil reportları</h2>
          {userReports.length ? userReports.map((report) => (
            <Card key={report.id} className="border-border bg-card text-foreground">
              <CardHeader>
                <CardTitle className="text-base">
                  {report.reportedUser.name ?? report.reportedUser.username ?? report.reportedUser.email}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {report.createdAt.toLocaleString("az-AZ")} · {report.status}{report.reportedUser.isBanned ? " · BANLI" : ""}
                </p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="text-sm"><span className="text-muted-foreground">Report qeydi:</span> {report.note}</div>
                <div className="text-xs text-muted-foreground">
                  Göndərən: {report.reporter.name ?? report.reporter.username ?? report.reporter.email}
                </div>
                <form action={moderateUserReportAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <input type="hidden" name="reportId" value={report.id} />
                  <Input name="adminNote" defaultValue={report.adminNote ?? ""} placeholder="Qərar səbəbi" className="border-border-strong bg-background" />
                  <Button name="decision" value="DISMISS" variant="ghost">Rədd et</Button>
                  <Button name="decision" value="BAN_USER" variant="destructive">İstifadəçini ban et</Button>
                </form>
              </CardContent>
            </Card>
          )) : <p className="text-muted-foreground">Profil reportu yoxdur.</p>}
          <NumberedPagination
            page={userPage}
            totalPages={totalUserPages}
            pathname="/admin/reports"
            pageParam="userPage"
            searchParams={{ page: String(page) }}
          />
        </section>

        <h2 className="mb-4 text-xl font-semibold">Post reportları</h2>
        <div className="grid gap-4">
          {reports.length ? reports.map((report) => (
            <Card key={report.id} className="border-border bg-card text-foreground">
              <CardHeader>
                <CardTitle className="text-base">{report.postAuthor.name ?? report.postAuthor.username ?? report.postAuthor.email}</CardTitle>
                <p className="text-xs text-muted-foreground">{report.createdAt.toLocaleString("az-AZ")} · {report.status}{report.post.isHidden ? " · GİZLİ" : ""}{report.postAuthor.isBanned ? " · BANLI" : ""}</p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-md border border-border bg-background p-3 text-sm">
                  <p className="text-muted-foreground">Post</p>
                  <p className="mt-1 whitespace-pre-wrap">{report.post.content || "Media postu"}</p>
                  <Link href={`/admin/posts/${report.postId}`} className="mt-2 inline-block text-success hover:underline">Moderator görünüşündə aç</Link>
                </div>
                <div className="text-sm"><span className="text-muted-foreground">Report qeydi:</span> {report.note}</div>
                <div className="text-xs text-muted-foreground">Göndərən: {report.reporter.name ?? report.reporter.username ?? report.reporter.email}</div>
                <form action={moderatePostReportAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                  <input type="hidden" name="reportId" value={report.id} />
                  <Input name="adminNote" defaultValue={report.adminNote ?? ""} placeholder="Qərar səbəbi" className="border-border-strong bg-background" />
                  <Button name="decision" value="DISMISS" variant="ghost">Rədd et</Button>
                  <Button name="decision" value="HIDE_POST" variant="outline">Postu gizlət</Button>
                  <Button name="decision" value="BAN_AUTHOR" className="bg-destructive hover:bg-destructive/85">Müəllifi ban et</Button>
                </form>
              </CardContent>
            </Card>
          )) : <p className="text-muted-foreground">Report yoxdur.</p>}
        </div>
        <NumberedPagination
          page={page}
          totalPages={totalPages}
          pathname="/admin/reports"
          searchParams={{ userPage: String(userPage) }}
        />
      </div>
    </main>
  );
}
