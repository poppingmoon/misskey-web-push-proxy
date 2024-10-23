import { decodeBase64Url } from "@std/encoding";

import type { Subscription } from "../types.ts";
import { importPrivateKey } from "./import-private-key.ts";
import { sendNotificationApns } from "./send-notification-apns.ts";
import { sendNotificationFcm } from "./send-notification-fcm.ts";

export async function validateSubscription(
  subscription: Subscription,
): Promise<void> {
  if (subscription.id.length < 36) {
    throw new Error("The id value is too short.");
  }

  if (
    subscription.fcmToken === undefined &&
    subscription.apnsToken === undefined
  ) {
    throw new Error("Either fcmToken or apnsToken is required.");
  }

  if (subscription.fcmToken !== undefined) {
    try {
      await sendNotificationFcm({}, subscription.fcmToken, true);
    } catch (_) {
      throw new Error("Failed to create a test notification via FCM.");
    }
  }

  if (subscription.apnsToken !== undefined) {
    try {
      await sendNotificationApns({}, subscription.apnsToken);
    } catch (_) {
      throw new Error("Failed to create a test notification via APNs.");
    }
  }

  if (subscription.auth.length !== 24) {
    throw new Error("The auth value is invalid");
  }

  try {
    decodeBase64Url(subscription.auth);
  } catch (_) {
    throw new Error("The auth value is invalid");
  }

  try {
    await importPrivateKey(subscription.publicKey, subscription.privateKey);
  } catch (_) {
    throw new Error("The publicKey value or the privateKey value is invalid");
  }

  try {
    await crypto.subtle.importKey(
      "raw",
      decodeBase64Url(subscription.vapidKey),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
  } catch (_) {
    throw new Error("The vapidKey value or the privateKey value is invalid");
  }
}
