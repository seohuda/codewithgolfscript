/**
 * Date helpers.
 *
 * The site's audience is Korean, so daily activity (the contribution
 * graph and submission streaks) is bucketed by KST (Asia/Seoul), not
 * UTC. Using UTC caused submissions made between local midnight and
 * 09:00 KST to be attributed to the previous day, which broke the
 * activity graph alignment and streak counts.
 */

const KST_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Format a date as "YYYY-MM-DD" in KST. Accepts a Date or ISO string. */
export function kstDayKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // en-CA locale yields the ISO-like "YYYY-MM-DD" ordering.
  return KST_FORMATTER.format(d);
}
