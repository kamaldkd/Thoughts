import {
  formatDistanceToNow,
  differenceInDays,
  format,
  isValid,
  parseISO,
} from "date-fns";

function normalizeDate(input: any): Date | null {
  if (!input) return null;

  // If already a Date
  if (input instanceof Date) return input;

  // If Mongo-style { $date: "..." }
  if (typeof input === "object" && input.$date) {
    const d = new Date(input.$date);
    return isValid(d) ? d : null;
  }

  // If ISO string
  if (typeof input === "string") {
    const d = parseISO(input);
    return isValid(d) ? d : null;
  }

  return null;
}

export function formatRelativeTime(createdAt: any) {
  const date = normalizeDate(createdAt);

  if (!date) return "just now";

  const now = new Date();
  const daysDiff = differenceInDays(now, date);

  if (daysDiff >= 7) {
    return format(date, "dd MMM yyyy");
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
  });
}