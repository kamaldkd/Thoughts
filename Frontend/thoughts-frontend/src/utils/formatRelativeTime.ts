import {
  formatDistanceToNow,
  differenceInDays,
  format,
} from "date-fns";

export function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const daysDiff = differenceInDays(new Date(), date);

  // If post is older than or equal to 7 days → absolute date
  if (daysDiff >= 7) {
    return format(date, "dd MMM yyyy"); // 15 Feb 2026
  }

  // Otherwise → relative time
  return formatDistanceToNow(date, {
    addSuffix: true,
  });
}