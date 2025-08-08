/**
 * Standardized timestamp formatting utility
 * Formats timestamps consistently across the application using 24-hour format
 */

/**
 * Formats a timestamp to a consistent 24-hour format: "Aug 7, 2025, 21:42"
 * @param timestamp - Date string, Date object, or unix timestamp (in seconds or milliseconds)
 * @returns Formatted timestamp string or "—" if invalid
 */
export function formatTimestamp(
  timestamp: string | Date | number | undefined
): string {
  if (!timestamp) return "—";

  try {
    let date: Date;

    if (typeof timestamp === "number") {
      // Handle unix timestamps - if less than a certain threshold, assume it's in seconds
      const isUnixSeconds = timestamp < 1e12; // Numbers less than 1 trillion are likely seconds
      date = new Date(isUnixSeconds ? timestamp * 1000 : timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Force 24-hour format
    });
  } catch {
    return "—";
  }
}

/**
 * Formats a timestamp to just the date portion: "Aug 7, 2025"
 * @param timestamp - Date string, Date object, or unix timestamp
 * @returns Formatted date string or "—" if invalid
 */
export function formatDate(
  timestamp: string | Date | number | undefined
): string {
  if (!timestamp) return "—";

  try {
    let date: Date;

    if (typeof timestamp === "number") {
      const isUnixSeconds = timestamp < 1e12;
      date = new Date(isUnixSeconds ? timestamp * 1000 : timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
