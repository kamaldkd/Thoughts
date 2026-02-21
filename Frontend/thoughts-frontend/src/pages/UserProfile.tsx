import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  CheckCircle2,
  Globe,
  Calendar,
  Heart,
  MessageCircle,
  Image,
  User,
  Repeat2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import api, { getUserThoughts, getUserProfile } from "@/lib/api";
import { FollowButton } from "@/components/profile/FollowButton";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { StatModal } from "@/components/profile/StatModal";
import { ThoughtCard } from "@/components/ThoughtCard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getUserProfileByUsername, getThoughtsByUsername } from "@/lib/api";
import { followUser, unfollowUser, checkIsFollowing } from "@/lib/api";

/* ── Mock data helpers (replace with real API later) ─────────────────────── */
const MOCK_MUTUAL_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
];

/* ── Avatar with graceful fallback ───────────────────────────────────────── */
function ProfileAvatar({
  src,
  username,
  size = 80,
}: {
  src?: string | null;
  username: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const dim = `${size}px`;

  if (src && !err) {
    return (
      <img
        src={src}
        alt={username}
        onError={() => setErr(true)}
        className="rounded-full object-cover ring-2 ring-border"
        style={{ width: dim, height: dim }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-muted ring-2 ring-border flex items-center justify-center"
      style={{ width: dim, height: dim }}
    >
      <User
        style={{ width: size * 0.45, height: size * 0.45 }}
        className="text-muted-foreground"
        strokeWidth={1.5}
      />
    </div>
  );
}

/* ── Post Grid Item ───────────────────────────────────────────────────────── */
function GridItem({ thought, onClick }: { thought: any; onClick: () => void }) {
  const thumb =
    thought.media && thought.media.length ? thought.media[0].url : null;

  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden bg-muted group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-[10px] text-muted-foreground text-center px-2 leading-tight line-clamp-4">
            {thought.text}
          </p>
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        <span className="flex items-center gap-1 text-white text-xs font-semibold">
          <Heart className="w-3.5 h-3.5 fill-white" />
          {thought.likes || 0}
        </span>
        <span className="flex items-center gap-1 text-white text-xs font-semibold">
          <MessageCircle className="w-3.5 h-3.5 fill-white" />
          {thought.comments || 0}
        </span>
      </div>
    </button>
  );
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
function EmptyState({ tab }: { tab: string }) {
  const icons: Record<string, React.ReactNode> = {
    posts: (
      <Image className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.2} />
    ),
    reposts: (
      <Repeat2
        className="w-10 h-10 text-muted-foreground/50"
        strokeWidth={1.2}
      />
    ),
    media: (
      <Image className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.2} />
    ),
  };
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        {icons[tab]}
      </div>
      <p className="text-sm font-medium text-muted-foreground">No {tab} yet</p>
    </div>
  );
}

/* ── Tab Bar ─────────────────────────────────────────────────────────────── */
const TABS = ["posts", "reposts", "media"] as const;
type Tab = (typeof TABS)[number];

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="flex border-b border-border/60 relative">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "flex-1 py-3 text-xs font-semibold capitalize tracking-wide transition-colors duration-150",
            active === t
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
          )}
        >
          {t === "posts" ? (
            <Image
              className="w-4 h-4 mx-auto"
              strokeWidth={active === t ? 2.2 : 1.8}
            />
          ) : t === "reposts" ? (
            <Repeat2
              className="w-4 h-4 mx-auto"
              strokeWidth={active === t ? 2.2 : 1.8}
            />
          ) : (
            <MessageCircle
              className="w-4 h-4 mx-auto"
              strokeWidth={active === t ? 2.2 : 1.8}
            />
          )}
        </button>
      ))}
      {/* Animated underline */}
      <div
        className="absolute bottom-0 h-[2px] bg-foreground rounded-full transition-all duration-250 ease-out"
        style={{
          width: `${100 / TABS.length}%`,
          left: `${(TABS.indexOf(active) / TABS.length) * 100}%`,
        }}
      />
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posts");
  const [modalOpen, setModalOpen] = useState<"followers" | "following" | null>(
    null
  );
  const [postModal, setPostModal] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [followState, setFollowState] = useState<
    "not_following" | "following" | "requested"
  >("not_following");

  // Sticky header detection
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load profile
  useEffect(() => {
    if (!username) return;

    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [profileRes, thoughtsRes] = await Promise.all([
          getUserProfileByUsername(username),
          getThoughtsByUsername(username),
        ]);

        if (!mounted) return;

        setProfile(profileRes.data);
        setThoughts(thoughtsRes.data.thoughts || []);
      } catch (error) {
        console.error("Error loading profile:", error);
        setProfile(null);
        setThoughts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [username]);

  useEffect(() => {
    if (!profile?._id || isOwnProfile) return;

    const checkFollowStatus = async () => {
      try {
        const res = await checkIsFollowing(profile._id);
        if (res.data.isFollowing) {
          setFollowState("following");
        } else {
          setFollowState("not_following");
        }
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };

    checkFollowStatus();
  }, [profile?._id]);

  const handleFollow = async () => {
    if (!profile?._id) return;

    await followUser(profile._id);

    setFollowState(profile.isPrivate ? "requested" : "following");

    setProfile((prev: any) => ({
      ...prev,
      followersCount: (prev.followersCount || 0) + 1,
    }));
  };

  const handleUnfollow = async () => {
    if (!profile?._id) return;

    await unfollowUser(profile._id);

    setFollowState("not_following");

    setProfile((prev: any) => ({
      ...prev,
      followersCount: Math.max((prev.followersCount || 1) - 1, 0),
    }));
  };

  const isOwnProfile = me?.username === username;

  const mediaThoughts = thoughts.filter((t) => t.media && t.media.length > 0);

  const tabContent = () => {
    const list =
      tab === "media"
        ? mediaThoughts
        : tab === "reposts"
        ? [] // placeholder
        : thoughts;

    if (tab === "media") {
      if (list.length === 0) return <EmptyState tab="media" />;
      return (
        <div className="grid grid-cols-3 gap-px">
          {list.map((t) => (
            <GridItem
              key={t._id || t.id}
              thought={t}
              onClick={() => setPostModal(t)}
            />
          ))}
        </div>
      );
    }

    if (tab === "reposts") return <EmptyState tab="reposts" />;

    // Posts tab — use grid
    if (list.length === 0) return <EmptyState tab="posts" />;
    return (
      <div className="grid grid-cols-3 gap-px">
        {list.map((t) => (
          <GridItem
            key={t._id || t.id}
            thought={t}
            onClick={() => setPostModal(t)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      {/* ── Sticky Top Nav ──────────────────────────────────────────────── */}
      <div
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 transition-all duration-200",
          isScrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border/40 shadow-sm"
            : "bg-transparent"
        )}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-90"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span
          className={cn(
            "font-semibold text-base transition-all duration-200",
            isScrolled
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1"
          )}
        >
          {profile?.username || username}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-90">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="cursor-pointer text-sm">
              Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-sm text-destructive focus:text-destructive">
              Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="pt-14 max-w-xl mx-auto">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* ── Profile Header ─────────────────────────────────────── */}
            <div className="px-4 pt-5 pb-4">
              {/* Avatar + Stats row */}
              <div className="flex items-center gap-5">
                <ProfileAvatar
                  src={profile?.avatar}
                  username={profile?.username || username || ""}
                  size={84}
                />

                {/* Stats */}
                <div className="flex flex-1 justify-around">
                  {[
                    {
                      label: "Posts",
                      value: thoughts.length,
                    },
                    {
                      label: "Followers",
                      value: profile?.followersCount ?? 0,
                      onClick: () => setModalOpen("followers"),
                    },
                    {
                      label: "Following",
                      value: profile?.followingCount ?? 0,
                      onClick: () => setModalOpen("following"),
                    },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={s.onClick}
                      disabled={!s.onClick}
                      className={cn(
                        "flex flex-col items-center gap-0.5 px-2 rounded-lg transition-colors duration-150",
                        s.onClick
                          ? "hover:bg-muted active:scale-95 cursor-pointer"
                          : "cursor-default"
                      )}
                    >
                      <span className="text-lg font-bold tabular-nums leading-tight">
                        {s.value >= 1000
                          ? `${(s.value / 1000).toFixed(1)}k`
                          : s.value}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + bio */}
              <div className="mt-3.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm leading-tight">
                    {profile?.fullName || profile?.username || username}
                  </h1>
                  {profile?.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                {profile?.username && profile?.fullName && (
                  <p className="text-[13px] text-muted-foreground">
                    @{profile.username}
                  </p>
                )}
                {profile?.bio && (
                  <p className="text-[13.5px] leading-snug text-foreground whitespace-pre-line">
                    {profile.bio}
                  </p>
                )}
                {profile?.website && (
                  <a
                    href={
                      profile.website.startsWith("http")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12.5px] text-primary hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    {profile.website}
                  </a>
                )}
                {profile?.createdAt && (
                  <p className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
                  </p>
                )}
              </div>

              {/* Mutual followers */}
              {MOCK_MUTUAL_AVATARS.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-1.5">
                    {MOCK_MUTUAL_AVATARS.map((a, i) => (
                      <img
                        key={i}
                        src={a}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-background"
                      />
                    ))}
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-tight">
                    Followed by{" "}
                    <span className="font-medium text-foreground">rahul</span>{" "}
                    and{" "}
                    <span className="font-medium text-foreground">
                      3 others
                    </span>
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {!isOwnProfile && (
                <div className="flex gap-2.5 mt-4">
                  <FollowButton
                    initialState={followState}
                    isPrivate={profile?.isPrivate}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    className="flex-1"
                  />
                  <button className="flex-1 h-9 rounded-full border border-border bg-transparent text-sm font-semibold hover:bg-muted transition-colors active:scale-95">
                    Message
                  </button>
                </div>
              )}
            </div>

            {/* ── Sticky Tab Bar ─────────────────────────────────────── */}
            <div className="sticky top-14 z-40 bg-background/90 backdrop-blur-md">
              <TabBar active={tab} onChange={setTab} />
            </div>

            {/* ── Tab Content ────────────────────────────────────────── */}
            <div className="min-h-[50vh]">{tabContent()}</div>
          </>
        )}
      </div>

      {/* ── Followers / Following Modal ─────────────────────────────────── */}
      <StatModal
        open={modalOpen === "followers"}
        onOpenChange={(v) => !v && setModalOpen(null)}
        title="Followers"
        users={[]}
      />
      <StatModal
        open={modalOpen === "following"}
        onOpenChange={(v) => !v && setModalOpen(null)}
        title="Following"
        users={[]}
      />

      {/* ── Full Post Modal ─────────────────────────────────────────────── */}
      {postModal && (
        <Dialog open={!!postModal} onOpenChange={() => setPostModal(null)}>
          <DialogContent className="p-0 max-w-lg w-full overflow-hidden rounded-2xl">
            <ThoughtCard
              id={postModal._id || postModal.id}
              username={postModal.author?.username || ""}
              avatar={postModal.author?.avatar || ""}
              time={postModal.createdAt}
              content={postModal.text}
              media={postModal.media}
              likes={postModal.likes || 0}
              comments={postModal.comments || 0}
              authorId={postModal.author?._id}
              currentUserId={me?._id}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
