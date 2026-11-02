
import Notification from "../models/Notification.js";

export const createNotificationDoc = async (data, session = null) => {
  if (session) {
    const [notification] = await Notification.create(
      [data],
      { session }
    );
    return notification;
  }

  return Notification.create(data);
};

export const findNotificationsForUser = async (
  userId,
  { limit, cursor }
) => {
  const query = {
    recipient: userId,
    expiresAt: { $gt: new Date() },
  };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const docs = await Notification.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("actor", "username name avatar")
    .populate("thought", "text media")
    .populate("comment", "text")
    .lean();

  const hasMore = docs.length > limit;

  if (hasMore) docs.pop();

  return {
    notifications: docs,
    hasMore,
    nextCursor:
      hasMore && docs.length
        ? String(docs[docs.length - 1]._id)
        : null,
  };
};

export const countUnreadNotifications = (userId) =>
  Notification.countDocuments({
    recipient: userId,
    readAt: null,
    expiresAt: { $gt: new Date() },
  });

export const markNotificationRead = (
  notificationId,
  userId
) =>
  Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { readAt: new Date() },
    },
    { new: true }
  );

export const markAllNotificationsRead = (userId) =>
  Notification.updateMany(
    {
      recipient: userId,
      readAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { readAt: new Date() },
    }
  );

export const deleteNotificationForUser = (
  notificationId,
  userId
) =>
  Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
