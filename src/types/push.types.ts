import type { NotificationType } from "@/types/notification.types";

export type PushNotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url: string;
  notificationId?: string;
  type?: NotificationType;
  data?: Record<string, string>;
};

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushClientStatus = {
  enabled: boolean;
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
};
