import { afterEach, describe, expect, it } from "vitest";
import { useChatStore } from "./useChatStore";

afterEach(() => {
  useChatStore.setState({ messageStore: {} });
  useChatStore.getState().setConversations([]);
  useChatStore.getState().setUnreadCounts({});
  useChatStore.getState().setUnreadMessageCount(0);
  useChatStore.getState().setOnlineUsers([]);
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

  it("adds and removes users from live presence", () => {
    const { setOnlineUsers, setUserOnline } = useChatStore.getState();
    setOnlineUsers(["user-a"]);
    setUserOnline("user-b", true);
    expect(useChatStore.getState().onlineUsers).toEqual({
      "user-a": true,
      "user-b": true,
    });

    setUserOnline("user-a", false);
    expect(useChatStore.getState().onlineUsers).toEqual({ "user-b": true });
  });

  it("removes a message only from this user's view and adjusts unread totals", () => {
    const conversationId = "conversation-delete-me";
    useChatStore.getState().setMessages(
      conversationId,
      [
        {
          _id: "message-a",
          conversationId,
          senderId: "user-b",
          content: "private on this device",
          messageType: "text",
          status: "delivered",
          createdAt: "",
          updatedAt: "",
        },
      ],
      {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    );
    useChatStore.getState().setUnreadCounts({ [conversationId]: 1 });
    useChatStore.getState().setUnreadMessageCount(1);

    useChatStore.getState().deleteMessageForMe(conversationId, "message-a", "user-a");

    expect(useChatStore.getState().messageStore[conversationId].messages).toEqual([]);
    expect(useChatStore.getState().unreadCounts[conversationId]).toBe(0);
    expect(useChatStore.getState().unreadMessageCount).toBe(0);
  });

  it("replaces a globally deleted message with a tombstone", () => {
    const conversationId = "conversation-delete-everyone";
    useChatStore.getState().setMessages(
      conversationId,
      [
        {
          _id: "message-b",
          conversationId,
          senderId: "user-a",
          content: "remove for everyone",
          messageType: "text",
          status: "sent",
          createdAt: "",
          updatedAt: "",
        },
      ],
      {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    );

    useChatStore.getState().deleteMessageForEveryone(conversationId, "message-b", "user-a");

    expect(useChatStore.getState().messageStore[conversationId].messages[0]).toMatchObject({
      content: "",
      isDeleted: true,
    });
  });
});
