import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  ArrowLeft,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import ThoughtSkeleton from "@/components/ThoughtSkeleton";

export default function ThoughtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [thought, setThought] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // ✅ FETCH THOUGHT
  useEffect(() => {
    const fetchThought = async () => {
      try {
        const res = await api.get(`/thoughts/${id}`);
        setThought(res.data.thought);
        setComments(res.data.comments || []);
        setLikeCount(res.data.thought.likesCount || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThought();
  }, [id]);

  const mediaUrl =
    thought?.media?.length ? thought.media[0].url : undefined;
  const mediaType =
    thought?.media?.length ? thought.media[0].type : undefined;

  // ✅ VIDEO EFFECT (ALWAYS CALLED)
  useEffect(() => {
    if (!mediaUrl || mediaType !== "video") return;

    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          vid.play().catch(() => {});
          setIsPlaying(true);
        } else {
          vid.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(vid);
    return () => observer.disconnect();
  }, [mediaUrl, mediaType]);

  // ⬇️ NOW SAFE TO RETURN CONDITIONALLY ⬇️
  if (loading) {
    return (
      <div className="min-h-screen pt-14">
        <ThoughtSkeleton />
      </div>
    );
  }

  if (!thought) {
    return <div className="pt-20 text-center">Thought not found</div>;
  }

  const timeText = formatRelativeTime(thought.createdAt);
  
  const handleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      {
        id: Date.now(),
        username: "you",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
        text: commentText.trim(),
        time: "now",
        likes: 0,
      },
      ...prev,
    ]);
    setCommentText("");
  };

  

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
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4">
        {/* Back button */}
        <div className="py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Thought */}
        <article className="pb-4 border-b border-border/60 animate-fade-in">
          <div className="flex gap-3">
            <img
              src={
                thought.author.avatar ||
                "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80&h=80&fit=crop&crop=face"
              }
              alt={thought.author.username}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0 bg-muted"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {thought.author.username}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {timeText}
                  </span>
                </div>
                <button className="p-1 rounded-full hover:bg-secondary transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[16px] leading-relaxed whitespace-pre-line">
            {thought.text}
          </p>

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

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{thought.likesCount}</strong>{" "}
              likes
            </span>
            <span>
              <strong className="text-foreground">{comments.length}</strong>{" "}
              comments
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around py-2 border-t border-b border-border/40">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-secondary transition-colors group"
            >
              <Heart
                className={`h-5 w-5 transition-all duration-200 ${
                  liked
                    ? "fill-destructive text-destructive animate-heart-pop"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span
                className={`text-sm ${
                  liked ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                Like
              </span>
            </button>

            <button className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-secondary transition-colors group">
              <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm text-muted-foreground">Comment</span>
            </button>

            <button className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-secondary transition-colors group">
              <Repeat2 className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm text-muted-foreground">Repost</span>
            </button>

            <button className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-secondary transition-colors group">
              <Send className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm text-muted-foreground">Share</span>
            </button>
          </div>
        </article>

        {/* Comment input */}
        <div className="flex gap-3 py-4 border-b border-border/40">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
            alt="You"
            className="h-9 w-9 rounded-full object-cover flex-shrink-0 bg-muted"
          />
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[40px] resize-none text-sm"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="self-end rounded-full"
            >
              Post
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="py-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 py-3 animate-fade-in">
              <img
                src={c.avatar}
                alt={c.username}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0 bg-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.time}
                  </span>
                </div>
                <p className="text-sm mt-0.5 leading-relaxed">{c.text}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Like {c.likes > 0 && `(${c.likes})`}
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
