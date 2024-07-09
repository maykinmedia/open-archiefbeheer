/**
 * Formats date.
 * @param date
 */
export function formatDate(date: Date | string) {
  const _date = new Date(date);
  const year = _date.getFullYear();
  const month = String(_date.getMonth() + 1).padStart(2, "0");
  const day = String(_date.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}
