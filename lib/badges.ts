/**
 * Badge / achievement definitions.
 *
 * Badges are computed on the fly from a user's submission stats — no
 * separate table. Pass in the aggregated data and get the earned set.
 */

export interface BadgeInput {
  solvedCount: number;
  acSubmissions: number;
  minBytes: number | null; // smallest accepted byte count, null if none
  maxTier: number; // highest tier among solved problems
  activeDays: number; // number of distinct days with a submission
  groupCounts: Record<string, number>; // solved count per step group
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  earned: boolean;
}

export function computeBadges(input: BadgeInput): Badge[] {
  const { solvedCount, minBytes, maxTier, activeDays, groupCounts } = input;

  const numberTheory = groupCounts["정수론 입문"] ?? 0;

  return [
    {
      id: "first_ac",
      name: "첫 정답",
      desc: "처음으로 문제를 맞혔습니다.",
      earned: solvedCount >= 1,
    },
    {
      id: "solver_10",
      name: "문제 해결사",
      desc: "10문제를 해결했습니다.",
      earned: solvedCount >= 10,
    },
    {
      id: "solver_50",
      name: "베테랑",
      desc: "50문제를 해결했습니다.",
      earned: solvedCount >= 50,
    },
    {
      id: "solver_100",
      name: "마스터",
      desc: "100문제를 해결했습니다.",
      earned: solvedCount >= 100,
    },
    {
      id: "minimalist",
      name: "미니멀리스트",
      desc: "1바이트 정답을 작성했습니다.",
      earned: minBytes !== null && minBytes <= 1,
    },
    {
      id: "tiny",
      name: "초소형",
      desc: "5바이트 이하 정답을 작성했습니다.",
      earned: minBytes !== null && minBytes <= 5,
    },
    {
      id: "gold",
      name: "골드 입성",
      desc: "골드 이상 문제를 해결했습니다.",
      earned: maxTier >= 11,
    },
    {
      id: "platinum",
      name: "플래티넘 입성",
      desc: "플래티넘 이상 문제를 해결했습니다.",
      earned: maxTier >= 16,
    },
    {
      id: "number_theory",
      name: "정수론자",
      desc: "정수론 단계 문제를 3개 이상 해결했습니다.",
      earned: numberTheory >= 3,
    },
    {
      id: "streak_3",
      name: "꾸준함",
      desc: "서로 다른 3일에 제출했습니다.",
      earned: activeDays >= 3,
    },
    {
      id: "streak_7",
      name: "성실함",
      desc: "서로 다른 7일에 제출했습니다.",
      earned: activeDays >= 7,
    },
  ];
}

