import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
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
}

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
}: ThoughtProps & { onDelete?: (id: any) => void }) {
  // Normalize media: support both new `media[]` and legacy single `mediaUrl`
  const mediaItems: MediaItem[] =
    media && media.length > 0
      ? media
      : mediaUrl
      ? [{ url: mediaUrl, type: (mediaType as "image" | "video") || "image" }]
      : [];
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const handleDragStart = (clientX: number) => {
    setDragStartX(clientX);
  };

  const handleDragEnd = (clientX: number) => {
    if (dragStartX === null) return;

    const diff = dragStartX - clientX;

    if (diff > 50 && currentSlide < mediaItems.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else if (diff < -50 && currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
    }

    setDragStartX(null);
  };

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!currentUserId) return;
      const res = await api.get(`/likes/status/${id}`);
      setLiked(res.data.liked);
    };
    fetchLikeStatus();
  }, [id, currentUserId]);

  useMinuteTick();
  const timeText = formatRelativeTime(time);
  const { displayValue, fade } = useFadeOnChange(timeText);

  const handleLike = async () => {
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    try {
      await api.post(`/likes/toggle/${id}`);
    } catch {
      // rollback
      setLiked((prev) => !prev);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    }
  };

  const goToSlide = (dir: "prev" | "next") => {
    setCurrentSlide((prev) =>
      dir === "prev"
        ? (prev - 1 + mediaItems.length) % mediaItems.length
        : (prev + 1) % mediaItems.length
    );
  };

  return (
    <article className="py-4 border-b border-border/60 animate-fade-in">
      <div className="flex gap-3">
        <img
          src={avatar}
          alt={username}
          className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-muted"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{username}</span>
              <span
                className={`text-[11px] text-muted-foreground transition-opacity duration-150 ${
                  fade ? "opacity-0" : "opacity-100"
                }`}
                title={format(parseISO(time), "dd MMM yyyy, hh:mm a")}
              >
                • {timeText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onDelete &&
                currentUserId &&
                authorId &&
                currentUserId === authorId && (
                  <button
                    onClick={() => onDelete(id)}
                    className="text-xs text-destructive hover:underline mr-2"
                  >
                    Delete
                  </button>
                )}
              <button className="p-1 rounded-full hover:bg-secondary transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <Link
            to={`/thought/${id}`}
            className="mt-1 text-[15px] leading-relaxed"
          >
            {content.length > 100
              ? content.substring(0, 100) + "...see more"
              : content}
          </Link>

          {/* Media gallery */}
          {mediaItems.length > 0 && (
            <div
              className="mt-3 rounded-xl overflow-hidden border border-border/40 relative select-none cursor-grab active:cursor-grabbing"
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
              onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseUp={(e) => handleDragEnd(e.clientX)}
            >
              {mediaItems.length > 1 && (
                <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                  {mediaItems.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i === currentSlide
                          ? "bg-foreground"
                          : "bg-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Current slide */}
              <div className="relative w-full overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {mediaItems.map((item, index) => (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 aspect-[4/5] bg-black flex items-center justify-center"
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={`Post media ${index + 1}`}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      ) : (
                          <VideoPlayer src={item.url} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows for multiple items */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={() => goToSlide("prev")}
                    className="absolute md:flex left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors z-10"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-4 h-4 hidden md:flex" />
                  </button>
                  <button
                    onClick={() => goToSlide("next")}
                    className="absolute md:flex right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors z-10"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-4 h-4 hidden md:flex" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {mediaItems.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === currentSlide
                            ? "bg-primary w-3"
                            : "bg-muted-foreground/50"
                        }`}
                        aria-label={`Go to media ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-5 mt-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 group"
            >
              <Heart
                className={`h-[18px] w-[18px] transition-all duration-200 ${
                  liked
                    ? "fill-destructive text-destructive animate-heart-pop"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {likeCount > 0 && (
                <span
                  className={`text-xs ${
                    liked ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {likeCount}
                </span>
              )}
            </button>

            <Link
              to={`/thought/${id}`}
              className="flex items-center gap-1.5 group"
            >
              <MessageCircle className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
              {comments > 0 && (
                <span className="text-xs text-muted-foreground">
                  {comments}
                </span>
              )}
            </Link>

            <button className="group">
              <Repeat2 className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button className="group">
              <Send className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
