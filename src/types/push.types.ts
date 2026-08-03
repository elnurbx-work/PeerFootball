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
  type?: NotificationType | "PUSH_TEST";
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

export type PushTestDeliveryResult = {
  success: boolean;
  statusCode?: number;
};

export type PushTestResponseData = {
  subscriptionCount: number;
  attempted: number;
  sent: number;
  failed: number;
  expiredRemoved: number;
  results: PushTestDeliveryResult[];
};
