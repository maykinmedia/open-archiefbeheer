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
