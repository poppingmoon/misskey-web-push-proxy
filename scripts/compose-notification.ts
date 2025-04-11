import type { LocKey, Notification } from "../types.ts";

// https://github.com/misskey-dev/misskey/blob/develop/packages/sw/src/scripts/create-notification.ts
export function composeNotification(
  message: ArrayBuffer,
  host?: string,
): Notification {
  const data = JSON.parse(new TextDecoder().decode(message));
  const notification = {
    subtitle: host,
    payload: data,
  };
  if (!data.body) {
    return notification;
  }
  const body = truncateBody(data.body);
  switch (body.type) {
    case "follow":
      return {
        titleLocKey: "_notification.youWereFollowed",
        body: getNameOrUsername(body.user) ?? "",
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "mention":
      return {
        titleLocKey: "_notification.youGotMention",
        titleLocArgs: [getNameOrUsername(body.user) ?? ""],
        body: (body.note as { text?: string })?.text,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "reply":
      return {
        titleLocKey: "_notification.youGotReply",
        titleLocArgs: [getNameOrUsername(body.user) ?? ""],
        body: (body.note as { text?: string })?.text,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "renote":
      return {
        titleLocKey: "_notification.youRenoted",
        titleLocArgs: [getNameOrUsername(body.user) ?? ""],
        body: (body.note as { text?: string })?.text,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "quote":
      return {
        titleLocKey: "_notification.youGotQuote",
        titleLocArgs: [getNameOrUsername(body.user) ?? ""],
        body: (body.note as { text?: string })?.text,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "note":
      return {
        titleLocKey: "_notification.newNote",
        titleLocArgs: [getNameOrUsername(body.user) ?? ""],
        body: (body.note as { text?: string })?.text,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "reaction":
      return {
        title: [
          (body.reaction as string | undefined)
            ?.split("@")[0]
            .replaceAll(":", ""),
          getNameOrUsername(body.user),
        ].join(" "),
        body: (body.note as { text?: string })?.text,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "receiveFollowRequest":
      return {
        titleLocKey: "_notification.youReceivedFollowRequest",
        body: getNameOrUsername(body.user),
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "followRequestAccepted":
      return {
        titleLocKey: "_notification.yourFollowRequestAccepted",
        body: (body.user as { name?: string })?.name ??
          (body.user as { username?: string })?.username,
        image: (body.user as { avatarUrl?: string })?.avatarUrl,
        ...notification,
      };
    case "achievementEarned":
      return {
        titleLocKey: "_notification.achievementEarned",
        bodyLocKey: `_achievements._types._${body.achievement}.title` as LocKey,
        ...notification,
      };
    case "login":
      return {
        titleLocKey: "_notification.login",
        ...notification,
      };
    case "exportCompleted":
      return {
        titleLocKey: `_notification.exportOf${
          capitalize(body.exportedEntity as string)
        }Completed` as LocKey,
        ...notification,
      };
    case "pollEnded":
      return {
        titleLocKey: "_notification.pollEnded",
        body: (body.note as { text?: string })?.text,
        ...notification,
      };
    case "roleAssigned":
      return {
        titleLocKey: "_notification.roleAssigned",
        body: (body.role as { name?: string })?.name,
        image: (body.role as { iconUrl?: string })?.iconUrl,
        ...notification,
      };
    case "chatRoomInvitationReceived":
      return {
        titleLocKey: "_notification.chatRoomInvitationReceived",
        body: (body.invitation as { room?: { name?: string } })?.room?.name,
        ...notification,
      };
    case "createToken":
      return {
        titleLocKey: "_notification.createToken",
        bodyLocKey: "_notification.createTokenDescription",
        ...notification,
      };
    case "scheduleNote":
      return {
        titleLocKey: "_notification._types.scheduleNote",
        body: body.errorType as string | undefined,
        ...notification,
      };
    case "noteScheduled":
      return {
        titleLocKey: "_notification.noteScheduled",
        body: (body.draft as { data?: { text?: string } })?.data?.text,
        ...notification,
      };
    case "scheduledNotePosted":
      return {
        titleLocKey: "_notification.scheduledNotePosted",
        body: (body.note as { text?: string })?.text,
        ...notification,
      };
    case "scheduledNoteError":
      return {
        titleLocKey: "_notification.scheduledNoteError",
        body: (body.draft as { reason?: string })?.reason,
        ...notification,
      };
    case "app":
      return {
        title: (body.header ?? body.body) as string | undefined,
        body: body.header ? body.body as string | undefined : undefined,
        image: body.icon as string | undefined,
        ...notification,
      };
    case "test":
      return {
        titleLocKey: "_notification.testNotification",
        bodyLocKey: "_notification.notificationWillBeDisplayedLikeThis",
        ...notification,
      };
    default:
      return notification;
  }
}

function truncateBody(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ...body,
    note: body.note && typeof body.note === "object"
      ? {
        ...body.note,
        text: (body.note as { text: string | undefined })?.text
          ?.substring(0, 500),
        reactions: {},
        reactionEmojis: {},
        emojis: undefined,
        reactionAndUserPairCache: undefined,
      }
      : undefined,
  };
}

function getNameOrUsername(user: unknown): string | undefined {
  const name = (user as { name?: string })?.name;
  if (name) {
    return name;
  } else {
    return (user as { username?: string })?.username;
  }
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.substring(1);
}
