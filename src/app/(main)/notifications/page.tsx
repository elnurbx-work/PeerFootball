import { redirect } from "next/navigation";
import { CheckCheck, Inbox } from "lucide-react";
import { markAllNotificationsReadAction } from "@/actions/notification.actions";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { toNotificationListItem } from "@/lib/notifications/notification-copy";
import { getNotifications } from "@/server/queries/notification.queries";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const notifications = (await getNotifications(currentUser.id)).map(toNotificationListItem);
  const hasUnread = notifications.some((notification) => !notification.readAt);

  async function markAllReadFromPage() {
    "use server";

    await markAllNotificationsReadAction();
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Activity from friends, posts, and direct messages.</p>
        </div>

        <form action={markAllReadFromPage}>
          <Button disabled={!hasUnread} type="submit" variant="outline">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </form>
      </div>

      {notifications.length ? (
        <Card>
          <CardContent className="p-0">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="grid gap-2 p-10 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">No notifications yet</h2>
            <p className="text-sm text-muted-foreground">
              Likes, comments, reposts, friend requests, and messages will show up here.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
