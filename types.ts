export type Subscription = {
  id: string;
  fcmToken?: string;
  apnsToken?: string;
  auth: string;
  publicKey: string;
  privateKey: string;
  vapidKey: string;
};

export type Notification = {
  title?: string;
  titleLocKey?: LocKey;
  titleLocArgs?: string[];
  subtitle?: string;
  subtitleLocKey?: LocKey;
  subtitleLocArgs?: string[];
  body?: string;
  bodyLocKey?: LocKey;
  bodyLocArgs?: string[];
  image?: string;
  payload?: Record<string, object | undefined>;
};

export type LocKey =
  | "_notification.youWereFollowed"
  | "_notification.youGotMention"
  | "_notification.youGotReply"
  | "_notification.youRenoted"
  | "_notification.youGotQuote"
  | "_notification.newNote"
  | "_notification.youReceivedFollowRequest"
  | "_notification.yourFollowRequestAccepted"
  | "_notification.achievementEarned"
  | "_notification.pollEnded"
  | "_notification.testNotification"
  | "_notification.notificationWillBeDisplayedLikeThis"
  | "_achievements._types._notes1.title"
  | "_achievements._types._notes10.title"
  | "_achievements._types._notes100.title"
  | "_achievements._types._notes500.title"
  | "_achievements._types._notes1000.title"
  | "_achievements._types._notes5000.title"
  | "_achievements._types._notes10000.title"
  | "_achievements._types._notes20000.title"
  | "_achievements._types._notes30000.title"
  | "_achievements._types._notes40000.title"
  | "_achievements._types._notes50000.title"
  | "_achievements._types._notes60000.title"
  | "_achievements._types._notes70000.title"
  | "_achievements._types._notes80000.title"
  | "_achievements._types._notes90000.title"
  | "_achievements._types._notes100000.title"
  | "_achievements._types._login3.title"
  | "_achievements._types._login7.title"
  | "_achievements._types._login15.title"
  | "_achievements._types._login30.title"
  | "_achievements._types._login60.title"
  | "_achievements._types._login100.title"
  | "_achievements._types._login200.title"
  | "_achievements._types._login300.title"
  | "_achievements._types._login400.title"
  | "_achievements._types._login500.title"
  | "_achievements._types._login600.title"
  | "_achievements._types._login700.title"
  | "_achievements._types._login800.title"
  | "_achievements._types._login900.title"
  | "_achievements._types._login1000.title"
  | "_achievements._types._noteClipped1.title"
  | "_achievements._types._noteFavorited1.title"
  | "_achievements._types._myNoteFavorited1.title"
  | "_achievements._types._profileFilled.title"
  | "_achievements._types._markedAsCat.title"
  | "_achievements._types._following1.title"
  | "_achievements._types._following10.title"
  | "_achievements._types._following50.title"
  | "_achievements._types._following100.title"
  | "_achievements._types._following300.title"
  | "_achievements._types._followers1.title"
  | "_achievements._types._followers10.title"
  | "_achievements._types._followers50.title"
  | "_achievements._types._followers100.title"
  | "_achievements._types._followers300.title"
  | "_achievements._types._followers500.title"
  | "_achievements._types._followers1000.title"
  | "_achievements._types._collectAchievements30.title"
  | "_achievements._types._viewAchievements3min.title"
  | "_achievements._types._iLoveMisskey.title"
  | "_achievements._types._foundTreasure.title"
  | "_achievements._types._client30min.title"
  | "_achievements._types._client60min.title"
  | "_achievements._types._noteDeletedWithin1min.title"
  | "_achievements._types._postedAtLateNight.title"
  | "_achievements._types._postedAt0min0sec.title"
  | "_achievements._types._selfQuote.title"
  | "_achievements._types._htl20npm.title"
  | "_achievements._types._viewInstanceChart.title"
  | "_achievements._types._outputHelloWorldOnScratchpad.title"
  | "_achievements._types._open3windows.title"
  | "_achievements._types._driveFolderCircularReference.title"
  | "_achievements._types._reactWithoutRead.title"
  | "_achievements._types._clickedClickHere.title"
  | "_achievements._types._justPlainLucky.title"
  | "_achievements._types._setNameToSyuilo.title"
  | "_achievements._types._passedSinceAccountCreated1.title"
  | "_achievements._types._passedSinceAccountCreated2.title"
  | "_achievements._types._passedSinceAccountCreated3.title"
  | "_achievements._types._loggedInOnBirthday.title"
  | "_achievements._types._loggedInOnNewYearsDay.title"
  | "_achievements._types._cookieClicked.title"
  | "_achievements._types._brainDiver.title"
  | "_achievements._types._smashTestNotificationButton.title"
  | "_achievements._types._tutorialCompleted.title"
  | "_achievements._types._bubbleGameExplodingHead.title"
  | "_achievements._types._bubbleGameDoubleExplodingHead.title";
