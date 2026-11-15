import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, ChevronRight, Clock3, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createStory,
  deleteStory,
  getStories,
  viewStory,
  type StoryGroup,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_STORY_SIZE = 50 * 1024 * 1024;
const IMAGE_STORY_DURATION_MS = 5000;

const getErrorMessage = (error: unknown) =>
  axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";

function Avatar({ src, name, size = "h-14 w-14" }: { src?: string; name: string; size?: string }) {
  return src ? (
    <img src={src} alt="" className={`${size} rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden="true"
      className={`${size} flex items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function StoryCircle({
  group,
  onClick,
}: {
  group: StoryGroup;
  onClick: () => void;
}) {
  const unseen = group.stories.some((story) => !story.viewed);
  const label = group.isOwn ? "Your Story" : group.author.username;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${label}`}
      className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 text-center"
    >
      <span
        className={`rounded-full p-[2px] ${
          unseen
            ? "bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600"
            : "bg-border"
        }`}
      >
        <span className="block rounded-full bg-background p-[2px]">
          <Avatar
            src={group.author.avatar}
            name={group.author.name || group.author.username}
            size="h-[52px] w-[52px]"
          />
        </span>
      </span>
      <span className="w-full truncate text-[11px] text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

export default function StoryRail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewer, setViewer] = useState<{ authorId: string; index: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const storiesQuery = useQuery({
    queryKey: ["stories"],
    queryFn: getStories,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const groups = useMemo(() => storiesQuery.data ?? [], [storiesQuery.data]);
  const ownStories = groups.find((group) => group.isOwn);
  const activeGroup = viewer
    ? groups.find((group) => group.author._id === viewer.authorId)
    : undefined;
  const activeStory = activeGroup?.stories[viewer?.index ?? -1];
  const activeStoryId = activeStory?._id;
  const activeStoryViewed = activeStory?.viewed;
  const activeStoryType = activeStory?.media.type;

  const closeViewer = useCallback(() => setViewer(null), []);

  const moveStory = useCallback(
    (direction: 1 | -1) => {
      setViewer((current) => {
        if (!current) return null;
        const groupIndex = groups.findIndex(
          (group) => group.author._id === current.authorId
        );
        if (groupIndex < 0) return null;

        const group = groups[groupIndex];
        const nextIndex = current.index + direction;
        if (nextIndex >= 0 && nextIndex < group.stories.length) {
          return { ...current, index: nextIndex };
        }

        const nextGroup = groups[groupIndex + direction];
        if (!nextGroup) return direction === 1 ? null : current;
        return {
          authorId: nextGroup.author._id,
          index: direction === 1 ? 0 : nextGroup.stories.length - 1,
        };
      });
    },
    [groups]
  );

  const uploadMutation = useMutation({
    mutationFn: createStory,
    onSuccess: async () => {
      setSelectedFile(null);
      toast.success("Your story is live for 24 hours");
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: deleteStory,
    onSuccess: async () => {
      closeViewer();
      toast.success("Story deleted");
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (!activeStoryId || activeStoryViewed || activeGroup?.isOwn) return;

    queryClient.setQueryData<StoryGroup[]>(["stories"], (current) =>
      current?.map((group) => ({
        ...group,
        stories: group.stories.map((story) =>
          story._id === activeStoryId ? { ...story, viewed: true } : story
        ),
      }))
    );
    viewStory(activeStoryId).catch((error: unknown) => {
      console.error("Failed to mark story as viewed:", error);
    });
  }, [activeStoryId, activeStoryViewed, activeGroup?.isOwn, queryClient]);

  useEffect(() => {
    if (!activeStoryId) return;
    setProgress(0);
    if (activeStoryType === "video") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const percent = Math.min(
        ((Date.now() - startedAt) / IMAGE_STORY_DURATION_MS) * 100,
        100
      );
      setProgress(percent);
      if (percent >= 100) {
        window.clearInterval(timer);
        moveStory(1);
      }
    }, 80);

    return () => window.clearInterval(timer);
  }, [activeStoryId, activeStoryType, moveStory]);

  useEffect(() => {
    if (!viewer) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") moveStory(1);
      if (event.key === "ArrowLeft") moveStory(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewer, closeViewer, moveStory]);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Choose a photo or video");
      return;
    }
    if (file.size > MAX_STORY_SIZE) {
      toast.error("Stories must be smaller than 50 MB");
      return;
    }
    setSelectedFile(file);
  };

  const shareStory = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("media", selectedFile);
    uploadMutation.mutate(formData);
  };

  useEffect(() => {
    if (storiesQuery.isSuccess && viewer && !activeGroup) closeViewer();
  }, [storiesQuery.isSuccess, viewer, activeGroup, closeViewer]);

  if (storiesQuery.isError) {
    return (
      <div className="mx-3 my-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-xs text-muted-foreground sm:mx-0">
        Stories couldn’t load.{" "}
        <button
          type="button"
          onClick={() => void storiesQuery.refetch()}
          className="font-medium text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <section
        aria-label="Stories"
        className="my-3 flex gap-2 overflow-x-auto border-y border-border/50 bg-card/60 px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:my-4 sm:rounded-2xl sm:border"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          aria-label="Choose a story photo or video"
          onChange={(event) => {
            handleFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add Story"
          className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 text-center"
        >
          <span className="relative rounded-full border border-border bg-background p-[2px]">
            <Avatar
              src={user?.avatar}
              name={user?.name || user?.username || "You"}
              size="h-[52px] w-[52px]"
            />
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
              <Plus className="h-3 w-3" strokeWidth={2.5} />
            </span>
          </span>
          <span className="w-full truncate text-[11px] font-medium text-foreground">
            Add Story
          </span>
        </button>
        {ownStories && (
          <StoryCircle
            group={ownStories}
            onClick={() =>
              setViewer({ authorId: ownStories.author._id, index: 0 })
            }
          />
        )}
        {groups
          .filter((group) => !group.isOwn)
          .map((group) => (
            <StoryCircle
              key={group.author._id}
              group={group}
              onClick={() => setViewer({ authorId: group.author._id, index: 0 })}
            />
          ))}
        {!groups.length && (
          <div className="flex min-w-0 flex-1 items-center px-2 text-xs text-muted-foreground">
            Share a moment that disappears after 24 hours.
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedFile)}
        onOpenChange={(open) => {
          if (!open && !uploadMutation.isPending) setSelectedFile(null);
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl border-border/70 bg-card p-5 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share a story</DialogTitle>
            <DialogDescription>
              Your photo or video will be visible for 24 hours.
            </DialogDescription>
          </DialogHeader>
          {selectedFile && previewUrl && (
            <div className="mx-auto max-h-[60dvh] w-full overflow-hidden rounded-2xl bg-black">
              {selectedFile.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="mx-auto max-h-[60dvh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="mx-auto max-h-[60dvh] w-full object-contain"
                />
              )}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={shareStory}
              disabled={!selectedFile || uploadMutation.isPending}
              className="h-10 w-full rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadMutation.isPending ? "Sharing..." : "Share story"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeStory && activeGroup && viewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeGroup.author.username}'s story`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <div className="relative flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-black sm:h-[min(92dvh,850px)] sm:rounded-2xl sm:shadow-2xl">
            <div className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(12px,env(safe-area-inset-top))]">
              <div className="mb-3 flex gap-1">
                {activeGroup.stories.map((story, index) => {
                  const segmentProgress =
                    index < viewer.index
                      ? 100
                      : index === viewer.index
                        ? progress
                        : 0;
                  return (
                    <span
                      key={story._id}
                      className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/35"
                    >
                      <span
                        className="block h-full bg-white transition-[width] duration-100"
                        style={{ width: `${segmentProgress}%` }}
                      />
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-2.5 text-white">
                <Avatar
                  src={activeGroup.author.avatar}
                  name={activeGroup.author.name || activeGroup.author.username}
                  size="h-9 w-9"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {activeGroup.isOwn
                      ? "Your Story"
                      : activeGroup.author.username}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-white/70">
                    <Clock3 className="h-3 w-3" />
                    24 hours
                  </p>
                </div>
                {activeGroup.isOwn && (
                  <button
                    type="button"
                    aria-label="Delete story"
                    onClick={() => removeMutation.mutate(activeStory._id)}
                    disabled={removeMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close story"
                  onClick={closeViewer}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {activeStory.media.type === "video" ? (
              <video
                key={activeStory._id}
                src={activeStory.media.url}
                autoPlay
                muted
                playsInline
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  if (video.duration) {
                    setProgress((video.currentTime / video.duration) * 100);
                  }
                }}
                onEnded={() => moveStory(1)}
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                key={activeStory._id}
                src={activeStory.media.url}
                alt={`${activeGroup.author.username}'s story`}
                onLoad={() => setProgress(0)}
                className="h-full w-full object-contain"
              />
            )}

            <button
              type="button"
              aria-label="Previous story"
              onClick={() => moveStory(-1)}
              className="absolute inset-y-16 left-0 z-10 flex w-1/4 items-center justify-start pl-2 text-white/70"
            >
              <ChevronLeft className="h-7 w-7 drop-shadow" />
            </button>
            <button
              type="button"
              aria-label="Next story"
              onClick={() => moveStory(1)}
              className="absolute inset-y-16 right-0 z-10 flex w-1/4 items-center justify-end pr-2 text-white/70"
            >
              <ChevronRight className="h-7 w-7 drop-shadow" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
