import cron from "node-cron";
import User from "../models/User.js";
import Follow from "../models/Follow.js";

// Mount standard CRON pipelines to execute silently at 2:00 AM daily
export const initCronJobs = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting overnight Counter sync to resolve mathematical Drift...");
    
    try {
      // PRO TIP: Aggregation pipeline calculates sums on DB side internally without loading 1 million objects into Node.js RAM
      // 1. Sync Followers Count Array
      const followerCounts = await Follow.aggregate([
        { $group: { _id: "$following", count: { $sum: 1 } } }
      ]);
      
      const followersOps = followerCounts.map(stats => ({
        updateOne: { filter: { _id: stats._id }, update: { $set: { followersCount: stats.count } } }
      }));
      
      // Execute 5,000 DB writes efficiently using literally exactly 1 standard network trip via bulkWrite
      if (followersOps.length > 0) await User.bulkWrite(followersOps);

      // 2. Sync Following Count Array
      const followingCounts = await Follow.aggregate([
        { $group: { _id: "$follower", count: { $sum: 1 } } }
      ]);

      const followingOps = followingCounts.map(stats => ({
        updateOne: { filter: { _id: stats._id }, update: { $set: { followingCount: stats.count } } }
      }));

      if (followingOps.length > 0) await User.bulkWrite(followingOps);

      console.log(`[CRON] Successfully synchronized core logic counts for over ${Math.max(followersOps.length, followingOps.length)} total users.`);
    } catch (err) {
      console.error("[CRON] Failed to sync follower logic counters:", err);
    }
  });
};
