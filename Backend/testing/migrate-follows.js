import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Follow from "../models/Follow.js";

async function migrateFollows() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    console.log("Fetching all users with following data...");
    const users = await usersCollection
      .find({ following: { $exists: true, $not: { $size: 0 } } })
      .toArray();

    console.log(`Found ${users.length} users to migrate.`);
    let migratedCount = 0;

    for (const user of users) {
      if (Array.isArray(user.following)) {
        for (const targetId of user.following) {
          try {
            // Upsert to handle potential duplicates gracefully
            await Follow.updateOne(
              { follower: user._id, following: targetId },
              { $setOnInsert: { follower: user._id, following: targetId } },
              { upsert: true }
            );
            migratedCount++;
          } catch (err) {
            console.error(`Error migrating follow relation: ${user._id} -> ${targetId}`, err.message);
          }
        }
      }
    }

    console.log(`Migrated ${migratedCount} follow relationships successfully.`);

    console.log("Cleaning up old array fields from User collection...");
    await usersCollection.updateMany(
      {},
      { $unset: { followers: "", following: "" } }
    );
    console.log("Cleanup complete.");

    console.log("Migration finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrateFollows();
