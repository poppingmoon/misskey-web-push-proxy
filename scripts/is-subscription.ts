import type { Subscription } from "../types.ts";

export function isSubscription(value: unknown): value is Subscription {
  const sub = value as Subscription;
  return typeof sub?.id === "string" &&
    (sub?.fcmToken === undefined || typeof sub?.fcmToken === "string") &&
    (sub?.apnsToken === undefined || typeof sub?.apnsToken === "string") &&
    typeof sub?.auth === "string" &&
    typeof sub?.publicKey === "string" &&
    typeof sub?.privateKey === "string" &&
    typeof sub?.vapidKey === "string";
}
