import { getCookie } from "../cookie/cookie";

/**
 * hashes `string` with`algorithm` using native JS crypto.
 * TODO: Test
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string}
 * @param string
 * @param algorithm
 */
export async function hash(string: string, algorithm = "SHA-256") {
  const encoder = new TextEncoder();
  const data = encoder.encode(string as string);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * hashes session id with `algorithm` using native JS crypto.
 * TODO: Test?
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string}
 * @param algorithm
 */
export async function getSessionHash(algorithm = undefined) {
  // FIXME: Keep in sync with SESSION_COOKIE_NAME
  const sessionKey = getCookie("openarchiefbeheer_sessionid");
  return sessionKey ? await hash(sessionKey, algorithm) : null;
}
