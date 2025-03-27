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
 * Formats date and time.
 * @param date
 * @param format
 * @returns Formatted date and time.
 */
export function formatDateAndTime(
  date: Date | string,
  format: "nl" | "iso" = "nl",
) {
  const _date = new Date(date);
  if (format === "iso") {
    return formatISO(date, { representation: "date" });
  }
  return _format(_date, "dd/MM/yyyy HH:mm");
}

/**
 * Options for customizing the output of the timeAgo function.
 */
interface TimeAgoOptions {
  shortFormat?: boolean; // Use short format like "10d" instead of "10 days ago"
  includeSeconds?: boolean; // Include seconds in the output if less than a minute
  maxIntervals?: number; // How many intervals at most to display
}

/**
 * Calculate how long ago or how long until a given date and return a human-readable string in Dutch.
 * The date can be provided as a Date object or an ISO 8601 string.
 * Note that this function does currently not show dates like "1 jaar 1 maand 1 dag geleden", but would rather show "1 jaar geleden"
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
  const { shortFormat = false, maxIntervals = 1 } = options;

  // Define the intervals in seconds for various time units
  const intervals = [
    { label: "jaar", plural: "jaren", shortFormat: "j", seconds: 31536000 },
    { label: "maand", plural: "maanden", shortFormat: "ma", seconds: 2592000 },
    { label: "week", plural: "weken", shortFormat: "w", seconds: 604800 },
    { label: "dag", plural: "dagen", shortFormat: "d", seconds: 86400 },
    { label: "uur", plural: "uur", shortFormat: "u", seconds: 3600 },
    { label: "minuut", plural: "minuten", shortFormat: "m", seconds: 60 },
    { label: "seconde", plural: "seconden", shortFormat: "s", seconds: 1 },
  ];

  let result = "";
  let isFuture = false;

  if (seconds < 0) {
    isFuture = true;
    seconds = Math.abs(seconds);
  }

  // Special case for "Nu" or "zo meteen"
  if (seconds < 60) {
    return shortFormat ? "0m" : isFuture ? "zo meteen" : "Nu";
  }

  // Iterate over the intervals to determine the appropriate time unit
  const textBits = [];
  for (const interval of intervals) {
    if (textBits.length >= maxIntervals) break;

    const intervalCount = Math.floor(seconds / interval.seconds);
    if (intervalCount < 1) continue;

    // Format the label based on short or long format
    const label = shortFormat
      ? interval.shortFormat
      : intervalCount === 1
        ? interval.label
        : interval.plural;

    textBits.push(`${intervalCount}${shortFormat ? "" : " "}${label}`);
    seconds = seconds - intervalCount * interval.seconds;
  }

  const text = `${textBits.join(shortFormat ? "" : " ")}`;
  if (isFuture) {
    result = `over ${text}`;
  } else {
    // Special case to not include "geleden" for the short format
    result = shortFormat ? text : `${text} geleden`;
  }

  return result.trim();
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
