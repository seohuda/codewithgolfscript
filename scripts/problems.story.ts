/**
 * Storytelling problem pack for CODE WITH GOLF.
 *
 * These are *additive* problems (they do NOT replace the existing 142).
 * Every reference solution is verified by scripts/build-story-sql.ts
 * against the in-process interpreter before any SQL is emitted.
 *
 * All problems are original ("자체 제작"); descriptions use light
 * storytelling framing while keeping the underlying task unambiguous.
 */

export interface StoryCase {
  stdin: string;
  stdout: string;
  hidden?: boolean;
}

export interface StoryProblem {
  title: string;
  tier: number;
  tags: string[];
  description: string;
  inputDesc: string;
  outputDesc: string;
  sampleInput: string;
  solution: string;
  cases: StoryCase[];
}

const STORY: StoryProblem[] = [
  {
    title: "달콤상점의 거스름돈",
    tier: 3,
    tags: ["사칙연산", "구현"],
    description:
      "달콤상점에 들른 소민이는 사탕을 한 봉지 샀습니다. 지갑에서 낸 돈과 사탕의 가격이 주어질 때, 점원이 돌려줘야 할 거스름돈을 계산해 주세요. 소민이는 항상 가격보다 크거나 같은 금액을 냅니다.",
    inputDesc: "공백으로 구분된 두 정수 '낸 돈'과 '가격'. (낸 돈 ≥ 가격)",
    outputDesc: "거스름돈, 즉 낸 돈에서 가격을 뺀 값.",
    sampleInput: "5000 3200",
    solution: "~-",
    cases: [
      { stdin: "5000 3200", stdout: "1800" },
      { stdin: "10000 10000", stdout: "0" },
      { stdin: "7000 2500", stdout: "4500", hidden: true },
      { stdin: "1000000 1", stdout: "999999", hidden: true },
    ],
  },
  {
    title: "피자 파티에 필요한 판 수",
    tier: 9,
    tags: ["수학", "구현"],
    description:
      "동아리 회식에서 피자를 시키려 합니다. 사람 수와 피자 한 판의 조각 수가 주어집니다. 모든 사람이 적어도 한 조각씩 먹으려면 최소 몇 판을 시켜야 할까요? (한 사람당 한 조각으로 충분하다고 가정합니다.)",
    inputDesc: "공백으로 구분된 두 정수 '사람 수 n'과 '한 판의 조각 수 k'. (k ≥ 1)",
    outputDesc: "필요한 최소 피자 판 수, 즉 n을 k로 나눈 값의 올림.",
    sampleInput: "10 4",
    solution: "~:k;:n;n k+1- k/",
    cases: [
      { stdin: "10 4", stdout: "3" },
      { stdin: "8 4", stdout: "2" },
      { stdin: "1 8", stdout: "1" },
      { stdin: "100 7", stdout: "15", hidden: true },
      { stdin: "21 3", stdout: "7", hidden: true },
    ],
  },
  {
    title: "텃밭 울타리 두르기",
    tier: 5,
    tags: ["기하", "수학"],
    description:
      "할머니가 직사각형 모양의 텃밭 둘레에 울타리를 치려고 합니다. 텃밭의 가로와 세로 길이가 주어질 때, 울타리의 전체 길이(직사각형의 둘레)를 구해 주세요.",
    inputDesc: "공백으로 구분된 두 정수 '가로'와 '세로'.",
    outputDesc: "직사각형의 둘레, 즉 (가로 + 세로) × 2.",
    sampleInput: "3 4",
    solution: "~+2*",
    cases: [
      { stdin: "3 4", stdout: "14" },
      { stdin: "1 1", stdout: "4" },
      { stdin: "10 20", stdout: "60", hidden: true },
      { stdin: "100 1", stdout: "202", hidden: true },
    ],
  },
  {
    title: "보물섬까지의 거리",
    tier: 10,
    tags: ["기하", "수학"],
    description:
      "해적 선장이 현재 위치 (x1, y1)에서 보물이 묻힌 지점 (x2, y2)까지의 거리를 재려 합니다. 제곱근은 배에서 계산하기 번거로우니, 두 점 사이 거리의 '제곱' 값만 구해 주세요.",
    inputDesc: "공백으로 구분된 네 정수 x1 y1 x2 y2.",
    outputDesc: "두 점 사이 거리의 제곱, 즉 (x2-x1)² + (y2-y1)².",
    sampleInput: "0 0 3 4",
    solution: "~:d;:c;:b;:a;c a- 2?d b- 2?+",
    cases: [
      { stdin: "0 0 3 4", stdout: "25" },
      { stdin: "1 1 4 5", stdout: "25" },
      { stdin: "2 2 2 2", stdout: "0", hidden: true },
      { stdin: "0 0 5 12", stdout: "169", hidden: true },
    ],
  },
  {
    title: "윤년의 비밀",
    tier: 9,
    tags: ["구현", "수학"],
    description:
      "달력을 만드는 시계공이 어떤 해가 윤년인지 알아야 합니다. 어떤 연도가 윤년이려면 4의 배수이면서 100의 배수가 아니거나, 또는 400의 배수여야 합니다. 주어진 연도가 윤년이면 1을, 아니면 0을 출력해 주세요.",
    inputDesc: "한 개의 정수 '연도 y'.",
    outputDesc: "윤년이면 1, 아니면 0.",
    sampleInput: "2024",
    solution: "~:y;y 400%0=y 4%0=y 100%0=!&|",
    cases: [
      { stdin: "2024", stdout: "1" },
      { stdin: "2023", stdout: "0" },
      { stdin: "2000", stdout: "1" },
      { stdin: "1900", stdout: "0", hidden: true },
      { stdin: "2400", stdout: "1", hidden: true },
      { stdin: "2100", stdout: "0", hidden: true },
    ],
  },
  {
    title: "합격자 발표",
    tier: 7,
    tags: ["구현"],
    description:
      "코딩 시험의 합격 기준은 60점입니다. 60점 이상이면 합격입니다. 한 학생의 점수가 주어질 때, 합격이면 1을, 불합격이면 0을 출력해 주세요.",
    inputDesc: "한 개의 정수 '점수' (0 이상 100 이하).",
    outputDesc: "60점 이상이면 1, 아니면 0.",
    sampleInput: "60",
    solution: "~59>",
    cases: [
      { stdin: "60", stdout: "1" },
      { stdin: "59", stdout: "0" },
      { stdin: "100", stdout: "1" },
      { stdin: "0", stdout: "0", hidden: true },
      { stdin: "61", stdout: "1", hidden: true },
    ],
  },
  {
    title: "출석 점수 계산기",
    tier: 8,
    tags: ["사칙연산", "구현"],
    description:
      "어느 강좌의 최종 점수는 '출석 점수 × 2 + 과제 점수'로 정해집니다. 한 수강생의 출석 점수와 과제 점수가 순서대로 주어질 때 최종 점수를 구해 주세요.",
    inputDesc: "공백으로 구분된 두 정수 '출석 점수 a'와 '과제 점수 b'.",
    outputDesc: "최종 점수, 즉 a × 2 + b.",
    sampleInput: "30 25",
    solution: "~\\2*\\+",
    cases: [
      { stdin: "30 25", stdout: "85" },
      { stdin: "3 5", stdout: "11" },
      { stdin: "50 0", stdout: "100", hidden: true },
      { stdin: "0 40", stdout: "40", hidden: true },
    ],
  },
  {
    title: "반 평균 점수",
    tier: 10,
    tags: ["배열", "수학"],
    description:
      "선생님이 반 학생들의 시험 점수를 모아 평균을 내려 합니다. 점수들이 공백으로 구분되어 주어질 때, 점수의 평균을 정수로(소수점 이하 버림) 출력해 주세요.",
    inputDesc: "공백으로 구분된 한 개 이상의 정수 점수.",
    outputDesc: "점수들의 평균(내림).",
    sampleInput: "80 90 100",
    solution: "~]:A;A{+}*A,/",
    cases: [
      { stdin: "80 90 100", stdout: "90" },
      { stdin: "1 2 3 4", stdout: "2" },
      { stdin: "100", stdout: "100", hidden: true },
      { stdin: "70 70 70 70", stdout: "70", hidden: true },
      { stdin: "55 90", stdout: "72", hidden: true },
    ],
  },
  {
    title: "일교차 구하기",
    tier: 10,
    tags: ["배열", "정렬"],
    description:
      "기상 관측소에서 하루 동안 여러 번 기온을 쟀습니다. 측정한 기온들이 주어질 때, 가장 높은 기온과 가장 낮은 기온의 차이(일교차)를 구해 주세요.",
    inputDesc: "공백으로 구분된 한 개 이상의 정수 기온.",
    outputDesc: "최고 기온에서 최저 기온을 뺀 값.",
    sampleInput: "3 1 4 1 5",
    solution: "~]$:A;A -1=A 0=-",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "4" },
      { stdin: "10 10", stdout: "0" },
      { stdin: "5 9", stdout: "4" },
      { stdin: "-3 0 7", stdout: "10", hidden: true },
      { stdin: "20", stdout: "0", hidden: true },
    ],
  },
  {
    title: "라면 타이머",
    tier: 11,
    tags: ["수학", "구현"],
    description:
      "주방의 타이머는 남은 시간을 초 단위로만 보여 줍니다. 보기 편하도록 이를 '분'과 '초'로 바꿔 주세요. 예를 들어 125초는 2분 5초입니다.",
    inputDesc: "한 개의 정수 '전체 초'.",
    outputDesc: "'분'과 '초'를 공백으로 구분해 출력. (분 = 전체초 / 60, 초 = 전체초 % 60)",
    sampleInput: "125",
    solution: "~.60/\" \"@60%",
    cases: [
      { stdin: "125", stdout: "2 5" },
      { stdin: "60", stdout: "1 0" },
      { stdin: "59", stdout: "0 59" },
      { stdin: "3661", stdout: "61 1", hidden: true },
      { stdin: "0", stdout: "0 0", hidden: true },
    ],
  },
  {
    title: "로켓 발사 카운트다운",
    tier: 8,
    tags: ["배열", "구현"],
    description:
      "우주센터에서 로켓 발사를 앞두고 카운트다운을 외칩니다. 시작 숫자 n이 주어지면 n부터 1까지 거꾸로 세어 한 줄에 공백으로 구분해 출력해 주세요.",
    inputDesc: "한 개의 정수 n. (n ≥ 1)",
    outputDesc: "n, n-1, …, 1을 공백으로 구분한 한 줄.",
    sampleInput: "5",
    solution: "~:n;n,{n\\-}%\" \"*",
    cases: [
      { stdin: "5", stdout: "5 4 3 2 1" },
      { stdin: "3", stdout: "3 2 1" },
      { stdin: "1", stdout: "1" },
      { stdin: "10", stdout: "10 9 8 7 6 5 4 3 2 1", hidden: true },
    ],
  },
  {
    title: "용돈 모으기 대작전",
    tier: 4,
    tags: ["사칙연산"],
    description:
      "지호는 매주 같은 금액의 용돈을 받아 한 푼도 쓰지 않고 모으기로 했습니다. 한 주에 받는 용돈과 모으는 주 수가 주어질 때, 지호가 모으게 될 총 금액을 구해 주세요.",
    inputDesc: "공백으로 구분된 두 정수 '주당 용돈'과 '주 수'.",
    outputDesc: "모은 총 금액, 즉 두 수의 곱.",
    sampleInput: "5000 10",
    solution: "~*",
    cases: [
      { stdin: "5000 10", stdout: "50000" },
      { stdin: "3000 4", stdout: "12000" },
      { stdin: "1 1", stdout: "1", hidden: true },
      { stdin: "12000 52", stdout: "624000", hidden: true },
    ],
  },
];

export default STORY;
