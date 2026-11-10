import { useEffect, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  Hash,
  X,
  Loader2,
  Users,
  UserRound,
  Heart,
  MessageCircle,
  Images,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { mockThoughts } from "@/data/mockThoughts";
import { FollowButton } from "@/components/profile/FollowButton";

import {
  getThoughts,
  searchUsers,
  followUser,
  unfollowUser,
} from "@/lib/api";

import { useDebounce } from "@/hooks/useDebounce";

type TabKey = "trending" | "people" | "thoughts";

interface SearchUser {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
  isFollowing: boolean;
}

interface ExploreMedia {
  url: string;
  type: "image" | "video";
}

interface ExploreThought {
  _id: string;
  text: string;
  media: ExploreMedia[];
  author?: {
    username?: string;
  };
  likesCount?: number;
  commentsCount?: number;
}

interface ExploreThoughtPage {
  thoughts: ExploreThought[];
  nextCursor: string | null;
  hasMore: boolean;
}

function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0">
      {Array.from({ length: 18 }, (_, index) => (
        <div
          key={index}
          className="relative aspect-square animate-pulse overflow-hidden bg-gradient-to-br from-secondary via-muted to-secondary"
        >
          {index % 5 === 0 && (
            <div className="absolute right-2 top-2 h-4 w-4 rounded-sm bg-background/25" />
          )}
        </div>
      ))}
    </div>
  );
}

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

  const [activeTab, setActiveTab] = useState<TabKey>("people");

  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query.trim(), 350);

  const {
    data: thoughtPages,
    isLoading: isLoadingThoughts,
    isError: isThoughtsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchThoughts,
  } = useInfiniteQuery({
    queryKey: ["explore-media"],
    queryFn: async ({ pageParam }) => {
      const response = await getThoughts({
        ...(pageParam ? { cursor: pageParam } : {}),
        limit: 30,
      });
      return response.data as ExploreThoughtPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });

  const mediaThoughts =
    thoughtPages?.pages
      .flatMap((page) => page.thoughts)
      .filter((thought) => thought.media?.some((media) => media.url)) ?? [];

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);


  // Real backend user search
  const {
    data: searchResults = [],
    isLoading: isSearching,
    isError,
  } = useQuery<SearchUser[]>({
    queryKey: ["user-search", debouncedQuery],

    queryFn: async ({ signal }) => {
      const response = await searchUsers(debouncedQuery, signal);

      return response.data.data;
    },

    enabled: activeTab === "people" && debouncedQuery.length >= 2,

    staleTime: 30 * 1000,
  });


  // Search thoughts (existing mock implementation)
  const filteredThoughts = mockThoughts.filter(
    (thought) =>
      thought.content.toLowerCase().includes(query.toLowerCase()) ||
      thought.username.toLowerCase().includes(query.toLowerCase())
  );

  const tabs: {
    key: TabKey;
    label: string;
  }[] = [
    // { key: "trending", label: "Trending" },
    { key: "people", label: "People" },
    // { key: "thoughts", label: "Thoughts" },
  ];

  // Follow a user from search results
  const handleFollow = async (userId: string) => {
    await followUser(userId);

    await queryClient.invalidateQueries({
      queryKey: ["user-search"],
    });
  };

  // Unfollow a user from search results
  const handleUnfollow = async (userId: string) => {
    await unfollowUser(userId);

    await queryClient.invalidateQueries({
      queryKey: ["user-search"],
    });
  };

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-3">
        {/* Search bar */}
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search people"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim()) setActiveTab("people");
              }}
              className="pl-10 pr-10 h-11 rounded-full bg-secondary border-none"
            />

            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Media discovery grid */}
        <section
          aria-label="Explore photos and videos"
          className="mb-6 -mx-4 w-[calc(100%+2rem)]"
        >

          {isLoadingThoughts ? (
            <MediaGridSkeleton />
          ) : isThoughtsError ? (
            <div className="py-10 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Could not load photos and videos.
              </p>
              <button
                type="button"
                onClick={() => void refetchThoughts()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : mediaThoughts.length === 0 ? (
            hasNextPage ? (
              <>
                <MediaGridSkeleton />
                <div
                  ref={loadMoreRef}
                  className="flex justify-center py-4"
                  aria-label="Loading more thoughts to find photos and videos"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No photos or videos to explore yet.
              </p>
            )
          ) : (
            <>
              <div className="grid grid-cols-3 gap-0">
                {mediaThoughts.map((thought) => {
                  const media = thought.media.find((item) => item.url);
                  if (!media) return null;

                  return (
                    <Link
                      key={thought._id}
                      to={`/thought/${thought._id}`}
                      aria-label={`View thought by ${thought.author?.username || "user"}`}
                      className="group relative aspect-square overflow-hidden bg-secondary"
                    >
                      {media.type === "video" ? (
                        <video
                          src={media.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={media.url}
                          alt={thought.text || "Thought"}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {thought.media.length > 1 && (
                        <Images
                          aria-hidden="true"
                          className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow"
                        />
                      )}
                      {thought.media.length === 1 &&
                        media.type === "video" && (
                          <Play
                            aria-hidden="true"
                            className="absolute right-2 top-2 h-4 w-4 fill-white text-white drop-shadow"
                          />
                        )}

                      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4 fill-white" />
                          {thought.likesCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4 fill-white" />
                          {thought.commentsCount ?? 0}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div ref={loadMoreRef} aria-hidden="true" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </section>

        {/* Tabs */}
        {/* <div className="flex border-b border-border/60 mb-4">
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
        </div> */}

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
                onClick={() => {
                  setQuery(item.tag);
                  setActiveTab("thoughts");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-left"
                style={{
                  animationDelay: `${i * 0.05}s`,
                }}
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
            {/* Search heading */}
            <div className="flex items-center ml-2 justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {debouncedQuery.length >= 2
                  && "Search Results"}
              </h2>

              {searchResults.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {searchResults.length} users
                </span>
              )}
            </div>

            {/* Empty search - suggested users */}
            {/* {!query.trim() && (
              <div className="space-y-1">
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
                      <div className="text-sm font-semibold">
                        @{user.username}
                      </div>

                      <div className="text-xs text-muted-foreground truncate">
                        {user.bio}
                      </div>

                      <div className="text-xs text-muted-foreground mt-0.5">
                        {user.followers} followers
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )} */}

            {/* Query too short */}
            {query.trim().length === 1 && (
              <div className="text-center py-12">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />

                <p className="text-sm text-muted-foreground">
                  Enter at least 2 characters to search.
                </p>
              </div>
            )}

            {/* Waiting for debounce */}
            {query.trim().length >= 2 && query.trim() !== debouncedQuery && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Loading */}
            {debouncedQuery.length >= 2 &&
              query.trim() === debouncedQuery &&
              isSearching && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

            {/* Error */}
            {debouncedQuery.length >= 2 &&
              query.trim() === debouncedQuery &&
              isError && (
                <div className="text-center py-12">
                  <p className="text-sm text-destructive">
                    Unable to search users. Please try again.
                  </p>
                </div>
              )}

            {/* Real search results */}
            {debouncedQuery.length >= 2 &&
              query.trim() === debouncedQuery &&
              !isSearching &&
              !isError &&
              searchResults.length > 0 && (
                <div className="space-y-1 animate-fade-in">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/70 transition-colors"
                    >
                      <Link
                        to={`/profile/${encodeURIComponent(user.username)}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-11 w-11 rounded-full object-cover flex-shrink-0 bg-muted"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {user.name || user.username}
                          </div>

                          <div className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </div>
                        </div>
                      </Link>

                      <FollowButton
                        initialState={
                          user.isFollowing ? "following" : "not_following"
                        }
                        onFollow={() => handleFollow(user._id)}
                        onUnfollow={() => handleUnfollow(user._id)}
                        className="h-8 px-4 text-xs flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* No results */}
            {debouncedQuery.length >= 2 &&
              query.trim() === debouncedQuery &&
              !isSearching &&
              !isError &&
              searchResults.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-9 w-9 text-muted-foreground/50 mx-auto mb-3" />

                  <p className="font-medium text-sm">No users found</p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching with another name or username.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Thoughts */}
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
                  Search for thoughts by keyword or username.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
