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
  // Convert the input to a Date object if it's a string
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // Check for invalid date input
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }

  const now = new Date();
  // Calculate the difference in seconds between the current date and the input date
  let seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates
  if (seconds < 0) {
    throw new Error("The date provided is in the future");
  }

  const { shortFormat = false } = options;

  // Define the intervals in seconds for various time units
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  let result = "";

  // Iterate over the intervals to determine the appropriate time unit
  for (const interval of intervals) {
    const intervalCount = Math.floor(seconds / interval.seconds);
    if (intervalCount >= 1) {
      // Format the label based on short or long format
      const label = shortFormat
        ? interval.label.charAt(0) + (interval.label === "month" ? "o" : "")
        : interval.label + (intervalCount !== 1 ? "s" : "");
      result += `${intervalCount} ${label}${shortFormat ? "" : " ago"}`;
      // Update seconds to the remainder for the next interval
      seconds %= interval.seconds;
      // If in short format, add a space for the next unit
      if (shortFormat) {
        result += " ";
      } else {
        // Break the loop for long format after the first significant unit
        break;
      }
    }
  }

  // Return the result or default to "just now" or "0m" for short format
  return result.trim() || (shortFormat ? "0m" : "just now");
}
