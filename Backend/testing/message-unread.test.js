import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import Message from "../src/models/Message.js";
import { countUnreadMessagesByConversation } from "../src/repositories/MessageRepository.js";

const originalAggregate = Message.aggregate;

afterEach(() => {
  Message.aggregate = originalAggregate;
});

test("counts only unread messages from the other participant per conversation", async () => {
  let pipeline;
  Message.aggregate = async (value) => {
    pipeline = value;
    return [
      { _id: "conversation-a", count: 3 },
      { _id: "conversation-b", count: 1 },
    ];
  };

  const counts = await countUnreadMessagesByConversation(
    ["conversation-a", "conversation-b"],
    "507f1f77bcf86cd799439011"
  );

  assert.deepEqual(counts, {
    "conversation-a": 3,
    "conversation-b": 1,
  });
  assert.deepEqual(pipeline[0].$match.conversationId.$in, [
    "conversation-a",
    "conversation-b",
  ]);
  assert.equal(pipeline[0].$match.senderId.$ne.toString(), "507f1f77bcf86cd799439011");
  assert.equal(pipeline[0].$match.deletedFor.$ne.toString(), "507f1f77bcf86cd799439011");
  assert.deepEqual(pipeline[0].$match.isDeleted, { $ne: true });
  assert.deepEqual(pipeline[0].$match.status, { $ne: "seen" });
});

test("avoids a database aggregate when the user has no conversations", async () => {
  Message.aggregate = () => {
    throw new Error("aggregate should not run");
  };

  assert.deepEqual(await countUnreadMessagesByConversation([], "user-id"), {});
});
