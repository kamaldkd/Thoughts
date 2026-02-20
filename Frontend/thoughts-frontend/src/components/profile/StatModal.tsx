import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "lucide-react";
import { FollowButton } from "./FollowButton";

interface StatUser {
  id: string;
  username: string;
  avatar?: string;
  fullName?: string;
  isFollowing?: boolean;
}

interface StatModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  users: StatUser[];
}

function UserRow({ user }: { user: StatUser }) {
  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <User className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{user.username}</p>
        {user.fullName && (
          <p className="text-xs text-muted-foreground truncate">
            {user.fullName}
          </p>
        )}
      </div>
      <FollowButton
        initialState={user.isFollowing ? "following" : "not_following"}
        className="text-xs h-8 px-4"
      />
    </div>
  );
}

export function StatModal({
  open,
  onOpenChange,
  title,
  users,
}: StatModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-4 py-3 border-b border-border/60">
          <DialogTitle className="text-center text-sm font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 divide-y divide-border/40">
          {users.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No {title.toLowerCase()} yet
            </p>
          ) : (
            users.map((u) => <UserRow key={u.id} user={u} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
