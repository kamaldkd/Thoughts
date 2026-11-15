import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreVertical,
  User,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Sparkles,
  MessageSquareText,
  MessagesSquare,
  Lightbulb,
} from "lucide-react";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useMinuteTick } from "@/hooks/useMinuteTick";
import { useFadeOnChange } from "@/hooks/useFadeOnChange";
import { format, parseISO } from "date-fns";
import api, { checkIsFollowing, followUser, updateThought } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FollowButton } from "@/components/profile/FollowButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LotusMark } from "@/components/lotus/LotusBloom";
import type { LotusThoughtAction } from "@/lib/api";

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface ThoughtProps {
  id: string;
  username: string;
  avatar: string;
  time: string;
  content: string;
  media?: MediaItem[];
  mediaUrl?: string;
  mediaType?: string;
  likes: number;
  comments: number;
  authorId?: string;
  currentUserId?: string;
  showFollowButton?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, text: string) => void;
}

/* ─── Avatar with fallback ───────────────────────────────────────────────── */
function AvatarFallback({ src, username }: { src: string; username: string }) {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={username}
        onError={() => setError(true)}
        className="h-9 w-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <span className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center bg-muted">
      <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
    </span>
  );
}

/* ─── Media Gallery ──────────────────────────────────────────────────────── */
export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [current, setCurrent] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const go = (dir: "prev" | "next") =>
    setCurrent((p) =>
      dir === "prev"
        ? (p - 1 + items.length) % items.length
        : (p + 1) % items.length
    );

  const onDragStart = (x: number) => setDragStartX(x);
  const onDragEnd = (x: number) => {
    if (dragStartX === null) return;
    const diff = dragStartX - x;
    if (diff > 50 && current < items.length - 1) setCurrent((s) => s + 1);
    else if (diff < -50 && current > 0) setCurrent((s) => s - 1);
    setDragStartX(null);
  };

  if (items.length === 0) return null;

  const single = items.length === 1;
  const item = items[current];

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-2xl border border-border/40 bg-black select-none"
      style={{
        background: "hsl(var(--muted))",
      }}
      onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onDragStart(e.clientX)}
      onMouseUp={(e) => onDragEnd(e.clientX)}
    >
      {/* Progress bar (multi-media only) */}
      {!single && (
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex gap-1 pointer-events-none">
          {items.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i === current
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      )}
      {!single && (
        <span className="absolute right-2.5 top-5 z-20 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-medium tabular-nums text-white shadow-sm backdrop-blur-md">
          {current + 1}/{items.length}
        </span>
      )}

      {/* Slides */}
      <div className="w-full overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((it, idx) => (
            <div
              key={idx}
              className="w-full flex-shrink-0 flex items-center justify-center"
              style={{ background: "#000" }}
            >
              {it.type === "image" ? (
                <img
                  src={it.url}
                  alt={`Media ${idx + 1}`}
                  draggable={false}
                  className="w-full"
                  style={{
                    display: "block",
                    maxHeight: 520,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div className="w-full">
                  <VideoPlayer src={it.url} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next arrows (multi-media) */}
      {!single && (
        <>
          {current > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                go("prev");
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.45)" }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
          {current < items.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                go("next");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.45)" }}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Dot indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
            {items.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === current ? 14 : 6,
                  height: 6,
                  background:
                    i === current
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Action Button ──────────────────────────────────────────────────────── */
export function ActionBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex h-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-all duration-150 hover:bg-secondary/70 hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}

/* ─── ThoughtCard ────────────────────────────────────────────────────────── */
export function ThoughtCard({
  username,
  avatar,
  time,
  content = "",
  media,
  mediaUrl,
  mediaType,
  likes,
  comments,
  id,
  authorId,
  currentUserId,
  showFollowButton = false,
  onDelete,
  onEdit,
}: ThoughtProps) {
  const mediaItems: MediaItem[] =
    media && media.length > 0
      ? media
      : mediaUrl
      ? [{ url: mediaUrl, type: (mediaType as "image" | "video") || "image" }]
      : [];

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [thoughtText, setThoughtText] = useState(content);
  const [editText, setEditText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const canFollow =
    showFollowButton &&
    !!currentUserId &&
    !!authorId &&
    currentUserId !== authorId;
  const followStatusKey = ["follow-status", currentUserId, authorId];
  const {
    data: isFollowing,
    isPending: isFollowStatusPending,
    isError: isFollowStatusError,
    error: followStatusError,
  } = useQuery({
    queryKey: followStatusKey,
    queryFn: async () => {
      if (!authorId) {
        throw new Error("Cannot check follow status without an author ID");
      }
      const response = await checkIsFollowing(authorId);
      return Boolean(response.data.isFollowing);
    },
    enabled: canFollow,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (isFollowStatusError) {
      console.error("Failed to load feed author follow status:", followStatusError);
    }
  }, [isFollowStatusError, followStatusError]);

  const handleFollow = async () => {
    if (!authorId) return;
    try {
      await followUser(authorId);
      queryClient.setQueryData(followStatusKey, true);
    } catch (error) {
      console.error("Failed to follow feed author:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    api
      .get(`/likes/status/${id}`)
      .then((res) => setLiked(res.data.liked))
      .catch(() => {});
  }, [id, currentUserId]);

  useMinuteTick();
  const timeText = formatRelativeTime(time);
  const { displayValue, fade } = useFadeOnChange(timeText);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      await api.post(`/likes/toggle/${id}`);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  };

  const isOwner = !!(
    currentUserId &&
    authorId &&
    currentUserId === authorId
  );
  const truncated = thoughtText.length > 200;
  const displayContent = truncated ? thoughtText.substring(0, 200) : thoughtText;

  const handleEdit = async () => {
    const text = editText.trim();
    if (!text && mediaItems.length === 0) return;

    setIsSavingEdit(true);
    try {
      await updateThought(id, { text });
      setThoughtText(text);
      setIsEditing(false);
      onEdit?.(id, text);
      await queryClient.invalidateQueries({ queryKey: ["thoughts"] });
      toast.success("Thought updated");
    } catch (error) {
      console.error("Failed to update thought:", error);
      toast.error("Failed to update thought");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openLotus = (thoughtAction: LotusThoughtAction) => {
    navigate("/lotus", {
      state: {
        thoughtId: id,
        thoughtAction,
      },
    });
  };

  return (
    <article className="group/card mx-3 my-3 overflow-hidden rounded-[24px] border border-border/60 bg-card/90 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md sm:mx-0 sm:my-4 sm:rounded-[28px] animate-fade-in">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <Link
          to={`/profile/${username}`}
          className="shrink-0 rounded-full bg-gradient-to-br from-fuchsia-400 via-violet-400 to-indigo-400 p-[2px] shadow-[0_0_16px_-8px_rgba(217,70,239,0.8)]"
        >
          <AvatarFallback src={avatar} username={username} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center">
          {/* Meta row */}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <Link
                to={`/profile/${username}`}
                className="truncate text-sm font-semibold leading-tight text-foreground hover:underline"
              >
                {username}
              </Link>
              <span
                className={`mt-1 truncate text-[11px] text-muted-foreground transition-opacity duration-150 ${
                  fade ? "opacity-0" : "opacity-100"
                }`}
                title={format(parseISO(time), "dd MMM yyyy, hh:mm a")}
              >
                {timeText}
              </span>
            </div>

            <div className="ml-2 flex shrink-0 items-center gap-1">
              {canFollow &&
                !isFollowStatusPending &&
                !isFollowStatusError &&
                isFollowing === false && (
                  <FollowButton
                    initialState="not_following"
                    onFollow={handleFollow}
                    className="h-7 rounded-md border px-3 text-xs font-medium shadow-none border-primary/40 bg-primary/5 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Thought options"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditText(thoughtText);
                        setIsEditing(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        onSelect={() => onDelete(id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {thoughtText.trim() && (
        <Link to={`/thought/${id}`} className="block px-4 pt-3 sm:px-5">
          <p className="whitespace-pre-wrap text-[14px] leading-6 text-foreground/90">
              {displayContent}
              {truncated && (
                <span className="ml-1 font-medium text-primary">…more</span>
              )}
          </p>
        </Link>
      )}

      {/* Media */}
      <MediaGallery items={mediaItems} />

      {/* Action bar */}
      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/50 px-3 py-2 sm:px-4">
            <ActionBtn onClick={handleLike}>
              <Heart
                className={`h-[18px] w-[18px] transition-all duration-200 ${
                  liked
                    ? "fill-destructive text-destructive scale-110"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {likeCount > 0 && (
                <span
                  className={`text-xs tabular-nums ${
                    liked ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {likeCount}
                </span>
              )}
            </ActionBtn>

            <Link
              to={`/thought/${id}`}
              aria-label={comments > 0 ? `${comments} comments` : "Open comments"}
              className="group flex h-9 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-all duration-150 hover:bg-secondary/70 hover:text-foreground active:scale-95"
            >
              <MessageCircle className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
              {comments > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {comments}
                </span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Ask Lotus about this post"
                  title="Ask Lotus"
                  className="group/lotus flex h-9 items-center gap-2 rounded-full border border-fuchsia-700/15 bg-gradient-to-r from-violet-500/[0.06] to-fuchsia-500/[0.06] py-1 pl-1.5 pr-3 text-[11px] font-medium text-fuchsia-800 shadow-[0_2px_12px_-8px_rgba(217,70,239,0.45)] transition-all duration-200 hover:border-fuchsia-700/30 hover:from-violet-500/[0.1] hover:to-fuchsia-500/[0.1] hover:text-fuchsia-950 hover:shadow-[0_4px_18px_-8px_rgba(217,70,239,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 dark:border-fuchsia-300/15 dark:from-violet-400/[0.07] dark:to-fuchsia-400/[0.07] dark:text-fuchsia-100/90 dark:hover:border-fuchsia-300/35 dark:hover:from-violet-400/[0.13] dark:hover:to-fuchsia-400/[0.13] dark:hover:text-white dark:focus-visible:ring-fuchsia-300/40"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/15 to-violet-500/15 text-fuchsia-800 ring-1 ring-inset ring-fuchsia-700/15 transition-transform duration-200 group-hover/lotus:scale-105 dark:from-fuchsia-300/20 dark:to-violet-400/20 dark:text-fuchsia-100 dark:ring-fuchsia-200/20">
                    <LotusMark className="h-[17px] w-[17px] -translate-y-px" />
                  </span>
                  <span>Ask Lotus</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-fuchsia-300/15 bg-[#17121f]/[0.97] p-2 text-zinc-100 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.85)] backdrop-blur-xl"
              >
                <DropdownMenuLabel className="px-3 pb-2 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200/70">
                  Lotus for this thought
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2 mb-1 bg-white/[0.07]" />
                <DropdownMenuItem
                  onSelect={() => openLotus("ask")}
                  className="gap-3 rounded-xl px-2.5 py-2.5 text-zinc-200 focus:bg-fuchsia-300/[0.09] focus:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[0.08] text-fuchsia-200">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">Ask about this thought</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">Explore a question or idea</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => openLotus("explain")}
                  className="gap-3 rounded-xl px-2.5 py-2.5 text-zinc-200 focus:bg-fuchsia-300/[0.09] focus:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-300/[0.07] text-violet-200">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">Explain this post</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">Unpack the main point</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => openLotus("comment")}
                  className="gap-3 rounded-xl px-2.5 py-2.5 text-zinc-200 focus:bg-fuchsia-300/[0.09] focus:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-pink-300/10 bg-pink-300/[0.07] text-pink-200">
                    <MessageSquareText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">Suggest a comment</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">Start a thoughtful conversation</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => openLotus("reply")}
                  className="gap-3 rounded-xl px-2.5 py-2.5 text-zinc-200 focus:bg-fuchsia-300/[0.09] focus:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-purple-300/10 bg-purple-300/[0.07] text-purple-200">
                    <MessagesSquare className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">Write a thoughtful reply</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">Respond with care and context</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => openLotus("summarize")}
                  className="gap-3 rounded-xl px-2.5 py-2.5 text-zinc-200 focus:bg-fuchsia-300/[0.09] focus:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-300/10 bg-indigo-300/[0.07] text-indigo-200">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">Summarize discussion</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">Find the key points in replies</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <ActionBtn>
              <Repeat2 className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </ActionBtn> */}

            {/* <ActionBtn>
              <Send className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </ActionBtn> */}
      </div>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit thought</DialogTitle>
            <DialogDescription>Update the text of your thought.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            maxLength={1000}
            rows={6}
            aria-label="Thought text"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSavingEdit}
              className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={isSavingEdit || (!editText.trim() && mediaItems.length === 0)}
              className="h-9 px-4 rounded-md bg-primary text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isSavingEdit ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
