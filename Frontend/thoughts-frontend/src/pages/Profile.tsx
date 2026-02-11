import { useState, useEffect } from "react";
import { ThoughtCard } from "@/components/ThoughtCard";
import { Grid3X3, List, Settings } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  getUserThoughts,
  getMyThoughts,
  deleteThought as apiDelete,
} from "@/lib/api";

const Profile = () => {
  const [view, setView] = useState<"list" | "grid">("list");
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { id: userId } = useParams();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = userId
          ? await getUserThoughts(userId)
          : await getMyThoughts();
        if (mounted) setThoughts(res.data.thoughts || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4">
        {/* Profile header */}
        <div className="py-8 text-center">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face"
            alt="Profile"
            className="h-20 w-20 rounded-full object-cover mx-auto mb-4 border-2 border-border"
          />
          <h1 className="text-xl font-semibold">alex_design</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Designer & thinker. Exploring the intersection of simplicity and
            beauty.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-5">
            {[
              { label: "Thoughts", value: "47" },
              { label: "Followers", value: "1.2k" },
              { label: "Following", value: "318" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-5">
            <button className="h-9 px-6 rounded-full border border-border bg-card text-sm font-medium transition-colors hover:bg-secondary">
              Edit Profile
            </button>
            <button className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center transition-colors hover:bg-secondary">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex border-b border-border/60 mb-2">
          <button
            onClick={() => setView("list")}
            className={`flex-1 flex justify-center py-3 text-sm font-medium transition-colors border-b-2 ${
              view === "list"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex-1 flex justify-center py-3 text-sm font-medium transition-colors border-b-2 ${
              view === "grid"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
        </div>

        {/* Thoughts */}
        {view === "list" ? (
          thoughts.map((t) => (
            <ThoughtCard
              key={t._id || t.id}
              id={t._id || t.id}
              username={t.author?.username || t.author?.name || "User"}
              avatar={
                t.author?.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face"
              }
              time={new Date(t.createdAt).toLocaleString()}
              content={t.text}
              image={t.media && t.media.length ? t.media[0].url : undefined}
              likes={t.likes || 0}
              comments={t.comments || 0}
              onDelete={async (id) => {
                if (!confirm("Delete this thought?")) return;
                try {
                  await apiDelete(id);
                  setThoughts((s) => s.filter((x) => (x._id || x.id) !== id));
                } catch (err) {
                  alert("Failed to delete");
                }
              }}
            />
          ))
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-2">
            {thoughts
              .filter((t) => t.image)
              .map((t) => (
                <div
                  key={t.id}
                  className="aspect-square overflow-hidden bg-muted"
                >
                  <img
                    src={t.image}
                    alt=""
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
