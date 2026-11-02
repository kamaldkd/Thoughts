
import {
  createNotificationDoc,
  findNotificationsForUser,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationForUser,
} from "../repositories/NotificationRepository.js";

export const createNotification = async ({
  recipient,
  actor,
  type,
  thought = null,
  comment = null,
  session = null,
}) => {
  // Prevent self-notifications
  if (!recipient || !actor) return null;

  if (String(recipient) === String(actor)) {
    return null;
  }

  return createNotificationDoc(
    {
      recipient,
      actor,
      type,
      thought,
      comment,

      // Expire 24 hours after creation
      expiresAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    },
    session
  );
};

export const getUserNotifications = (
  userId,
  limit = 20,
  cursor = null
) =>
  findNotificationsForUser(userId, {
    limit,
    cursor,
  });

export const getUserUnreadCount = (userId) =>
  countUnreadNotifications(userId);

export const readNotification = (notificationId, userId) =>
  markNotificationRead(notificationId, userId);

export const readAllNotifications = (userId) =>
  markAllNotificationsRead(userId);

export const removeUserNotification = (
  notificationId,
  userId
) =>
  deleteNotificationForUser(notificationId, userId);
