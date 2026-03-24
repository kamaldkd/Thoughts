import { useState, useEffect, useRef } from "react";
import { ThoughtCard } from "@/components/ThoughtCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { CreateThoughtModal } from "@/components/CreateThoughtModal";
import { PenSquare } from "lucide-react";
import api, { deleteThought, getThoughts } from "@/lib/api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import defaultAvatar from "../assets/hero-bg.jpg";
import { useLocation } from "react-router-dom";
import ThoughtSkeleton from "@/components/ThoughtSkeleton";

type FeedLocationState = {
  openCreate?: boolean;
};

const Feed = () => {
  const location = useLocation();
  const state = location.state as FeedLocationState | null;
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateOpen(true);
      window.history.replaceState({}, "");
    }
  }, [location.state?.openCreate]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['thoughts', 'feed'],
    queryFn: async ({ pageParam = null as string | null }) => {
      const res = await getThoughts(pageParam ? { cursor: pageParam } : {});
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null,
    retry: false, // Don't retry on 401
  });

  const thoughts = data?.pages.flatMap((page) => page.thoughts) || [];

  const deleteMutation = useMutation({
    mutationFn: deleteThought,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['thoughts', 'feed'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            thoughts: page.thoughts.filter((t: any) => (t._id || t.id) !== deletedId)
          }))
        };
      });
    },
    onError: (err) => {
      console.error("Failed to delete thought:", err);
      alert("Failed to delete thought");
    }
  });

  const handleDelete = async (thoughtId: string) => {
    if (!window.confirm("Are you sure you want to delete this thought?")) {
      return;
    }
    deleteMutation.mutate(thoughtId);
  };

  // Infinite scroll: observe sentinel and load more when visible
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e && e.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending' || (status === 'loading' as any)) {
    return (
      <div className="min-h-screen pt-14 pb-20 md:pb-14 md:pt-14">
        <div className="max-w-xl mx-auto px-4">
          {[...Array(5)].map((_, i) => (
            <ThoughtSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' && (error as any)?.response?.status === 401) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">
          You need to be logged in to see the feed
        </h3>
        <p className="text-muted-foreground mt-2">
          Please{" "}
          <Link to="/login" className="text-primary">
            sign in
          </Link>{" "}
          or{" "}
          <Link to="/register" className="text-primary">
            create an account
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    // adding some extra bottom padding to ensure last thought isn't hidden behind mobile FAB
    // adding loading skeletons to give better feedback while loading thoughts or fetching more or while server is slow
    <div className="min-h-screen pt-14 pb-20 md:pb-14 md:pt-14">
      <div className="max-w-xl mx-auto px-4">
        {/* Header (visible on all sizes)
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-serif font-semibold">Your Feed</h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:opacity-90"
          >
            <PenSquare className="h-4 w-4" />
            New Thought
          </button>
        </div> */}

        {/* Feed */}
        {thoughts.length === 0 ? (
          <p className="text-muted-foreground">
            No thoughts yet — be the first to post!
          </p>
        ) : (
          thoughts.map((t) => (
            <ThoughtCard
              key={t._id || t.id}
              id={t._id || t.id}
              username={t.author?.username || t.author?.name || "User"}
              avatar={t.author?.avatar || defaultAvatar}
              time={t.createdAt}
              content={t.text}
              media={t.media}
              mediaUrl={t.media && t.media.length ? t.media[0].url : undefined}
              mediaType={
                t.media && t.media.length ? t.media[0].type : undefined
              }
              likes={t.likesCount || 0}
              comments={t.comments || 0}
              authorId={t.author?._id}
              currentUserId={user?._id}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* sentinel for infinite scroll */}
        <div ref={loadMoreRef} className="h-2" />
        {isFetchingNextPage && (
          <div className="min-h-screen pt-14 pb-20 md:pb-14 md:pt-14">
            <div className="max-w-xl mx-auto px-4">
              {[...Array(3)].map((_, i) => (
                <ThoughtSkeleton key={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {/* <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <PenSquare className="h-5 w-5" />
      </button> */}

      <CreateThoughtModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};

export default Feed;
