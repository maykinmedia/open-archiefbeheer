/**
 * Deslugifies a slugified string.
 *
 * This function takes a slugified string (a string where words are separated by hyphens or underscores) and converts it back
 * to a human-readable format where words are capitalized and spaces replace hyphens/underscores.
 *
 * @param {string} slug - The slugified string to be deslugified.
 * @returns {string} The deslugified, human-readable string.
 *
 * @example
 * // returns "Hello World Example"
 * deslugify("hello-world-example");
 *
 * @example
 * // returns "Another Example Here"
 * deslugify("another_example_here");
 */
export const deslugify = (slug: string): string =>
  slug
    // Replace hyphens and underscores with spaces
    .replace(/[-_]/g, " ")
    // Capitalize the first letter of each word
    .replace(/\b\w/g, (match) => match.toUpperCase());
/**
 * Options for customizing the output of the timeAgo function.
 */
interface TimeAgoOptions {
  shortFormat?: boolean; // Use short format like "10d" instead of "10 days ago"
  includeSeconds?: boolean; // Include seconds in the output if less than a minute
}

/**
 * Calculate how long ago a given date was and return a human-readable string.
 *
 * @param dateInput - The date to calculate the time difference from. It can be a Date object or an ISO 8601 string.
 * @param options - Customization options for the output.
 * @returns A human-readable string indicating how long ago the date was.
 */
export function timeAgo(
  dateInput: Date | string,
  options: TimeAgoOptions = {},
): string {
  // TODO: Internationalize?z
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) {
    throw new Error("The date provided is in the future");
  }

  const { shortFormat = false, includeSeconds = true } = options;

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  if (includeSeconds) {
    intervals.push({ label: "second", seconds: 1 });
  }

  for (const interval of intervals) {
    const intervalCount = Math.floor(seconds / interval.seconds);
    if (intervalCount >= 1) {
      const label = shortFormat
        ? interval.label.charAt(0)
        : interval.label + (intervalCount !== 1 ? "s" : "");
      return `${intervalCount} ${label}${shortFormat ? "" : " ago"}`;
    }
  }

  return shortFormat ? "0s" : "just now";
}
