import { getTierInfo, TierInfo } from "./tiers";

/**
 * Scoring and user-tier system.
 *
 * Each solved problem awards points based on its difficulty tier.
 * A user's total score is the sum of points from distinct solved
 * problems. The user's tier is derived from that total score.
 */

/** Points awarded for solving a problem of the given tier. */
export function problemPoints(tier: number): number {
  const t = Math.max(0, Math.min(30, Math.trunc(tier)));
  if (t === 0) return 1;
  // Bronze 1.. up through Ruby, growing super-linearly.
  // tier 1 -> ~2, tier 10 -> ~50, tier 20 -> ~300, tier 30 -> ~1000
  return Math.round(2 * Math.pow(1.25, t));
}

/**
 * Maps a user's total score to a tier (0..30), mirroring the same
 * Bronze..Ruby ladder used for problems. Thresholds grow with score.
 */
export function userTierFromScore(score: number): number {
  if (score <= 0) return 0;
  // Cumulative thresholds: tier increases as score crosses milestones.
  // Roughly: solving more & harder problems pushes the tier up.
  const thresholds = [
    0, // tier 0 (unrated)
    3, // 1 Bronze V
    8,
    16,
    28,
    45, // 5 Bronze I
    70, // 6 Silver V
    105,
    155,
    225,
    320, // 10 Silver I
    450, // 11 Gold V
    630,
    870,
    1190,
    1600, // 15 Gold I
    2150, // 16 Plat V
    2850,
    3750,
    4900,
    6400, // 20 Plat I
    8300, // 21 Dia V
    10800,
    14000,
    18000,
    23000, // 25 Dia I
    30000, // 26 Ruby V
    39000,
    50000,
    64000,
    82000, // 30 Ruby I
  ];
  let tier = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i]) tier = i;
  }
  return tier;
}

export interface UserRating {
  score: number;
  tier: number;
  tierInfo: TierInfo;
}

export function rateUser(solvedTiers: number[]): UserRating {
  const score = solvedTiers.reduce((acc, t) => acc + problemPoints(t), 0);
  const tier = userTierFromScore(score);
  return { score, tier, tierInfo: getTierInfo(tier) };
}
