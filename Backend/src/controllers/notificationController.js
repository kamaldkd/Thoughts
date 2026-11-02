
import mongoose from "mongoose";

import {
  getUserNotifications,
  getUserUnreadCount,
  readNotification,
  readAllNotifications,
  removeUserNotification,
} from "../services/NotificationService.js";

import ExpressError from "../utils/ExpressError.js";

export const listNotifications = async (req, res) => {
  const limit = Math.min(
    Math.max(
      Number.parseInt(req.query.limit, 10) || 20,
      1
    ),
    50
  );

  const cursor = req.query.cursor;

  if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
    throw new ExpressError(400, "Invalid notification cursor");
  }

  const result = await getUserNotifications(
    req.userId,
    limit,
    cursor || null
  );

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const unreadNotificationCount = async (req, res) => {
  const count = await getUserUnreadCount(req.userId);

  res.status(200).json({
    success: true,
    count,
  });
};

export const markNotificationAsRead = async (req, res) => {
  const notification = await readNotification(
    req.params.id,
    req.userId
  );

  if (!notification) {
    throw new ExpressError(404, "Notification not found");
  }

  res.status(200).json({
    success: true,
    notification,
  });
};

export const markAllNotificationsAsRead = async (req, res) => {
  const result = await readAllNotifications(req.userId);

  res.status(200).json({
    success: true,
    modifiedCount: result.modifiedCount,
  });
};

export const deleteNotification = async (req, res) => {
  const notification = await removeUserNotification(
    req.params.id,
    req.userId
  );

  if (!notification) {
    throw new ExpressError(404, "Notification not found");
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted",
  });
};
