import {
  formatDistanceToNow,
  differenceInDays,
  format,
  isValid,
} from "date-fns";

export function formatRelativeTime(dateString?: string | null) {
  if (!dateString) {
    return "just now";
  }

  const date = new Date(dateString);

  // 🔐 Guard against invalid dates
  if (!isValid(date)) {
    return "just now";
  }

  const daysDiff = differenceInDays(new Date(), date);

  if (daysDiff >= 7) {
    return format(date, "dd MMM yyyy"); // 15 Feb 2026
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
  });
}