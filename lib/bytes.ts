/**
 * Computes the exact UTF-8 byte length of a string.
 *
 * This is the value used for golf ranking: shorter byte counts win.
 * It is NOT the character count. Multi-byte characters (e.g. emoji,
 * accented letters, CJK) contribute their real encoded size.
 */
export function byteLength(input: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(input).length;
  }
  // Node.js fallback (Buffer is available in the server runtime).
  return Buffer.byteLength(input, "utf8");
}
