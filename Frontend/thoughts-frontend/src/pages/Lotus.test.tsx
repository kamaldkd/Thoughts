import { act, fireEvent, render, screen } from "@testing-library/react";
import { AxiosHeaders } from "axios";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendLotusMessage } from "@/lib/api";
import Lotus from "./Lotus";

vi.mock("@/lib/api", () => ({
  sendLotusMessage: vi.fn(),
}));

describe("Lotus", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders Gemini Markdown replies with emphasis, lists, and code", async () => {
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

    vi.mocked(sendLotusMessage).mockResolvedValue({
      data: { reply },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    });

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
  });

  it("shows streamed reply text before the request has completed", async () => {
    let finishRequest!: () => void;
    vi.mocked(sendLotusMessage).mockImplementation((_messages, onDelta) => {
      onDelta?.("A streamed answer");
      return new Promise((resolve) => {
        finishRequest = () =>
          resolve({
            data: { reply: "A streamed answer" },
            status: 200,
            statusText: "OK",
            headers: new AxiosHeaders(),
            config: { headers: new AxiosHeaders() },
          });
      });
    });

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
    await act(async () => {
      finishRequest();
      await Promise.resolve();
    });
  });
});
