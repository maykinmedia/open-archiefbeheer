/**
 * Gets the value of a cookie.
 * @param name
 */
export function getCookie(name: string): string | null {
  const ca = document.cookie.split(";");
  for (let c of ca) {
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name + "=") === 0) {
      return c.substring(name.length + 1, c.length).trim();
    }
  }
  return null;
}
