import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCheck, Inbox } from "lucide-react";
import { markAllNotificationsReadAction } from "@/actions/notification.actions";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { toNotificationListItem } from "@/lib/notifications/notification-copy";
import {
  getNotificationsPage,
  getUnreadNotificationCount
} from "@/server/queries/notification.queries";
import { createTranslator } from "@/i18n/dictionary";
import { PaginationStatus } from "@/components/pagination/pagination-status";

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  const { cursor } = await searchParams;
  const [page, unreadCount] = await Promise.all([
    getNotificationsPage(currentUser.id, cursor),
    getUnreadNotificationCount(currentUser.id)
  ]);
  const notifications = page.items.map((notification) => toNotificationListItem(notification, t));
  const hasUnread = unreadCount > 0;

  async function markAllReadFromPage() {
    "use server";

    await markAllNotificationsReadAction();
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("notifications.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("notifications.pageDescription")}</p>
        </div>

        <form action={markAllReadFromPage}>
          <Button disabled={!hasUnread} type="submit" variant="outline">
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAll")}
          </Button>
        </form>
      </div>

      {notifications.length ? (
        <>
          <Card>
            <CardContent className="p-0">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </CardContent>
          </Card>
          <PaginationStatus itemCount={notifications.length} hasMore={page.hasMore} />
          {page.hasMore && page.nextCursor ? (
            <Button asChild variant="outline">
              <Link href={`/notifications?cursor=${encodeURIComponent(page.nextCursor)}`}>
                Daha çox göstər
              </Link>
            </Button>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Inbox}
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyDescription")}
        />
      )}
    </section>
  );
}
