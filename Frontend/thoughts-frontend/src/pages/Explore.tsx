import { useState } from "react";
import { Search, TrendingUp, Hash, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockThoughts } from "@/data/mockThoughts";
import { Link } from "react-router-dom";

const trendingTags = [
  { tag: "mindfulness", count: "2.4k thoughts" },
  { tag: "design", count: "1.8k thoughts" },
  { tag: "creativity", count: "1.5k thoughts" },
  { tag: "photography", count: "1.2k thoughts" },
  { tag: "slowliving", count: "980 thoughts" },
  { tag: "journaling", count: "870 thoughts" },
];

const suggestedUsers = [
  {
    username: "luna_writes",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    bio: "Writer & poet. Finding beauty in stillness.",
    followers: "3.2k",
  },
  {
    username: "kai_photo",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    bio: "Photographer. Chasing golden hours.",
    followers: "5.1k",
  },
  {
    username: "sarah_j",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    bio: "Architect & coffee lover.",
    followers: "2.7k",
  },
];

export default function Explore() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "trending" | "people" | "thoughts"
  >("trending");

  const filteredThoughts = mockThoughts.filter(
    (t) =>
      t.content.toLowerCase().includes(query.toLowerCase()) ||
      t.username.toLowerCase().includes(query.toLowerCase())
  );

  const tabs = [
    { key: "trending" as const, label: "Trending" },
    { key: "people" as const, label: "People" },
    { key: "thoughts" as const, label: "Thoughts" },
  ];

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4">
        {/* Search bar */}
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search thoughts, people, tags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-full bg-secondary border-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trending */}
        {activeTab === "trending" && (
          <div className="space-y-1 animate-fade-in">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending Tags
            </h2>
            {trendingTags.map((item, i) => (
              <button
                key={item.tag}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-left"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Hash className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">#{item.tag}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.count}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* People */}
        {activeTab === "people" && (
          <div className="space-y-1 animate-fade-in">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Suggested for you
            </h2>
            {suggestedUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-11 w-11 rounded-full object-cover flex-shrink-0 bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{user.username}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.bio}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {user.followers} followers
                  </div>
                </div>
                <button className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium transition-all hover:opacity-90">
                  Follow
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Thoughts search results */}
        {activeTab === "thoughts" && (
          <div className="animate-fade-in">
            {query ? (
              filteredThoughts.length > 0 ? (
                filteredThoughts.map((t) => (
                  <Link
                    key={t.id}
                    to={`/thought/${t.id}`}
                    className="flex gap-3 py-3 border-b border-border/40 hover:bg-secondary/50 transition-colors -mx-2 px-2 rounded-lg"
                  >
                    <img
                      src={t.avatar}
                      alt={t.username}
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0 bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {t.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {t.content}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No results for "{query}"
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Search for thoughts by keyword or username
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
