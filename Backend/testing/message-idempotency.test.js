import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import Message from "../src/models/Message.js";
import { createMessage } from "../src/repositories/MessageRepository.js";

const originalFindOne = Message.findOne;
const originalCreate = Message.create;

beforeEach(() => {
  Message.findOne = () => ({ lean: async () => null });
  Message.create = async (message) => ({ toObject: () => message });
});

afterEach(() => {
  Message.findOne = originalFindOne;
  Message.create = originalCreate;
});

test("reuses a persisted message when a transport retry has the same ID", async () => {
  const existing = { _id: "saved", content: "hello" };
  let createCalled = false;
  Message.findOne = (filter) => {
    assert.deepEqual(filter, {
      conversationId: "conversation",
      senderId: "sender-a",
      clientMessageId: "client-id",
    });
    return { lean: async () => existing };
  };
  Message.create = async () => {
    createCalled = true;
    throw new Error("should not create a duplicate");
  };

  assert.equal(
    await createMessage({
      conversationId: "conversation",
      senderId: "sender-a",
      content: "hello",
      clientMessageId: "client-id",
    }),
    existing
  );
  assert.equal(createCalled, false);
});

test("keeps messages from both participants distinct", async () => {
  const created = [];
  Message.create = async (message) => {
    created.push(message);
    return { toObject: () => ({ ...message, _id: `saved-${created.length}` }) };
  };

  await createMessage({
    conversationId: "conversation",
    senderId: "sender-a",
    content: "from A",
    clientMessageId: "client-id",
  });
  await createMessage({
    conversationId: "conversation",
    senderId: "sender-b",
    content: "from B",
    clientMessageId: "client-id",
  });

  assert.equal(created.length, 2);
  assert.equal(created[0].senderId, "sender-a");
  assert.equal(created[1].senderId, "sender-b");
});

test("recovers from concurrent duplicate inserts by returning the saved message", async () => {
  const existing = { _id: "saved", content: "hello" };
  let lookupCount = 0;
  Message.findOne = () => ({
    lean: async () => (++lookupCount === 1 ? null : existing),
  });
  Message.create = async () => {
    throw Object.assign(new Error("duplicate key"), { code: 11000 });
  };

  assert.equal(
    await createMessage({
      conversationId: "conversation",
      senderId: "sender-a",
      content: "hello",
      clientMessageId: "client-id",
    }),
    existing
  );
  assert.equal(lookupCount, 2);
});
