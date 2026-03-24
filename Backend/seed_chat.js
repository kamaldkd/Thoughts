import mongoose from "mongoose";
import User from "./src/models/User.js";
import Conversation from "./src/models/Conversation.js";
import Message from "./src/models/Message.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  // Create testing users
  const pwd = await bcrypt.hash("password123", 10);
  
  await User.deleteMany({ email: { $in: ["alice@test.com", "bob@test.com"] } });

  const alice = await User.create({
    name: "Alice Chat",
    username: "alice_chat",
    email: "alice@test.com",
    password: pwd,
    avatar: "https://i.pravatar.cc/150?u=alice",
  });

  const bob = await User.create({
    name: "Bob Chat",
    username: "bob_chat",
    email: "bob@test.com",
    password: pwd,
    avatar: "https://i.pravatar.cc/150?u=bob",
  });

  // Create conversation
  await Conversation.deleteMany({ participants: { $all: [alice._id, bob._id] } });
  
  const sorted = [alice._id, bob._id].map(String).sort();
  const conv = await Conversation.create({ participants: sorted });

  // Create messages
  await Message.deleteMany({ conversationId: conv._id });

  const m1 = await Message.create({
    conversationId: conv._id,
    senderId: alice._id,
    content: "Hi Bob, how are you?",
    status: "seen",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  });

  const m2 = await Message.create({
    conversationId: conv._id,
    senderId: bob._id,
    content: "Hey Alice! I'm doing great. This new chat UI is awesome.",
    status: "seen",
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  });
  
  const m3 = await Message.create({
    conversationId: conv._id,
    senderId: alice._id,
    content: "I agree! The gradient message bubbles look very modern.",
    status: "delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  });

  // update conv
  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: m3._id,
    lastMessageAt: m3.createdAt
  });

  console.log("Seeding complete! You can login as alice@test.com / password123");
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
