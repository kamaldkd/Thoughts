import { useEffect } from "react";
import { emitMarkAsSeen, getSocket } from "@/services/socket";
import { useChatStore } from "@/store/useChatStore";
import { getMessageSenderId, type Message } from "@/services/chatApi";

/**
 * useChatSocket — registers all Socket.IO event listeners once.
 * Call this at the ChatPage level (single instance).
 *
 * @param currentUserId - The logged-in user's ID (to filter own messages)
 */
export const useChatSocket = (currentUserId: string) => {
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const deleteMessageForMe = useChatStore((s) => s.deleteMessageForMe);
  const deleteMessageForEveryone = useChatStore((s) => s.deleteMessageForEveryone);
  const updateConversationMessageStatus = useChatStore((s) => s.updateConversationMessageStatus);
  const replaceTempMessage = useChatStore((s) => s.replaceTempMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const setUserOnline = useChatStore((s) => s.setUserOnline);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);

  useEffect(() => {
    const socket = getSocket();
    const requestPresence = () => {
      socket.emit("get_presence", (userIds: string[]) => {
        setOnlineUsers(userIds);
      });
    };

    const onUserOnline = (userId: string) => setUserOnline(userId, true);
    const onUserOffline = (userId: string) => setUserOnline(userId, false);

    /* ────────────────────────────────────
       receive_message
       New message from the other party.
    ──────────────────────────────────── */
    const onReceiveMessage = (msg: Message) => {
      const convId = msg.conversationId;
      const senderId = getMessageSenderId(msg.senderId);
      const ownId = getMessageSenderId(currentUserId);

      // If this message is ours (echoed back), replace temp
      if (senderId && ownId && senderId === ownId) {
        // Will be handled by the ack — skip
        return;
      }

      appendMessage(convId, msg);
      updateLastMessage(convId, msg);

      if (selectedConversationId === convId) {
        emitMarkAsSeen(convId).catch((err) =>
          console.error("Failed to mark incoming message as seen", err)
        );
      } else {
        incrementUnread(convId);
      }
    };

    /* ────────────────────────────────────
       message_delivered
    ──────────────────────────────────── */
    const onDelivered = ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      updateMessageStatus(conversationId, messageId, "delivered");
    };

    /* ────────────────────────────────────
       message_seen
    ──────────────────────────────────── */
    const onSeen = ({ conversationId, seenBy }: { conversationId: string; seenBy: string }) => {
      updateConversationMessageStatus(conversationId, "seen");
      if (seenBy === currentUserId) clearUnread(conversationId);
    };

    const onMessageDeletedForMe = ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => deleteMessageForMe(conversationId, messageId, currentUserId);

    const onMessageDeleted = ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => deleteMessageForEveryone(conversationId, messageId, currentUserId);

    /* ────────────────────────────────────
       typing_indicator
    ──────────────────────────────────── */
    const onTyping = ({
      conversationId,
      userId,
      isTyping,
    }: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (userId !== currentUserId) {
        setTyping(conversationId, userId, isTyping);
        // Auto-clear typing after 4 seconds as safety net
        if (isTyping) {
          setTimeout(() => setTyping(conversationId, userId, false), 4000);
        }
      }
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("message_delivered", onDelivered);
    socket.on("message_seen", onSeen);
    socket.on("message_deleted_for_me", onMessageDeletedForMe);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("typing_indicator", onTyping);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);
    socket.on("connect", requestPresence);
    if (socket.connected) requestPresence();

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("message_delivered", onDelivered);
      socket.off("message_seen", onSeen);
      socket.off("message_deleted_for_me", onMessageDeletedForMe);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("typing_indicator", onTyping);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
      socket.off("connect", requestPresence);
    };
  }, [
    currentUserId,
    selectedConversationId,
    appendMessage,
    updateMessageStatus,
    deleteMessageForMe,
    deleteMessageForEveryone,
    updateConversationMessageStatus,
    replaceTempMessage,
    setTyping,
    setOnlineUsers,
    setUserOnline,
    incrementUnread,
    clearUnread,
    updateLastMessage,
  ]);
};
