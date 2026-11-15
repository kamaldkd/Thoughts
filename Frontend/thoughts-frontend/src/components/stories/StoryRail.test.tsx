import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StoryRail from "./StoryRail";

const mocks = vi.hoisted(() => ({
  createStory: vi.fn(),
  deleteStory: vi.fn(),
  getStories: vi.fn(),
  viewStory: vi.fn(),
}));

vi.mock("@/lib/api", () => mocks);
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { _id: "viewer", username: "viewer", name: "Viewer", avatar: "" },
  }),
}));

const storyGroups = [
  {
    author: { _id: "author", username: "writer", name: "Writer", avatar: "" },
    isOwn: false,
    stories: [
      {
        _id: "story-1",
        media: { url: "https://example.com/story.jpg", type: "image" as const },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        viewed: false,
      },
    ],
  },
];

function renderStoryRail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <StoryRail />
    </QueryClientProvider>
  );
  return {
    ...result,
    clearQueryClient: () => queryClient.clear(),
  };
}

describe("StoryRail", () => {
  beforeEach(() => {
    mocks.getStories.mockReset().mockResolvedValue(storyGroups);
    mocks.viewStory.mockReset().mockResolvedValue(undefined);
  });

  it("opens a story and records that it was viewed", async () => {
    const { clearQueryClient } = renderStoryRail();

    fireEvent.click(await screen.findByRole("button", { name: "View writer" }));

    expect(await screen.findByRole("dialog", { name: "writer's story" })).toBeVisible();
    await waitFor(() => {
      expect(mocks.viewStory).toHaveBeenCalledWith("story-1");
    });
    clearQueryClient();
  });
});
