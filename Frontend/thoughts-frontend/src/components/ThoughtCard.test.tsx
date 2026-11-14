import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ThoughtCard } from "./ThoughtCard";

function LotusDestination() {
  const location = useLocation();
  const state = location.state as { thoughtId?: string; thoughtAction?: string } | null;
  return (
    <div>
      {state?.thoughtId}:{state?.thoughtAction}
    </div>
  );
}

describe("ThoughtCard Lotus actions", () => {
  it("passes the selected post action to Lotus", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <ThoughtCard
                  id="thought-123"
                  username="writer"
                  avatar=""
                  time={new Date().toISOString()}
                  content="A thoughtful post"
                  likes={0}
                  comments={0}
                />
              }
            />
            <Route path="/lotus" element={<LotusDestination />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const lotusTrigger = screen.getByRole("button", {
      name: "Ask Lotus about this post",
    });
    fireEvent.keyDown(lotusTrigger, { key: "Enter", code: "Enter" });
    fireEvent.click(await screen.findByText("Explain this post"));

    await waitFor(() => {
      expect(screen.getByText("thought-123:explain")).toBeInTheDocument();
    });
  });
});
