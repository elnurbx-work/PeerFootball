import { notFound } from "next/navigation";
import { moderatePostAction } from "@/actions/moderation.actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizePage, PAGINATION_LIMITS } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/services/admin-auth.service";

export default async function AdminPostDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ commentsPage?: string; reportsPage?: string }>;
}) {
  await requireAdmin();
  const { postId } = await params;
  const query = await searchParams;
  const commentsPage = normalizePage(query.commentsPage);
  const reportsPage = normalizePage(query.reportsPage);
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true, username: true, email: true, isBanned: true, banReason: true } },
      media: { orderBy: { order: "asc" } },
      _count: { select: { comments: true, reports: true } }
    }
  });
  if (!post) notFound();

  const [comments, reports] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { name: true, username: true, email: true } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (commentsPage - 1) * PAGINATION_LIMITS.admin,
      take: PAGINATION_LIMITS.admin
    }),
    prisma.postReport.findMany({
      where: { postId },
      include: { reporter: { select: { name: true, username: true, email: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (reportsPage - 1) * PAGINATION_LIMITS.admin,
      take: PAGINATION_LIMITS.admin
    })
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AdminNav />
        <Card className="border-slate-800 bg-slate-900 text-slate-50">
          <CardHeader>
            <CardTitle>{post.author.name ?? post.author.username ?? post.author.email}</CardTitle>
            <p className="text-xs text-slate-500">
              {post.createdAt.toLocaleString("az-AZ")} · {post.visibility}
              {post.isHidden ? " · GİZLİ" : ""}
              {post.author.isBanned ? " · BANLI" : ""}
            </p>
          </CardHeader>
          <CardContent className="grid gap-5">
            {post.content ? <p className="whitespace-pre-wrap leading-7">{post.content}</p> : null}
            {post.media.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {post.media.map((media) => media.type === "IMAGE" ? (
                  <a key={media.id} href={media.url} target="_blank" rel="noreferrer">
                    <img src={media.url} alt="" className="max-h-96 w-full rounded-md border border-slate-700 object-contain" />
                  </a>
                ) : (
                  <a key={media.id} href={media.url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 p-4 text-emerald-400 hover:underline">
                    Videonu aç
                  </a>
                ))}
              </div>
            ) : null}
            {post.moderationNote ? (
              <p className="rounded-md border border-amber-800/50 bg-amber-950/30 p-3 text-sm text-amber-300">
                Moderator qeydi: {post.moderationNote}
              </p>
            ) : null}
            <form action={moderatePostAction} className="grid gap-3 rounded-md border border-slate-800 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
              <input type="hidden" name="postId" value={post.id} />
              <Input name="adminNote" placeholder="Moderator qərarının səbəbi" className="border-slate-700 bg-slate-950" />
              {post.isHidden
                ? <Button name="decision" value="UNHIDE" variant="outline">Postu aç</Button>
                : <Button name="decision" value="HIDE" variant="outline">Postu gizlət</Button>}
              <Button name="decision" value="BAN_AUTHOR" className="bg-red-600 hover:bg-red-700" disabled={post.author.isBanned}>
                Müəllifi ban et
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900 text-slate-50">
            <CardHeader><CardTitle className="text-lg">Reportlar ({post._count.reports})</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-md border border-slate-800 p-3 text-sm">
                  <p>{report.note}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {report.reporter.name ?? report.reporter.username ?? report.reporter.email} · {report.status}
                  </p>
                </div>
              ))}
              {!reports.length ? <p className="text-sm text-slate-500">Report yoxdur.</p> : null}
              <NumberedPagination
                page={reportsPage}
                totalPages={Math.max(1, Math.ceil(post._count.reports / PAGINATION_LIMITS.admin))}
                pathname={`/admin/posts/${post.id}`}
                pageParam="reportsPage"
                searchParams={{ commentsPage: String(commentsPage) }}
              />
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900 text-slate-50">
            <CardHeader><CardTitle className="text-lg">Şərhlər ({post._count.comments})</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-md border border-slate-800 p-3 text-sm">
                  <p>{comment.content}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {comment.author.name ?? comment.author.username ?? comment.author.email}
                  </p>
                </div>
              ))}
              {!comments.length ? <p className="text-sm text-slate-500">Şərh yoxdur.</p> : null}
              <NumberedPagination
                page={commentsPage}
                totalPages={Math.max(1, Math.ceil(post._count.comments / PAGINATION_LIMITS.admin))}
                pathname={`/admin/posts/${post.id}`}
                pageParam="commentsPage"
                searchParams={{ reportsPage: String(reportsPage) }}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
