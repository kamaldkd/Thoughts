import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMessageSenderId } from "./chatApi";

const { mockPost, mockEmitSendMessage } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockEmitSendMessage: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  default: { post: mockPost },
  csrfTokenInMemory: "csrf-token",
  fetchCsrfToken: vi.fn(),
}));

vi.mock("@/services/socket", () => ({
  emitSendMessage: mockEmitSendMessage,
}));

describe("getMessageSenderId", () => {
  it("normalizes a raw sender ID", () => {
    expect(getMessageSenderId("ABC123")).toBe("abc123");
  });

  it("extracts a sender ID from a populated participant", () => {
    expect(getMessageSenderId({ _id: "ABC123" })).toBe("abc123");
  });

  it("extracts a sender ID from an ObjectId-like value", () => {
    expect(
      getMessageSenderId({
        toHexString: () => "ABC123",
      })
    ).toBe("abc123");
  });

  it("returns an empty ID for unsupported values", () => {
    expect(getMessageSenderId(null)).toBe("");
  });
});

describe("sendChatMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the socket acknowledgement when available", async () => {
    const message = { _id: "saved-message" };
    mockEmitSendMessage.mockResolvedValue({ success: true, message });

    const { sendChatMessage } = await import("./chatApi");
    await expect(sendChatMessage("conversation", "hello", "client-id")).resolves.toBe(message);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("retries over HTTP with the same idempotency key after socket failure", async () => {
    const message = { _id: "saved-message" };
    mockEmitSendMessage.mockRejectedValue(new Error("socket disconnected"));
    mockPost.mockResolvedValue({ data: { data: message } });

    const { sendChatMessage } = await import("./chatApi");
    await expect(sendChatMessage("conversation", "hello", "client-id")).resolves.toBe(message);
    expect(mockPost).toHaveBeenCalledWith("/messages/conversation", {
      content: "hello",
      clientMessageId: "client-id",
    });
  });

  it("falls back to HTTP when the socket rejects the send", async () => {
    const message = { _id: "saved-message" };
    mockEmitSendMessage.mockResolvedValue({ success: false, error: "token expired" });
    mockPost.mockResolvedValue({ data: { data: message } });

    const { sendChatMessage } = await import("./chatApi");
    await expect(sendChatMessage("conversation", "hello", "client-id")).resolves.toBe(message);
  });
});
