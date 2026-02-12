import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface ThoughtProps {
  id: number;
  username: string;
  avatar: string;
  time: string;
  content: string;
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
  mediaUrl,
  mediaType,
  likes,
  comments,
  id,
  authorId,
  currentUserId,
  onDelete,
}: ThoughtProps & { onDelete?: (id: any) => void }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;

    // ensure video is muted by default so autoplay is allowed
    try {
      vid.muted = true;
    } catch (e) {}

    const playIfVisible = async () => {
      try {
        await vid.play();
        if (!cancelled) setIsPlaying(true);
      } catch (e) {
        // autoplay might be blocked if not muted; keep muted by default
      }
    };

    const pauseIfHidden = () => {
      try {
        vid.pause();
      } catch (e) {}
      setIsPlaying(false);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          playIfVisible();
        } else {
          pauseIfHidden();
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(vid);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [mediaUrl]);

  const handleVideoClick = () => {
    // toggle mute/unmute on click
    const vid = videoRef.current;
    if (!vid) return;
    const newMuted = !isMuted;
    vid.muted = newMuted;
    setIsMuted(newMuted);
    // if user unmutes, ensure playback
    if (!newMuted) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (vid.paused) {
        await vid.play();
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    } catch (e) {}
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
              <span className="text-xs text-muted-foreground">{time}</span>
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

          <p className="mt-1 text-[15px] leading-relaxed">{content}</p>

          {mediaUrl && mediaType === "image" && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/40">
              <img
                src={mediaUrl}
                alt="Post"
                className="w-full object-cover max-h-80"
              />
            </div>
          )}

          {mediaUrl && mediaType === "video" && (
            <div
              className="mt-3 rounded-xl overflow-hidden border border-border/40 relative"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              <video
                ref={videoRef}
                src={mediaUrl}
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
                onContextMenu={(e) => e.preventDefault()}
                disablePictureInPicture
                controlsList="nodownload noremoteplayback"
                className="w-full object-cover max-h-80 bg-black"
              />

              {/* Center play/pause overlay */}
              {showControls && (
                <button
                  onClick={togglePlay}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white z-10"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
              )}

              {/* Top-right mute toggle */}
              {showControls && (
                <button
                  onClick={handleVideoClick}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
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

            <button className="flex items-center gap-1.5 group">
              <MessageCircle className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
              {comments > 0 && (
                <span className="text-xs text-muted-foreground">
                  {comments}
                </span>
              )}
            </button>

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
