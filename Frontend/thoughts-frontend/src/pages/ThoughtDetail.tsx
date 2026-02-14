import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const mockComments = [
  {
    id: 1,
    username: "sarah_j",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    text: "This is so beautifully written. Really resonates with me.",
    time: "1h",
    likes: 5,
  },
  {
    id: 2,
    username: "mike_codes",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    text: "Couldn't agree more. We need more spaces like this.",
    time: "45m",
    likes: 3,
  },
  {
    id: 3,
    username: "emma_reads",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    text: "The kind of thought that makes you stop and think. Love it.",
    time: "30m",
    likes: 8,
  },
];

const mockThought = {
  id: "1",
  username: "alex_design",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face",
  time: "2h",
  content:
    "Just started working on a new minimal design system. The focus is purely on typography and whitespace. Less is definitely more. ✨\n\nThere's something deeply satisfying about stripping away the unnecessary and finding what truly matters in a design. Every pixel should earn its place.",
  image:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  likes: 42,
  comments: 8,
};

export default function ThoughtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(mockThought.likes);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(mockComments);

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
              src={mockThought.avatar}
              alt={mockThought.username}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0 bg-muted"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {mockThought.username}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {mockThought.time}
                  </span>
                </div>
                <button className="p-1 rounded-full hover:bg-secondary transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[16px] leading-relaxed whitespace-pre-line">
            {mockThought.content}
          </p>

          {mockThought.image && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border/40">
              <img
                src={mockThought.image}
                alt="Post"
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{likeCount}</strong> likes
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
