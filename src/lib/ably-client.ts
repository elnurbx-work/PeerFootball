import type { Realtime } from "ably";

export function closeRealtimeClient(client: Realtime) {
  if (client.connection.state === "closing" || client.connection.state === "closed") return;

  try {
    client.close();
  } catch {
    // React Strict Mode may clean up while the initial Ably connection is attaching.
  }
}
