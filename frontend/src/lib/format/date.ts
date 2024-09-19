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
 * Calculate how long ago or how long until a given date and return a human-readable string in Dutch.
 * The date can be provided as a Date object or an ISO 8601 string.
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
    throw new Error("Ongeldige datum input");
  }

  const now = new Date();
  // Calculate the difference in seconds between the current date and the input date
  let seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const { shortFormat = false } = options;

  const intervals = [
    { label: "jaar", plural: "jaren", shortFormat: "j", seconds: 31536000 },
    { label: "maand", plural: "maanden", shortFormat: "mnd", seconds: 2592000 },
    { label: "week", plural: "weken", shortFormat: "w", seconds: 604800 },
    { label: "dag", plural: "dagen", shortFormat: "d", seconds: 86400 },
    { label: "uur", plural: "uren", shortFormat: "u", seconds: 3600 },
    { label: "minuut", plural: "minuten", shortFormat: "m", seconds: 60 },
    { label: "seconde", plural: "seconden", shortFormat: "s", seconds: 1 },
  ];

  let result = "";
  let isFuture = false;

  // If the time difference is positive, the date is in the past
  // If the time difference is negative, the date is in the future
  if (seconds < 0) {
    isFuture = true;
    seconds = Math.abs(seconds); // Work with positive time difference for calculation
  }

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

      if (isFuture) {
        result = `over ${intervalCount}${shortFormat ? "" : " "}${label}`;
      } else {
        result = `${intervalCount}${shortFormat ? "" : " "}${label} geleden`;
      }
      break;
    }
  }

  // Return the result or default to "just now" or "0m" for short format
  return (
    result.trim() || (shortFormat ? "0m" : isFuture ? "zo meteen" : "zojuist")
  );
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
