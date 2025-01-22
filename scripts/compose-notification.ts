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
  switch (data.body.type) {
    case "follow":
      return {
        titleLocKey: "_notification.youWereFollowed",
        body: data.body.user.name ?? data.body.user.username,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "mention":
      return {
        titleLocKey: "_notification.youGotMention",
        titleLocArgs: [data.body.user.name ?? data.body.user.username],
        body: data.body.note.text,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "reply":
      return {
        titleLocKey: "_notification.youGotReply",
        titleLocArgs: [data.body.user.name ?? data.body.user.username],
        body: data.body.note.text,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "renote":
      return {
        titleLocKey: "_notification.youRenoted",
        titleLocArgs: [data.body.user.name ?? data.body.user.username],
        body: data.body.note.text,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "quote":
      return {
        titleLocKey: "_notification.youGotQuote",
        titleLocArgs: [data.body.user.name ?? data.body.user.username],
        body: data.body.note.text,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "note":
      return {
        titleLocKey: "_notification.newNote",
        titleLocArgs: [data.body.user.name ?? data.body.user.username],
        body: data.body.note.text,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "reaction":
      return {
        title: [
          (data.body.reaction as string | undefined)
            ?.split("@")[0]
            .replaceAll(":", ""),
          data.body.user.name ?? data.body.user.username,
        ].join(" "),
        body: data.body.note.text,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "receiveFollowRequest":
      return {
        titleLocKey: "_notification.youReceivedFollowRequest",
        body: data.body.user.name ?? data.body.user.username,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "followRequestAccepted":
      return {
        titleLocKey: "_notification.yourFollowRequestAccepted",
        body: data.body.user.name ?? data.body.user.username,
        image: data.body.user.avatarUrl,
        ...notification,
      };
    case "achievementEarned":
      return {
        titleLocKey: "_notification.achievementEarned",
        bodyLocKey:
          `_achievements._types._${data.body.achievement}.title` as LocKey,
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
          capitalize(data.body.exportedEntity as string)
        }Completed` as LocKey,
        ...notification,
      };
    case "pollEnded":
      return {
        titleLocKey: "_notification.pollEnded",
        body: data.body.note.text,
        ...notification,
      };
    case "roleAssigned":
      return {
        titleLocKey: "_notification.roleAssigned",
        body: data.body.role.name,
        image: data.body.role.iconUrl,
        ...notification,
      };
    case "scheduleNote":
      return {
        titleLocKey: "_notification._types.scheduleNote",
        body: data.body.errorType,
        ...notification,
      };
    case "noteScheduled":
      return {
        titleLocKey: "_notification.noteScheduled",
        body: data.body.draft.data.text,
        ...notification,
      };
    case "scheduledNotePosted":
      return {
        titleLocKey: "_notification.scheduledNotePosted",
        body: data.body.note.text,
        ...notification,
      };
    case "scheduledNoteError":
      return {
        titleLocKey: "_notification.scheduledNoteError",
        body: data.body.draft.reason,
        ...notification,
      };
    case "app":
      return {
        title: data.body.header ?? data.body.body,
        body: data.body.header ? data.body.body : undefined,
        image: data.body.icon,
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

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.substring(1);
}
