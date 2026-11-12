
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
  Loader2,
  Play,
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ThoughtCard } from "@/components/ThoughtCard";
import { useAuth } from "@/hooks/useAuth";

import { useActivityBadge } from "@/hooks/useActivityBadge";

import {
  getThought,
  getNotifications,
  markNotificationRead,
} from "@/lib/api";

import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { toast } from "sonner";

interface ActivityMediaItem {
  url: string;
  type: "image" | "video";
}

interface ActivityThought {
  _id: string;
  text?: string;
  media?: ActivityMediaItem[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

interface NotificationItem {
  _id: string;
  type: "like" | "comment" | "follow";

  actor: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
  };

  thought?: {
    _id: string;
    text?: string;
    media?: ActivityMediaItem[];
  } | null;

  comment?: {
    _id: string;
    text: string;
  } | null;

  readAt: string | null;
  createdAt: string;
}

const notificationConfig = {
  like: {
    icon: Heart,
    label: "liked your thought",
    color: "text-destructive",
  },
  comment: {
    icon: MessageCircle,
    label: "commented on your thought",
    color: "text-primary",
  },
  follow: {
    icon: UserPlus,
    label: "started following you",
    color: "text-green-500",
  },
};

export default function Activity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { refreshUnreadCount } = useActivityBadge();
  const [selectedThought, setSelectedThought] = useState<ActivityThought | null>(null);
  const [isThoughtDialogOpen, setIsThoughtDialogOpen] = useState(false);
  const [isLoadingThought, setIsLoadingThought] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],

    queryFn: async () => {
      const response = await getNotifications({ limit: 30 });
      return response.data;
    },

    refetchInterval: 30000,
  });

  const notifications: NotificationItem[] =
    data?.notifications ?? [];

  const handleNotificationClick = async (id: string) => {
    try {
      await markNotificationRead(id);

      await queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      await refreshUnreadCount();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getTarget = (item: NotificationItem) => {
    if (item.type === "follow") {
      return `/profile/${item.actor.username}`;
    }

    if (item.thought?._id) {
      return `/thought/${item.thought._id}`;
    }

    return `/profile/${item.actor.username}`;
  };

  const openThought = async (item: NotificationItem) => {
    if (!item.thought?._id) return;

    void handleNotificationClick(item._id);
    setSelectedThought(null);
    setIsThoughtDialogOpen(true);
    setIsLoadingThought(true);

    try {
      const response = await getThought(item.thought._id);
      setSelectedThought(response.data.thought);
    } catch (error) {
      console.error("Failed to load thought from activity:", error);
      toast.error("Unable to load this thought.");
      setIsThoughtDialogOpen(false);
    } finally {
      setIsLoadingThought(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-4">
          <h1 className="text-xl font-bold">Activity</h1>

          <p className="text-xs text-muted-foreground mt-1">
            Notifications disappear after 24 hours.
          </p>
        </header>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-6 h-6" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-center text-sm text-muted-foreground py-20">
            Unable to load notifications.
          </p>
        )}

        {/* Empty state */}
        {!isLoading &&
          !isError &&
          notifications.length === 0 && (
            <div className="flex flex-col items-center py-24 gap-3">
              <Bell className="w-12 h-12 text-muted-foreground/40" />

              <h2 className="font-semibold">
                You're all caught up!
              </h2>

              <p className="text-sm text-muted-foreground">
                Your new activity will appear here.
              </p>
            </div>
          )}

        {/* Notification list */}
        <div className="divide-y divide-border/50">
          {notifications.map((item) => {
            const config = notificationConfig[item.type];
            const Icon = config.icon;

            return (
              <div
                key={item._id}
                className={`flex flex-wrap items-start gap-3 px-4 py-4 transition-colors hover:bg-secondary/50 ${
                  !item.readAt ? "bg-accent/30" : ""
                }`}
              >
                <Link
                  to={getTarget(item)}
                  onClick={() => void handleNotificationClick(item._id)}
                  className="flex flex-1 items-start gap-3 min-w-0"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={item.actor?.avatar} />
                      <AvatarFallback>
                        {item.actor?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold">
                        {item.actor?.username || "Someone"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {config.label}
                      </span>
                    </p>

                    {item.comment?.text && (
                      <p className="text-sm mt-1 line-clamp-2">
                        "{item.comment.text}"
                      </p>
                    )}

                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Unread indicator */}
                  {!item.readAt && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </Link>

                {!!item.thought?.media?.length && (
                  <div className="ml-14 flex max-w-full gap-1 overflow-x-auto">
                    {item.thought.media.map((media, index) => (
                      <button
                        key={`${media.url}-${index}`}
                        type="button"
                        onClick={() => void openThought(item)}
                        aria-label={`Open ${media.type} from thought`}
                        className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted"
                      >
                        {media.type === "video" ? (
                          <>
                            <video
                              src={media.url}
                              muted
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <Play className="h-5 w-5 fill-white text-white" />
                            </span>
                          </>
                        ) : (
                          <img
                            src={media.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        open={isThoughtDialogOpen}
        onOpenChange={(open) => {
          setIsThoughtDialogOpen(open);
          if (!open) setSelectedThought(null);
        }}
      >
        <DialogContent className="p-0 max-w-lg w-full overflow-hidden rounded-2xl">
          {isLoadingThought || !selectedThought ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ThoughtCard
              id={selectedThought._id}
              username={selectedThought.author?.username || ""}
              avatar={selectedThought.author?.avatar || ""}
              time={selectedThought.createdAt}
              content={selectedThought.text || ""}
              media={selectedThought.media}
              likes={selectedThought.likesCount ?? 0}
              comments={selectedThought.commentsCount ?? 0}
              authorId={selectedThought.author?._id}
              currentUserId={user?._id}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
