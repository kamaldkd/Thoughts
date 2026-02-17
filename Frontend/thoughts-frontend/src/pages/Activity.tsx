import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Repeat2, AtSign } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useActivityBadge } from "@/hooks/useActivityBadge";

type ActivityType = "like" | "comment" | "follow" | "repost" | "mention";

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: { username: string; avatar: string };
  time: string;
  thoughtPreview?: string;
  commentText?: string;
  read: boolean;
}

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    type: "like",
    user: { username: "sarah_j", avatar: "https://i.pravatar.cc/150?img=1" },
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    thoughtPreview: "The beauty of simplicity in design...",
    read: false,
  },
  {
    id: "2",
    type: "comment",
    user: { username: "mikael", avatar: "https://i.pravatar.cc/150?img=3" },
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    thoughtPreview: "Morning coffee rituals ☕",
    commentText: "Totally agree! Nothing beats a good pour-over.",
    read: false,
  },
  {
    id: "3",
    type: "follow",
    user: { username: "elena_writes", avatar: "https://i.pravatar.cc/150?img=5" },
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: "4",
    type: "repost",
    user: { username: "devraj", avatar: "https://i.pravatar.cc/150?img=7" },
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    thoughtPreview: "Why I switched to TypeScript and never looked back",
    read: true,
  },
  {
    id: "5",
    type: "mention",
    user: { username: "alex_codes", avatar: "https://i.pravatar.cc/150?img=8" },
    time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    thoughtPreview: "Shoutout to @you for the great thread yesterday!",
    read: true,
  },
  {
    id: "6",
    type: "like",
    user: { username: "priya_m", avatar: "https://i.pravatar.cc/150?img=9" },
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    thoughtPreview: "Late night coding sessions hit different...",
    read: true,
  },
  {
    id: "7",
    type: "follow",
    user: { username: "jordan_k", avatar: "https://i.pravatar.cc/150?img=11" },
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    read: true,
  },
  {
    id: "8",
    type: "comment",
    user: { username: "luna_dev", avatar: "https://i.pravatar.cc/150?img=12" },
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    thoughtPreview: "React Server Components are the future",
    commentText: "Great insight! Have you tried the new patterns?",
    read: true,
  },
];

const iconMap: Record<ActivityType, { icon: typeof Heart; color: string }> = {
  like: { icon: Heart, color: "text-destructive" },
  comment: { icon: MessageCircle, color: "text-primary" },
  follow: { icon: UserPlus, color: "text-accent-foreground" },
  repost: { icon: Repeat2, color: "text-primary" },
  mention: { icon: AtSign, color: "text-primary" },
};

const labelMap: Record<ActivityType, string> = {
  like: "liked your thought",
  comment: "commented on your thought",
  follow: "started following you",
  repost: "reposted your thought",
  mention: "mentioned you",
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const { icon: Icon, color } = iconMap[item.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
        !item.read ? "bg-accent/40" : "hover:bg-secondary/50"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={item.user.avatar} alt={item.user.username} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {item.user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border-2 border-background flex items-center justify-center`}
        >
          <Icon className={`w-2.5 h-2.5 ${color}`} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <Link to={`/profile/${item.user.username}`} className="font-semibold hover:underline">
            {item.user.username}
          </Link>{" "}
          <span className="text-muted-foreground">{labelMap[item.type]}</span>
        </p>

        {item.commentText && (
          <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
            "{item.commentText}"
          </p>
        )}

        {item.thoughtPreview && item.type !== "follow" && !item.commentText && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
            {item.thoughtPreview}
          </p>
        )}

        <span className="text-[11px] text-muted-foreground mt-1 block">
          {formatRelativeTime(item.time)}
        </span>
      </div>

      {!item.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

export default function Activity() {
  const [activities] = useState(mockActivity);
  const { markAsSeen } = useActivityBadge();

  useEffect(() => {
    markAsSeen();
  }, [markAsSeen]);

  const unreadCount = activities.filter((a) => !a.read).length;

  const filterByType = (types: ActivityType[]) =>
    activities.filter((a) => types.includes(a.type));

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Activity</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="w-full bg-secondary/50">
              <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
              <TabsTrigger value="likes" className="flex-1 text-xs">Likes</TabsTrigger>
              <TabsTrigger value="comments" className="flex-1 text-xs">Comments</TabsTrigger>
              <TabsTrigger value="follows" className="flex-1 text-xs">Follows</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-1">
            <div className="divide-y divide-border/40">
              {activities.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="likes" className="mt-1">
            <div className="divide-y divide-border/40">
              {filterByType(["like"]).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-1">
            <div className="divide-y divide-border/40">
              {filterByType(["comment", "mention"]).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="follows" className="mt-1">
            <div className="divide-y divide-border/40">
              {filterByType(["follow"]).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
