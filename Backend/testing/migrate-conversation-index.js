import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const migrateConversationIndex = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const conversations = mongoose.connection.db.collection("conversations");
  const indexes = await conversations.indexes();

  const obsoleteUniqueIndexes = indexes.filter(
    (index) =>
      index.unique === true &&
      Object.keys(index.key).length === 1 &&
      index.key.participants === 1
  );

  for (const index of obsoleteUniqueIndexes) {
    console.log(`Dropping obsolete unique index: ${index.name}`);
    await conversations.dropIndex(index.name);
  }

  const hasParticipantsIndex = indexes.some(
    (index) =>
      Object.keys(index.key).length === 1 &&
      index.key.participants === 1 &&
      !obsoleteUniqueIndexes.some((obsolete) => obsolete.name === index.name)
  );

  if (!hasParticipantsIndex) {
    const name = await conversations.createIndex({ participants: 1 });
    console.log(`Created non-unique index: ${name}`);
  }

  console.log("Conversation index migration completed.");
};

migrateConversationIndex()
  .catch((error) => {
    console.error("Conversation index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
