import { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";

import { composeNotification } from "./scripts/compose-notification.ts";
import { decryptMessage } from "./scripts/decrypt-message.ts";
import { isSubscription } from "./scripts/is-subscription.ts";
import { sendNotificationApns } from "./scripts/send-notification-apns.ts";
import { sendNotificationFcm } from "./scripts/send-notification-fcm.ts";
import { validateSubscription } from "./scripts/validate-subscription.ts";
import { validateVapid } from "./scripts/validate-vapid.ts";
import type { Bindings, Subscription } from "./types.ts";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset='utf-8'>
      <title>Misskey Web Push Proxy</title>
    </head>
    <body>
      <h1>Misskey Web Push Proxy</h1>
      <a href="https://github.com/poppingmoon/misskey-web-push-proxy">
        https://github.com/poppingmoon/misskey-web-push-proxy
      </a>
    </body>
    </html>
  `);
});

app.post("/subscriptions", async (c) => {
  const params = await c.req.json();
  if (params !== null && typeof params === "object") {
    params.id ??= crypto.randomUUID();
  }
  if (
    !isSubscription(params) || params.id.length < 36 ||
    (params.fcmToken === undefined && params.apnsToken === undefined)
  ) {
    throw new HTTPException(
      400,
      { message: "The parameters are invalid." },
    );
  }
  const subscription: Subscription = {
    id: params.id,
    fcmToken: params.fcmToken,
    apnsToken: params.apnsToken,
    auth: params.auth,
    publicKey: params.publicKey,
    privateKey: params.privateKey,
    vapidKey: params.vapidKey,
  };

  try {
    await validateSubscription(subscription, c.env);
  } catch (e) {
    throw new HTTPException(
      400,
      { message: (e as Error).message },
    );
  }

  const entry = await c.env.DB.prepare(
    "SELECT * FROM subscriptions WHERE id = ?",
  ).bind(subscription.id).first();
  if (entry !== null) {
    throw new HTTPException(
      400,
      { message: "A subscription with the same id already exists." },
    );
  }
  await c.env.DB.prepare(
    "INSERT INTO subscriptions VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      subscription.id,
      subscription.fcmToken ?? null,
      subscription.apnsToken ?? null,
      subscription.auth,
      subscription.publicKey,
      subscription.privateKey,
      subscription.vapidKey,
    ).run();

  return c.json(subscription, 201);
});

app.post("/subscriptions/:id", async (c) => {
  const id = c.req.param("id");
  const subscription = await c.env.DB.prepare(
    "SELECT * FROM subscriptions WHERE id = ?",
  ).bind(id).first();
  if ((subscription as Subscription)?.fcmToken === null) {
    (subscription as Subscription).fcmToken = undefined;
  }
  if ((subscription as Subscription)?.apnsToken === null) {
    (subscription as Subscription).apnsToken = undefined;
  }
  if (!isSubscription(subscription)) {
    await c.env.DB.prepare("DELETE FROM subscriptions WHERE id = ?").bind(id)
      .run();
    throw new HTTPException(410);
  }

  const header = c.req.header();
  const authorization = header.authorization;
  if (authorization === undefined || !authorization.startsWith("vapid")) {
    throw new HTTPException(401);
  }
  let payload;
  try {
    payload = await validateVapid(authorization, subscription.vapidKey);
  } catch (_) {
    throw new HTTPException(403);
  }
  let host;
  if (payload.sub && URL.canParse(payload.sub)) {
    const url = new URL(payload.sub);
    host = url.hostname;
  }

  const body = await c.req.arrayBuffer();
  const message = await decryptMessage({
    buffer: body,
    auth: subscription.auth,
    publicKey: subscription.publicKey,
    privateKey: subscription.privateKey,
  });
  const notification = composeNotification(message, host);

  try {
    if (subscription.fcmToken !== undefined) {
      await sendNotificationFcm(notification, subscription.fcmToken, c.env);
    }
    if (subscription.apnsToken !== undefined) {
      await sendNotificationApns(notification, subscription.apnsToken, c.env);
    }
    return c.body(null, 204);
  } catch (e) {
    const status = (e as Response).status;
    if (status === 401 || status === 403 || status === 404) {
      await c.env.DB.prepare("DELETE FROM subscriptions WHERE id = ?").bind(id)
        .run();
      throw new HTTPException(410);
    }
    throw new HTTPException();
  }
});

app.delete("/subscriptions/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM subscriptions WHERE id = ?").bind(id)
    .run();
  return c.body(null, 204);
});

export default app;
