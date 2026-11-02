
import express from "express";

import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";

import {
  listNotifications,
  unreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Every notification route requires authentication
router.use(isLoggedIn);

router.get("/", wrapAsync(listNotifications));

router.get(
  "/unread-count",
  wrapAsync(unreadNotificationCount)
);

router.patch(
  "/read-all",
  wrapAsync(markAllNotificationsAsRead)
);

router.patch(
  "/:id/read",
  wrapAsync(markNotificationAsRead)
);

router.delete(
  "/:id",
  wrapAsync(deleteNotification)
);

export default router;
