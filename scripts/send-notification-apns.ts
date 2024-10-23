import { decodeBase64 } from "@std/encoding";
import { create, decode, type Payload } from "@wok/djwt";

import type { Notification } from "../types.ts";
import { fetchWithRetry } from "./fetch-with-retry.ts";
import { kv } from "../index.ts";

// https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns
export async function sendNotificationApns(
  notification: Notification,
  apnsToken: string,
): Promise<Response> {
  const bundleId = Deno.env.get("APPLE_BUNDLE_ID");

  const providerToken = await getProviderToken();

  return fetchWithRetry(
    `https://api.push.apple.com/3/device/${apnsToken}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${providerToken}`,
        "apns-topic": bundleId!,
        "apns-push-type": "alert",
      },
      body: JSON.stringify({
        aps: {
          alert: {
            title: notification.title,
            "title-loc-key": notification.titleLocKey,
            "title-loc-args": notification.titleLocArgs,
            subtitle: notification.subtitle,
            "subtitle-loc-key": notification.subtitleLocKey,
            "subtitle-loc-args": notification.subtitleLocArgs,
            body: notification.body,
            "loc-key": notification.bodyLocKey,
            "loc-args": notification.bodyLocArgs,
          },
        },
        payload: notification.payload,
      }),
    },
    {
      minDelay: 10 * 1000,
      maxDelay: 60 * 60 * 1000,
    },
  );
}

// https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns#Create-and-encrypt-your-JSON-token
export async function getProviderToken(): Promise<string> {
  const { value: cachedToken } = await kv.get(["appleProviderToken"]);
  const now = Math.trunc(Date.now() / 1000);
  if (typeof cachedToken == "string") {
    const [_, { iat }, __] = decode<Payload>(cachedToken);
    // Use the cached token if it was created in the last 30 minutes.
    if (iat && now - 30 * 60 < iat && iat < now) {
      return cachedToken;
    }
  }

  const pem = Deno.env.get("APPLE_ENCRYPTION_KEY");
  const keyId = Deno.env.get("APPLE_ENCRYPTION_KEY_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");

  const encryptionKeyBase64 = pem!
    .replaceAll("\\n", "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");
  const encryptionKey = await crypto.subtle.importKey(
    "pkcs8",
    decodeBase64(encryptionKeyBase64),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );

  const token = await create(
    { alg: "ES256", kid: keyId },
    { iat: now, iss: teamId },
    encryptionKey,
  );

  await kv.set(["appleProviderToken"], token, { expireIn: 30 * 60 * 1000 });

  return token;
}
