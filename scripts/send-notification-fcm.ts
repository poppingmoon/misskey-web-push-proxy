import { decodeBase64 } from "@std/encoding";
import { create } from "@wok/djwt";

import type { Notification } from "../types.ts";
import { fetchWithRetry } from "./fetch-with-retry.ts";

// https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
export async function sendNotificationFcm(
  notification: Notification,
  fcmToken: string,
  validateOnly?: boolean,
): Promise<Response> {
  const projectId = Deno.env.get("FIREBASE_PROJECT_ID");

  const accessToken = await getAccessToken();

  return fetchWithRetry(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        validate_only: validateOnly,
        message: {
          data: {
            ...notification.payload,
            body: notification.payload?.body
              ? JSON.stringify(notification.payload.body)
              : undefined,
            dateTime: notification.payload?.dateTime
              ? JSON.stringify(notification.payload.dateTime)
              : undefined,
          },
          notification: {
            image: notification.image,
          },
          android: {
            priority: "high",
            notification: {
              title: notification.title,
              title_loc_key: notification.titleLocKey,
              title_loc_args: notification.titleLocArgs,
              body: notification.body,
              body_loc_key: notification.bodyLocKey,
              body_loc_args: notification.bodyLocArgs,
            },
          },
          apns: {
            payload: {
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
            },
          },
          token: fcmToken,
        },
      }),
    },
    {
      minDelay: 10 * 1000,
      maxDelay: 60 * 60 * 1000,
    },
  );
}

// https://github.com/firebase/firebase-admin-node/blob/master/src/app/credential-internal.ts
async function getAccessToken(): Promise<string> {
  const pem = Deno.env.get("FIREBASE_PRIVATE_KEY");
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");

  const privateKeyBase64 = pem!
    .replaceAll("\\n", "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    decodeBase64(privateKeyBase64),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"],
  );

  const now = Math.trunc(Date.now() / 1000);
  const token = await create(
    { alg: "RS256", typ: "JWT" },
    {
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      iat: now,
      exp: now + 3600,
      aud: "https://accounts.google.com/o/oauth2/token",
      iss: clientEmail,
    },
    privateKey,
  );
  const res = await fetchWithRetry(
    "https://accounts.google.com/o/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer" +
        `&assertion=${token}`,
    },
  );

  return (await res.json()).access_token;
}
