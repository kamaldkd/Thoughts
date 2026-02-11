import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
} from "lucide-react";

interface ThoughtProps {
  id: number;
  username: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
}

export function ThoughtCard({
  username,
  avatar,
  time,
  content,
  image,
  likes,
  comments,
  id,
  onDelete,
}: ThoughtProps & { id?: any; onDelete?: (id: any) => void }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
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
              {onDelete && (
                <button
                  onClick={() => onDelete && onDelete(id)}
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

          {image && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/40">
              <img
                src={image}
                alt="Post"
                className="w-full object-cover max-h-80"
              />
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
