import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useMinuteTick } from "@/hooks/useMinuteTick";
import { useFadeOnChange } from "@/hooks/useFadeOnChange";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";
import { VideoPlayer } from "@/components/VideoPlayer";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface ThoughtProps {
  id: number;
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
  onDelete?: (id: any) => void;
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
function MediaGallery({ items }: { items: MediaItem[] }) {
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
      className="mt-3 rounded-2xl overflow-hidden relative select-none"
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border) / 0.4)",
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
function ActionBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 group transition-all duration-150 active:scale-90"
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
  content,
  media,
  mediaUrl,
  mediaType,
  likes,
  comments,
  id,
  authorId,
  currentUserId,
  onDelete,
}: ThoughtProps) {
  const mediaItems: MediaItem[] =
    media && media.length > 0
      ? media
      : mediaUrl
      ? [{ url: mediaUrl, type: (mediaType as "image" | "video") || "image" }]
      : [];

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

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
    onDelete &&
    currentUserId &&
    authorId &&
    currentUserId === authorId
  );
  const truncated = content.length > 200;
  const displayContent = truncated ? content.substring(0, 200) : content;

  return (
    <article className="px-4 py-4 border-b border-border/50 animate-fade-in">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${username}`} className="flex-shrink-0 mt-0.5">
          <AvatarFallback src={avatar} username={username} />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <Link
                to={`/profile/${username}`}
                className="text-sm font-semibold leading-tight truncate hover:underline"
              >
                {username}
              </Link>
              <span
                className={`text-[11px] text-muted-foreground flex-shrink-0 transition-opacity duration-150 ${
                  fade ? "opacity-0" : "opacity-100"
                }`}
                title={format(parseISO(time), "dd MMM yyyy, hh:mm a")}
              >
                · {timeText}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {isOwner && (
                <button
                  onClick={() => onDelete!(id)}
                  className="text-[11px] text-destructive hover:text-destructive/80 transition-colors px-1"
                >
                  Delete
                </button>
              )}
              <button className="p-1 rounded-full hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content */}
          <Link to={`/thought/${id}`} className="block">
            <p className="text-[14.5px] leading-[1.55] text-foreground">
              {displayContent}
              {truncated && (
                <span className="text-muted-foreground ml-1">…more</span>
              )}
            </p>
          </Link>

          {/* Media */}
          <MediaGallery items={mediaItems} />

          {/* Action bar */}
          <div className="flex items-center gap-5 mt-3.5">
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
              className="flex items-center gap-1.5 group transition-all duration-150 active:scale-90"
            >
              <MessageCircle className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
              {comments > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {comments}
                </span>
              )}
            </Link>

            <ActionBtn>
              <Repeat2 className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </ActionBtn>

            <ActionBtn>
              <Send className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </ActionBtn>
          </div>
        </div>
      </div>
    </article>
  );
}
