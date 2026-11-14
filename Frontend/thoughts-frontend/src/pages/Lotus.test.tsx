import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLotusConversation,
  getLotusConversations,
  getLotusMode,
  sendLotusMessage,
  setLotusMode,
} from "@/lib/api";
import Lotus from "./Lotus";

vi.mock("@/lib/api", () => ({
  createLotusConversation: vi.fn(),
  deleteLotusConversation: vi.fn(),
  getLotusConversations: vi.fn(),
  getLotusMessages: vi.fn(),
  getLotusMode: vi.fn(),
  regenerateLotusMessage: vi.fn(),
  renameLotusConversation: vi.fn(),
  sendLotusMessage: vi.fn(),
  setLotusMode: vi.fn(),
}));

describe("Lotus", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(getLotusConversations).mockResolvedValue([]);
    vi.mocked(getLotusMode).mockResolvedValue("friendly");
    vi.mocked(createLotusConversation).mockResolvedValue({
      _id: "conversation-1",
      title: "New chat",
      createdAt: "",
      updatedAt: "",
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders streamed Markdown replies and keeps formatting", async () => {
    const reply = [
      "## A thoughtful answer",
      "",
      "Here is **important** text and `inline code`.",
      "",
      "- First point",
      "- Second point",
      "",
      "```js",
      "const lotus = true;",
      "```",
    ].join("\n");
    vi.mocked(sendLotusMessage).mockImplementation(
      async (_conversationId, _content, _clientMessageId, onDelta) => {
        onDelta?.(reply);
        return {
          reply,
          messageId: "assistant-1",
          userMessageId: "user-1",
          title: "Tell me something useful",
        };
      }
    );

    render(
      <MemoryRouter>
        <Lotus />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Message Lotus" }), {
      target: { value: "Tell me something useful" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByRole("heading", { name: "A thoughtful answer" })
    ).toBeInTheDocument();
    expect(screen.getByText("important").tagName).toBe("STRONG");
    expect(screen.getByText("inline code").tagName).toBe("CODE");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("const lotus = true;").closest("pre")).toBeInTheDocument();
    expect(sendLotusMessage).toHaveBeenCalledWith(
      "conversation-1",
      "Tell me something useful",
      expect.any(String),
      expect.any(Function),
      expect.any(AbortSignal),
      undefined
    );
  });

  it("shows streamed text while the request is still in progress", async () => {
    let finishRequest!: () => void;
    vi.mocked(sendLotusMessage).mockImplementation(
      (_conversationId, _content, _clientMessageId, onDelta) => {
        onDelta?.("A streamed answer");
        return new Promise((resolve) => {
          finishRequest = () =>
            resolve({
              reply: "A streamed answer",
              messageId: "assistant-1",
              userMessageId: "user-1",
            });
        });
      }
    );

    render(
      <MemoryRouter>
        <Lotus />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Message Lotus" }), {
      target: { value: "Start streaming" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("A streamed answer")).toBeInTheDocument();
    expect(screen.queryByText("Lotus is thinking")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument();
    await act(async () => {
      finishRequest();
      await Promise.resolve();
    });
  });

  it("uses the existing chat stream for a Creative Studio tool", async () => {
    vi.mocked(sendLotusMessage).mockResolvedValue({
      reply: "A corrected draft",
      messageId: "assistant-2",
      userMessageId: "user-2",
    });

    render(
      <MemoryRouter>
        <Lotus />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: "Creative Studio" }));
    fireEvent.change(screen.getByRole("textbox", { name: "What are you working on?" }), {
      target: { value: "She go to school yesterday." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Fix grammar/ }));

    expect(await screen.findByText("A corrected draft")).toBeInTheDocument();
    expect(sendLotusMessage).toHaveBeenCalledWith(
      "conversation-1",
      expect.stringContaining("Fix the grammar and spelling"),
      expect.any(String),
      expect.any(Function),
      expect.any(AbortSignal),
      undefined
    );
    expect(sendLotusMessage).toHaveBeenCalledWith(
      "conversation-1",
      expect.stringContaining("She go to school yesterday."),
      expect.any(String),
      expect.any(Function),
      expect.any(AbortSignal),
      undefined
    );
  });

  it("uses the themed mode menu to save the selected response style", async () => {
    vi.mocked(setLotusMode).mockResolvedValue("professional");
    render(
      <MemoryRouter>
        <Lotus />
      </MemoryRouter>
    );

    const modeTrigger = screen.getByRole("combobox", {
      name: "Lotus response style",
    });
    fireEvent.keyDown(modeTrigger, { key: "Enter", code: "Enter" });
    fireEvent.click(await screen.findByRole("option", { name: "Professional" }));

    await waitFor(() => {
      expect(setLotusMode).toHaveBeenCalledWith("professional");
    });
  });
});
