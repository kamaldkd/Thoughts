import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type FollowState = "not_following" | "following" | "requested";

interface FollowButtonProps {
  initialState?: FollowState;
  isPrivate?: boolean;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
  className?: string;
}

export function FollowButton({
  initialState = "not_following",
  isPrivate = false,
  onFollow,
  onUnfollow,
  className,
}: FollowButtonProps) {
  const [state, setState] = useState<FollowState>(initialState);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = async () => {
    if (state === "following" || state === "requested") {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await onFollow?.();
      setState(isPrivate ? "requested" : "following");
    } catch {
      // revert optimistic
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await onUnfollow?.();
      setState("not_following");
    } catch {
      // revert
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const getLabel = () => {
    if (state === "following") return isHovering ? "Unfollow" : "Following";
    if (state === "requested") return isHovering ? "Cancel" : "Requested";
    return "Follow";
  };

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={loading}
        className={cn(
          "relative h-9 px-6 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60",
          state === "not_following"
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            : "bg-transparent border border-border text-foreground hover:border-destructive hover:text-destructive",
          className
        )}
      >
        <span
          className="transition-all duration-150"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {getLabel()}
        </span>
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {state === "requested" ? "Cancel request?" : "Unfollow?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {state === "requested"
                ? "Your follow request will be withdrawn."
                : "You'll stop seeing their posts in your feed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnfollow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {state === "requested" ? "Cancel Request" : "Unfollow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
