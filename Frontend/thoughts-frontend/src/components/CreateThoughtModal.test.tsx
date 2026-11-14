import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CreateThoughtModal } from "./CreateThoughtModal";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, postMultipart: vi.fn() };
});

describe("CreateThoughtModal", () => {
  it("loads generated text into an editable composer without publishing it", () => {
    const queryClient = new QueryClient();
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CreateThoughtModal
            open
            initialText="A thoughtful Lotus draft"
            onClose={onClose}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const composer = screen.getByPlaceholderText("What's on your mind?") as HTMLTextAreaElement;
    expect(composer.value).toBe("A thoughtful Lotus draft");
    fireEvent.change(composer, { target: { value: "Edited before sharing" } });
    expect(composer.value).toBe("Edited before sharing");
    expect(onClose).not.toHaveBeenCalled();
  });
});
