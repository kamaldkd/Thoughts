import { useState, useEffect } from "react";
import { ThoughtCard } from "@/components/ThoughtCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { CreateThoughtModal } from "@/components/CreateThoughtModal";
import { PenSquare } from "lucide-react";
import api from "@/lib/api";
import { Link } from "react-router-dom";

const Feed = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/thoughts");
        if (mounted) {
          setThoughts(res.data.thoughts || []);
          setUnauth(false);
        }
      } catch (err: any) {
        if (err?.response?.status === 401) setUnauth(true);
        else console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p className="p-4">Loading feed…</p>;

  if (unauth)
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

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4">
        {/* Header (visible on all sizes) */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-serif font-semibold">Your Feed</h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:opacity-90"
          >
            <PenSquare className="h-4 w-4" />
            New Thought
          </button>
        </div>

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
              avatar={t.author?.avatar || "/src/assets/hero-bg.jpg"}
              time={new Date(t.createdAt).toLocaleString()}
              content={t.text}
              image={t.media && t.media.length ? t.media[0].url : undefined}
              likes={t.likes || 0}
              comments={t.comments || 0}
            />
          ))
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-20 right-4 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <PenSquare className="h-5 w-5" />
      </button>

      <CreateThoughtModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};

export default Feed;
