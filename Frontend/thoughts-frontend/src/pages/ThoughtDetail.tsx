import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import * as apiLib from "@/lib/api";
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
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import ThoughtSkeleton from "@/components/ThoughtSkeleton";
import CommentSection from "@/components/CommentSection";
import defaultAvatar from "../assets/hero-bg.jpg";

/* ─── Types ─────────────────────────────────────────── */
interface MediaItem { url: string; type: "image" | "video" }
interface Author { _id: string; username: string; avatar?: string }
interface Thought { _id: string; text?: string; media?: MediaItem[]; author: Author; createdAt: string; likesCount: number; commentsCount: number }
interface CommentData { _id: string; text: string; author: { _id: string; username: string; avatar?: string }; createdAt: string; replies?: CommentData[] }

export default function ThoughtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [thought, setThought] = useState<Thought | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Fetch thought, comments, and like status in parallel
  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [thoughtRes, commentsRes, meRes] = await Promise.allSettled([
          apiLib.getThought(id),
          apiLib.getComments(id),
          apiLib.default.get("/users/me"),
        ]);

        if (thoughtRes.status === "fulfilled") {
          const t = thoughtRes.value.data.thought;
          setThought(t);
          setLikeCount(t.likesCount ?? 0);
          setCommentCount(t.commentsCount ?? 0);

          // Fetch like status for this user
          try {
            const likeRes = await apiLib.getLikeStatus(t._id);
            setLiked(likeRes.data.liked);
          } catch { /* not logged in, leave as false */ }
        }

        if (commentsRes.status === "fulfilled") {
          setComments(commentsRes.value.data.comments ?? []);
        }

        if (meRes.status === "fulfilled") {
          setCurrentUserId(meRes.value.data.user?._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  // Intersection-observer based video autoplay
  useEffect(() => {
    const mediaUrl = thought?.media?.[0]?.url;
    const mediaType = thought?.media?.[0]?.type;
    if (!mediaUrl || mediaType !== "video") return;

    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { vid.play().catch(() => {}); setIsPlaying(true); }
        else { vid.pause(); setIsPlaying(false); }
      },
      { threshold: 0.5 }
    );
    observer.observe(vid);
    return () => observer.disconnect();
  }, [thought]);

  // Optimistic like toggle
  const handleLike = async () => {
    if (!thought) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    try {
      const res = await apiLib.toggleLike(thought._id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likesCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    }
  };

  const handleCommentCountChange = useCallback((delta: number) => {
    setCommentCount((c) => Math.max(0, c + delta));
  }, []);

  const handleVideoClick = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const newMuted = !isMuted;
    vid.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted) { vid.play().catch(() => {}); setIsPlaying(true); }
  };

  const togglePlay = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (vid.paused) { await vid.play(); setIsPlaying(true); }
      else { vid.pause(); setIsPlaying(false); }
    } catch {}
  };

  if (loading) return <div className="min-h-screen pt-14"><ThoughtSkeleton /></div>;
  if (!thought) return <div className="pt-20 text-center text-muted-foreground">Thought not found</div>;

  const mediaUrl = thought.media?.[0]?.url;
  const mediaType = thought.media?.[0]?.type;
  const timeText = formatRelativeTime(thought.createdAt);

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4">
        {/* Back */}
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
              src={thought.author.avatar || defaultAvatar}
              alt={thought.author.username}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0 bg-muted"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${thought.author.username}`} className="text-sm font-semibold hover:underline">
                    {thought.author.username}
                  </Link>
                  <span className="text-xs text-muted-foreground">{timeText}</span>
                </div>
                <button className="p-1 rounded-full hover:bg-secondary transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {thought.text && (
            <p className="mt-4 text-[16px] leading-relaxed whitespace-pre-line">{thought.text}</p>
          )}

          {mediaUrl && mediaType === "image" && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/40">
              <img src={mediaUrl} alt="Post" className="w-full object-cover max-h-80" />
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
              {showControls && (
                <button
                  onClick={togglePlay}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white z-10"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
              )}
              {showControls && (
                <button onClick={handleVideoClick} className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{likeCount}</strong> likes</span>
            <span><strong className="text-foreground">{commentCount}</strong> comments</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around py-2 border-t border-b border-border/40">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-secondary transition-colors group"
            >
              <Heart className={`h-5 w-5 transition-all duration-200 ${liked ? "fill-destructive text-destructive animate-heart-pop" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className={`text-sm ${liked ? "text-destructive" : "text-muted-foreground"}`}>Like</span>
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

        {/* Real comment section */}
        <CommentSection
          thoughtId={thought._id}
          currentUserId={currentUserId}
          initialComments={comments}
          onCountChange={handleCommentCountChange}
        />
      </div>
    </div>
  );
}
