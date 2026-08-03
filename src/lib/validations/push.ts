import { z } from "zod";

const pushKeySchema = z.string().min(8).max(512).regex(/^[A-Za-z0-9_-]+={0,2}$/);

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine((value) => value.startsWith("https://"), {
    message: "Push endpoint must use HTTPS."
  }),
  keys: z.object({
    p256dh: pushKeySchema,
    auth: pushKeySchema
  })
}).strict();

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048)
}).strict();
