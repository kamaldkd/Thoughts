import { afterEach, describe, expect, it } from "vitest";
import { useChatStore } from "./useChatStore";

afterEach(() => {
  useChatStore.getState().setConversations([]);
  useChatStore.getState().setUnreadCounts({});
  useChatStore.getState().setUnreadMessageCount(0);
});

describe("chat unread counts", () => {
  it("hydrates per-conversation unread counts from the conversation list", () => {
    useChatStore.getState().setConversations([
      {
        _id: "conversation-a",
        participant: { _id: "user-b", username: "b", name: "B" },
        createdAt: "",
        unreadCount: 4,
      },
      {
        _id: "conversation-b",
        participant: { _id: "user-c", username: "c", name: "C" },
        createdAt: "",
        unreadCount: 0,
      },
    ]);

    expect(useChatStore.getState().unreadCounts).toEqual({
      "conversation-a": 4,
      "conversation-b": 0,
    });
  });

  it("stores the server's aggregate count for the navigation badge", () => {
    useChatStore.getState().setUnreadMessageCount(5);

    expect(useChatStore.getState().unreadMessageCount).toBe(5);
  });
});
