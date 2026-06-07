/**
 * solved.ac-style tier system.
 *
 * Tier 0      = Unrated
 * Tier 1..5   = Bronze   V..I
 * Tier 6..10  = Silver   V..I
 * Tier 11..15 = Gold     V..I
 * Tier 16..20 = Platinum V..I
 * Tier 21..25 = Diamond  V..I
 * Tier 26..30 = Ruby     V..I
 */

export interface TierInfo {
  tier: number;
  group: string; // Bronze, Silver, ...
  groupKo: string; // 브론즈, 실버, ...
  level: number; // 1..5 within a group (1 = highest)
  roman: string; // V..I
  name: string; // "Gold III"
  nameKo: string; // "골드 III"
  color: string; // hex for badge text/icon
  bg: string; // subtle background tint
}

const GROUPS = [
  { en: "Unrated", ko: "언레이티드", color: "#2d2d2d", bg: "#ececec" },
  { en: "Bronze", ko: "브론즈", color: "#ad5600", bg: "#fbe9d6" },
  { en: "Silver", ko: "실버", color: "#435f7a", bg: "#e8eef4" },
  { en: "Gold", ko: "골드", color: "#ec9a00", bg: "#fff5d6" },
  { en: "Platinum", ko: "플래티넘", color: "#27e2a4", bg: "#dcfaf0" },
  { en: "Diamond", ko: "다이아몬드", color: "#00b4fc", bg: "#dcf2ff" },
  { en: "Ruby", ko: "루비", color: "#ff0062", bg: "#ffe0ec" },
];

const ROMAN = ["", "V", "IV", "III", "II", "I"];

export function getTierInfo(tier: number): TierInfo {
  const t = Math.max(0, Math.min(30, Math.trunc(tier)));

  if (t === 0) {
    const g = GROUPS[0];
    return {
      tier: 0,
      group: g.en,
      groupKo: g.ko,
      level: 0,
      roman: "",
      name: "Unrated",
      nameKo: "언레이티드",
      color: g.color,
      bg: g.bg,
    };
  }

  const groupIndex = Math.floor((t - 1) / 5) + 1; // 1..6
  const level = 5 - ((t - 1) % 5); // 1 (highest) .. 5 (lowest)
  const g = GROUPS[groupIndex];
  const roman = ROMAN[6 - level]; // level 5 -> V, level 1 -> I

  return {
    tier: t,
    group: g.en,
    groupKo: g.ko,
    level,
    roman,
    name: `${g.en} ${roman}`,
    nameKo: `${g.ko} ${roman}`,
    color: g.color,
    bg: g.bg,
  };
}

/** Short label used in compact tables, e.g. "G3". */
export function tierShort(tier: number): string {
  const info = getTierInfo(tier);
  if (info.tier === 0) return "?";
  return `${info.group[0]}${6 - info.level}`;
}

/** All selectable tiers (0..30) with Korean labels — for dropdowns. */
export function listTiers(): { value: number; label: string }[] {
  const out: { value: number; label: string }[] = [];
  for (let t = 0; t <= 30; t++) {
    const info = getTierInfo(t);
    out.push({ value: t, label: t === 0 ? "언레이티드" : info.nameKo });
  }
  return out;
}

