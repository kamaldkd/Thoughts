import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ParticipantAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

export const ParticipantAvatar = ({
  src,
  name,
  className,
}: ParticipantAvatarProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const displayName = typeof name === "string" ? name : "";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <span
      className={cn(
        "relative inline-flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground ring-1 ring-border",
        className
      )}
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt={`${displayName || "User"}'s profile`}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials || "?"}</span>
      )}
    </span>
  );
};
