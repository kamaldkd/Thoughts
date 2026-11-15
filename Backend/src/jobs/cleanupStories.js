import cron from "node-cron";
import { cleanupExpiredStories } from "../services/StoryService.js";

export const initStoryCleanup = () => {
  cleanupExpiredStories().catch((error) => {
    console.error("Initial expired story cleanup failed:", error);
  });

  cron.schedule("*/10 * * * *", () => {
    cleanupExpiredStories().catch((error) => {
      console.error("Scheduled expired story cleanup failed:", error);
    });
  });
};
