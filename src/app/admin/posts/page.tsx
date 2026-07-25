import Link from "next/link";
import { Eye, EyeOff, Flag } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/services/admin-auth.service";

export default async function AdminPostsPage() {
  await requireAdmin();
  const posts = await prisma.post.findMany({
    include: {
      author: { select: { name: true, username: true, email: true, isBanned: true } },
      media: { orderBy: { order: "asc" }, select: { id: true } },
      _count: { select: { comments: true, likes: true, reports: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <AdminNav />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Bütün postlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Public, private və moderator tərəfindən gizlədilən son 100 post.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.id} href={`/admin/posts/${post.id}`} className="block">
              <Card className="h-full border-border bg-card text-foreground transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{post.author.name ?? post.author.username ?? post.author.email}</CardTitle>
                    {post.isHidden ? <EyeOff className="h-4 w-4 text-destructive" /> : <Eye className="h-4 w-4 text-success" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{post.createdAt.toLocaleString("az-AZ")} · {post.visibility}{post.author.isBanned ? " · BANLI" : ""}</p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="line-clamp-4 whitespace-pre-wrap text-sm text-foreground">{post.content || (post.media.length ? "Media postu" : "Boş post")}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{post._count.likes} like</span>
                    <span>{post._count.comments} şərh</span>
                    <span className={post._count.reports ? "text-warning" : ""}><Flag className="mr-1 inline h-3 w-3" />{post._count.reports} report</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {!posts.length ? <p className="text-muted-foreground">Post yoxdur.</p> : null}
        </div>
      </div>
    </main>
  );
}
