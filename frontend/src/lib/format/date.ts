import { format as _format, add, formatISO } from "date-fns";
import { parse } from "tinyduration";

/**
 * Formats date.
 * @param date
 * @param format
 */
export function formatDate(date: Date | string, format: "nl" | "iso" = "nl") {
  const _date = new Date(date);
  if (format === "iso") {
    return formatISO(date, { representation: "date" });
  }
  return _format(_date, "dd/MM/yyyy");
}

/**
 * Options for customizing the output of the timeAgo function.
 */
interface TimeAgoOptions {
  shortFormat?: boolean; // Use short format like "10d" instead of "10 days ago"
  includeSeconds?: boolean; // Include seconds in the output if less than a minute
}

/**
 * Calculate how long ago a given date was and return a human-readable string.
 * TODO: Consider using a specialized library.
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
  const { shortFormat = false } = options;

  // Define the intervals in seconds for various time units
  const intervals = [
    { label: "jaar", plural: "jaren", shortFormat: "j", seconds: 31536000 },
    { label: "maand", plural: "maanden", shortFormat: "ma", seconds: 2592000 },
    { label: "week", plural: "weken", shortFormat: "w", seconds: 604800 },
    { label: "dag", plural: "dagen", shortFormat: "d", seconds: 86400 },
    { label: "uur", plural: "uur", shortFormat: "u", seconds: 3600 },
    { label: "minuut", plural: "minuten", shortFormat: "m", seconds: 60 },
  ];

  let result = "";

  // Iterate over the intervals to determine the appropriate time unit
  for (const interval of intervals) {
    const intervalCount = Math.floor(seconds / interval.seconds);
    if (intervalCount >= 1) {
      // Format the label based on short or long format
      const label = shortFormat
        ? interval.shortFormat
        : intervalCount === 1
          ? interval.label
          : interval.plural;

      result += `${intervalCount}${shortFormat ? "" : " "}${label}${shortFormat ? "" : " geleden"}`;
      // Update seconds to the remainder for the next interval
      seconds %= interval.seconds;
      break;
    }
  }

  // Return the result or default to "just now" or "0m" for short format
  return result.trim() || (shortFormat ? "0m" : "Nu");
}

/**
 * Adds (ISO 8601) `duration` string to `date`.
 * @param dateInput
 * @param durationString
 */
export function addDuration(dateInput: Date | string, durationString: string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const duration = parse(durationString);
  return add(date, duration);
}
