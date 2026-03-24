import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { User, Trash2, Reply, Send, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import * as api from "@/lib/api";

interface CommentAuthor {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
}

interface CommentData {
  _id: string;
  text: string;
  author: CommentAuthor;
  createdAt: string;
  replies?: CommentData[];
}

interface CommentSectionProps {
  thoughtId: string;
  currentUserId?: string;
  initialComments?: CommentData[];
  onCountChange?: (delta: number) => void;
}

/* ─── Avatar with fallback ────────────────────────────── */
function CommentAvatar({ src, username, size = 8 }: { src?: string; username: string; size?: number }) {
  const [error, setError] = useState(false);
  const cls = `h-${size} w-${size} rounded-full object-cover flex-shrink-0`;

  if (src && !error) {
    return <img src={src} alt={username} onError={() => setError(true)} className={cls} />;
  }
  return (
    <span className={`${cls} bg-muted flex items-center justify-center`}>
      <User className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  );
}

/* ─── Single Comment ──────────────────────────────────── */
function CommentItem({
  comment,
  thoughtId,
  currentUserId,
  onDelete,
  onReplyAdded,
  isReply = false,
}: {
  comment: CommentData;
  thoughtId: string;
  currentUserId?: string;
  onDelete: (id: string, repliesCount: number) => void;
  onReplyAdded: (parentId: string, newReply: CommentData) => void;
  isReply?: boolean;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwn = currentUserId && comment.author._id === currentUserId;
  const replyCount = comment.replies?.length ?? 0;

  const handleDelete = async () => {
    try {
      await api.deleteComment(comment._id);
      onDelete(comment._id, replyCount);
    } catch {
      // silent fail — could toast here
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.replyToComment(thoughtId, comment._id, replyText.trim());
      onReplyAdded(comment._id, res.data.comment);
      setReplyText("");
      setShowReplyBox(false);
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex gap-2.5 ${isReply ? "ml-10 mt-2" : "py-3 border-b border-border/30 last:border-0"}`}>
      <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0 mt-0.5">
        <CommentAvatar src={comment.author.avatar} username={comment.author.username} size={isReply ? 7 : 8} />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Author + time */}
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            to={`/profile/${comment.author.username}`}
            className="text-xs font-semibold hover:underline leading-tight"
          >
            {comment.author.username}
          </Link>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Text */}
        <p className="text-sm leading-relaxed text-foreground break-words">{comment.text}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5">
          {!isReply && currentUserId && (
            <button
              onClick={() => {
                setShowReplyBox((v) => !v);
                if (!showReplyBox) setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
          {isOwn && (
            <button
              onClick={handleDelete}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
          {!isReply && replyCount > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Inline reply input */}
        {showReplyBox && (
          <div className="mt-2 flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder={`Reply to @${comment.author.username}…`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
              className="min-h-[36px] text-xs resize-none"
              rows={1}
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyText.trim() || submitting}
                className="h-7 px-2 rounded-full text-xs"
              >
                <Send className="h-3 w-3" />
              </Button>
              <button
                onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                className="h-7 rounded-full px-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 space-y-0">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                thoughtId={thoughtId}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onReplyAdded={onReplyAdded}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CommentSection (main export) ───────────────────── */
export default function CommentSection({
  thoughtId,
  currentUserId,
  initialComments = [],
  onCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    const optimisticId = `temp-${Date.now()}`;
    const optimistic: CommentData = {
      _id: optimisticId,
      text: text.trim(),
      author: { _id: currentUserId ?? "", username: "you" },
      createdAt: new Date().toISOString(),
      replies: [],
    };

    // Optimistic add
    setComments((prev) => [optimistic, ...prev]);
    setText("");
    onCountChange?.(1);
    setSubmitting(true);

    try {
      const res = await api.addComment(thoughtId, optimistic.text);
      // Replace optimistic row with real data from server
      setComments((prev) =>
        prev.map((c) => (c._id === optimisticId ? res.data.comment : c))
      );
    } catch {
      // Rollback on error
      setComments((prev) => prev.filter((c) => c._id !== optimisticId));
      setText(optimistic.text);
      onCountChange?.(-1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (deletedId: string, repliesCount: number) => {
    setComments((prev) => {
      // If it's a reply, find its parent and remove from replies array
      const isTopLevel = prev.some((c) => c._id === deletedId);
      if (isTopLevel) {
        onCountChange?.(-(1 + repliesCount));
        return prev.filter((c) => c._id !== deletedId);
      }
      // It's a reply
      onCountChange?.(-1);
      return prev.map((c) => ({
        ...c,
        replies: (c.replies ?? []).filter((r) => r._id !== deletedId),
      }));
    });
  };

  const handleReplyAdded = (parentId: string, newReply: CommentData) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === parentId
          ? { ...c, replies: [...(c.replies ?? []), newReply] }
          : c
      )
    );
    onCountChange?.(1);
  };

  return (
    <div>
      {/* Comment input */}
      {currentUserId && (
        <div className="flex gap-3 py-4 border-b border-border/40">
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="min-h-[40px] resize-none text-sm"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="self-end rounded-full"
            >
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="py-1">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No comments yet. Be the first to comment!
          </p>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c._id}
            comment={c}
            thoughtId={thoughtId}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onReplyAdded={handleReplyAdded}
          />
        ))}
      </div>
    </div>
  );
}
