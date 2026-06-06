/**
 * Problem dataset for CODE WITH GOLFSCRIPT.
 *
 * Each problem includes Korean text, a reference GolfScript solution,
 * a difficulty tier, and a set of test cases (some hidden). The seed
 * script verifies every reference solution against the in-process
 * interpreter before inserting, so only working problems are added.
 *
 * stdin convention: the program receives stdin as a string on the
 * stack. Solutions follow standard GolfScript idioms.
 */

export interface SeedCase {
  stdin: string;
  stdout: string;
  hidden?: boolean;
}

export interface SeedProblem {
  title: string;
  tier: number;
  description: string;
  inputDesc: string;
  outputDesc: string;
  solution: string;
  cases: SeedCase[];
}

const P: SeedProblem[] = [
  // ---- Bronze: identity / arithmetic basics ------------------------
  {
    title: "그대로 출력",
    tier: 1,
    description: "표준 입력으로 들어온 문자열을 그대로 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "입력과 동일한 문자열.",
    solution: " ",
    cases: [
      { stdin: "hello", stdout: "hello" },
      { stdin: "GolfScript", stdout: "GolfScript" },
      { stdin: "1234", stdout: "1234", hidden: true },
    ],
  },
  {
    title: "두 수의 합",
    tier: 2,
    description: "공백으로 구분된 두 정수를 입력받아 합을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b.",
    outputDesc: "a + b의 값.",
    solution: "~+",
    cases: [
      { stdin: "2 3", stdout: "5" },
      { stdin: "10 20", stdout: "30" },
      { stdin: "-5 8", stdout: "3", hidden: true },
      { stdin: "1000000 2000000", stdout: "3000000", hidden: true },
    ],
  },
  {
    title: "두 수의 차",
    tier: 2,
    description: "공백으로 구분된 두 정수 a, b를 입력받아 a - b를 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b.",
    outputDesc: "a - b의 값.",
    solution: "~-",
    cases: [
      { stdin: "10 3", stdout: "7" },
      { stdin: "5 8", stdout: "-3" },
      { stdin: "100 100", stdout: "0", hidden: true },
    ],
  },
  {
    title: "두 수의 곱",
    tier: 2,
    description: "공백으로 구분된 두 정수의 곱을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b.",
    outputDesc: "a × b의 값.",
    solution: "~*",
    cases: [
      { stdin: "3 4", stdout: "12" },
      { stdin: "7 6", stdout: "42" },
      { stdin: "-2 9", stdout: "-18", hidden: true },
    ],
  },
  {
    title: "몫 구하기",
    tier: 3,
    description: "두 정수 a, b에 대해 a를 b로 나눈 몫(내림)을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b (b ≠ 0).",
    outputDesc: "a를 b로 나눈 몫.",
    solution: "~/",
    cases: [
      { stdin: "10 3", stdout: "3" },
      { stdin: "20 5", stdout: "4" },
      { stdin: "9 2", stdout: "4", hidden: true },
    ],
  },
  {
    title: "나머지 구하기",
    tier: 3,
    description: "두 정수 a, b에 대해 a를 b로 나눈 나머지를 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b (b > 0).",
    outputDesc: "a를 b로 나눈 나머지.",
    solution: "~%",
    cases: [
      { stdin: "10 3", stdout: "1" },
      { stdin: "20 7", stdout: "6" },
      { stdin: "100 10", stdout: "0", hidden: true },
    ],
  },
  {
    title: "제곱",
    tier: 2,
    description: "정수 n을 입력받아 n의 제곱을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "n × n의 값.",
    solution: "~.*",
    cases: [
      { stdin: "5", stdout: "25" },
      { stdin: "9", stdout: "81" },
      { stdin: "-4", stdout: "16", hidden: true },
    ],
  },
  {
    title: "두 배",
    tier: 1,
    description: "정수 n을 입력받아 2배를 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "2n의 값.",
    solution: "~2*",
    cases: [
      { stdin: "21", stdout: "42" },
      { stdin: "0", stdout: "0" },
      { stdin: "-7", stdout: "-14", hidden: true },
    ],
  },
  {
    title: "1 더하기",
    tier: 1,
    description: "정수 n을 입력받아 n + 1을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "n + 1의 값.",
    solution: "~)",
    cases: [
      { stdin: "41", stdout: "42" },
      { stdin: "-1", stdout: "0" },
      { stdin: "999", stdout: "1000", hidden: true },
    ],
  },
  {
    title: "1 빼기",
    tier: 1,
    description: "정수 n을 입력받아 n - 1을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "n - 1의 값.",
    solution: "~(",
    cases: [
      { stdin: "43", stdout: "42" },
      { stdin: "0", stdout: "-1" },
      { stdin: "100", stdout: "99", hidden: true },
    ],
  },

  // ---- Bronze/Silver: strings & arrays -----------------------------
  {
    title: "문자열 뒤집기",
    tier: 3,
    description: "문자열을 입력받아 거꾸로 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "뒤집힌 문자열.",
    solution: "-1%",
    cases: [
      { stdin: "abc", stdout: "cba" },
      { stdin: "golf", stdout: "flog" },
      { stdin: "racecar", stdout: "racecar", hidden: true },
    ],
  },
  {
    title: "문자열 길이",
    tier: 2,
    description: "문자열의 길이(문자 수)를 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "문자열의 길이.",
    solution: ",",
    cases: [
      { stdin: "hello", stdout: "5" },
      { stdin: "a", stdout: "1" },
      { stdin: "golfscript", stdout: "10", hidden: true },
    ],
  },
  {
    title: "문자열 두 번 반복",
    tier: 3,
    description: "입력 문자열을 두 번 이어붙여 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "문자열을 2회 반복한 결과.",
    solution: ".+",
    cases: [
      { stdin: "ab", stdout: "abab" },
      { stdin: "x", stdout: "xx" },
      { stdin: "go", stdout: "gogo", hidden: true },
    ],
  },
  {
    title: "0부터 n-1까지 합",
    tier: 4,
    description:
      "정수 n을 입력받아 0부터 n-1까지의 합을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "0 + 1 + ... + (n-1).",
    solution: "~,{+}*",
    cases: [
      { stdin: "5", stdout: "10" },
      { stdin: "1", stdout: "0" },
      { stdin: "10", stdout: "45", hidden: true },
    ],
  },
  {
    title: "1부터 n까지 합",
    tier: 4,
    description: "정수 n을 입력받아 1부터 n까지의 합을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "1 + 2 + ... + n.",
    solution: "~),{+}*",
    cases: [
      { stdin: "5", stdout: "15" },
      { stdin: "1", stdout: "1" },
      { stdin: "100", stdout: "5050", hidden: true },
    ],
  },
  {
    title: "리스트의 합",
    tier: 4,
    description:
      "공백으로 구분된 정수들을 입력받아 전체 합을 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "모든 수의 합.",
    solution: "~]{+}*",
    cases: [
      { stdin: "1 2 3 4", stdout: "10" },
      { stdin: "10 20 30", stdout: "60" },
      { stdin: "5", stdout: "5", hidden: true },
      { stdin: "1 1 1 1 1 1", stdout: "6", hidden: true },
    ],
  },
  {
    title: "리스트의 곱",
    tier: 5,
    description:
      "공백으로 구분된 정수들을 입력받아 전체 곱을 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "모든 수의 곱.",
    solution: "~]{*}*",
    cases: [
      { stdin: "1 2 3 4", stdout: "24" },
      { stdin: "5 5", stdout: "25" },
      { stdin: "2 2 2 2", stdout: "16", hidden: true },
    ],
  },
  {
    title: "팩토리얼",
    tier: 6,
    description: "정수 n을 입력받아 n! (n 팩토리얼)을 출력합니다.",
    inputDesc: "양의 정수 n (n ≥ 1).",
    outputDesc: "n!의 값.",
    solution: "~),1>{*}*",
    cases: [
      { stdin: "5", stdout: "120" },
      { stdin: "1", stdout: "1" },
      { stdin: "6", stdout: "720", hidden: true },
      { stdin: "10", stdout: "3628800", hidden: true },
    ],
  },

  // ---- Silver: comparisons, parity, digits -------------------------
  {
    title: "두 수 중 큰 값",
    tier: 5,
    description: "두 정수를 입력받아 더 큰 값을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수.",
    outputDesc: "둘 중 큰 값.",
    solution: "~]$)\\;",
    cases: [
      { stdin: "3 8", stdout: "8" },
      { stdin: "10 2", stdout: "10" },
      { stdin: "5 5", stdout: "5", hidden: true },
    ],
  },
  {
    title: "두 수 중 작은 값",
    tier: 5,
    description: "두 정수를 입력받아 더 작은 값을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수.",
    outputDesc: "둘 중 작은 값.",
    solution: "~]$(\\;",
    cases: [
      { stdin: "3 8", stdout: "3" },
      { stdin: "10 2", stdout: "2" },
      { stdin: "7 7", stdout: "7", hidden: true },
    ],
  },
  {
    title: "절댓값",
    tier: 4,
    description: "정수 n의 절댓값을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "|n|의 값.",
    solution: "~abs",
    cases: [
      { stdin: "-5", stdout: "5" },
      { stdin: "7", stdout: "7" },
      { stdin: "0", stdout: "0", hidden: true },
    ],
  },
  {
    title: "두 수의 절대 차",
    tier: 5,
    description: "두 정수의 차의 절댓값을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수.",
    outputDesc: "|a - b|의 값.",
    solution: "~-abs",
    cases: [
      { stdin: "3 8", stdout: "5" },
      { stdin: "10 4", stdout: "6" },
      { stdin: "5 5", stdout: "0", hidden: true },
    ],
  },
  {
    title: "짝수 판별",
    tier: 4,
    description:
      "정수 n이 짝수이면 1, 홀수이면 0을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "짝수면 1, 아니면 0.",
    solution: "~2%!",
    cases: [
      { stdin: "4", stdout: "1" },
      { stdin: "7", stdout: "0" },
      { stdin: "0", stdout: "1", hidden: true },
    ],
  },
  {
    title: "홀수 판별",
    tier: 4,
    description: "정수 n이 홀수이면 1, 짝수이면 0을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "홀수면 1, 아니면 0.",
    solution: "~2%",
    cases: [
      { stdin: "7", stdout: "1" },
      { stdin: "4", stdout: "0" },
      { stdin: "9", stdout: "1", hidden: true },
    ],
  },
  {
    title: "배수 판별",
    tier: 5,
    description:
      "a가 b의 배수이면 1, 아니면 0을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b (b > 0).",
    outputDesc: "배수면 1, 아니면 0.",
    solution: "~%!",
    cases: [
      { stdin: "10 5", stdout: "1" },
      { stdin: "10 3", stdout: "0" },
      { stdin: "100 25", stdout: "1", hidden: true },
    ],
  },
  {
    title: "마지막 자리 숫자",
    tier: 4,
    description: "정수 n의 일의 자리 숫자를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "n의 일의 자리.",
    solution: "~10%",
    cases: [
      { stdin: "12345", stdout: "5" },
      { stdin: "10", stdout: "0" },
      { stdin: "7", stdout: "7", hidden: true },
    ],
  },
  {
    title: "거듭제곱",
    tier: 6,
    description: "a의 b제곱을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b (b ≥ 0).",
    outputDesc: "a^b의 값.",
    solution: "~?",
    cases: [
      { stdin: "2 10", stdout: "1024" },
      { stdin: "3 3", stdout: "27" },
      { stdin: "5 0", stdout: "1", hidden: true },
    ],
  },
  {
    title: "자릿수의 합",
    tier: 7,
    description:
      "음이 아닌 정수 n의 각 자리 숫자의 합을 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "각 자리 숫자의 합.",
    solution: "~`{48-}%{+}*",
    cases: [
      { stdin: "123", stdout: "6" },
      { stdin: "9999", stdout: "36" },
      { stdin: "1000", stdout: "1", hidden: true },
    ],
  },

  // ---- Silver: string & list operations ----------------------------
  {
    title: "단어 개수",
    tier: 5,
    description:
      "공백으로 구분된 단어들의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 단어들.",
    outputDesc: "단어의 개수.",
    solution: "' '/,",
    cases: [
      { stdin: "a b c d", stdout: "4" },
      { stdin: "hello world", stdout: "2" },
      { stdin: "one", stdout: "1", hidden: true },
    ],
  },
  {
    title: "문자열 정렬",
    tier: 5,
    description:
      "문자열의 문자들을 사전순으로 정렬해 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "정렬된 문자열.",
    solution: "$",
    cases: [
      { stdin: "dcba", stdout: "abcd" },
      { stdin: "golf", stdout: "fglo" },
      { stdin: "zyx", stdout: "xyz", hidden: true },
    ],
  },
  {
    title: "중복 문자 제거",
    tier: 7,
    description:
      "문자열에서 중복을 제거하고 사전순으로 정렬해 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "중복이 제거되고 정렬된 문자열.",
    solution: "$.&",
    cases: [
      { stdin: "aabbcc", stdout: "abc" },
      { stdin: "banana", stdout: "abn" },
      { stdin: "mississippi", stdout: "imps", hidden: true },
    ],
  },
  {
    title: "특정 문자 개수 세기",
    tier: 7,
    description:
      "문자열에서 소문자 'a'의 개수를 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "'a'의 개수.",
    solution: "{97=},,",
    cases: [
      { stdin: "banana", stdout: "3" },
      { stdin: "apple", stdout: "1" },
      { stdin: "xyz", stdout: "0", hidden: true },
    ],
  },
  {
    title: "리스트 최댓값",
    tier: 6,
    description:
      "공백으로 구분된 정수들 중 최댓값을 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "최댓값.",
    solution: "~]$-1=",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "5" },
      { stdin: "9 2 6", stdout: "9" },
      { stdin: "7", stdout: "7", hidden: true },
    ],
  },
  {
    title: "리스트 최솟값",
    tier: 6,
    description:
      "공백으로 구분된 정수들 중 최솟값을 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "최솟값.",
    solution: "~]$0=",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "1" },
      { stdin: "9 2 6", stdout: "2" },
      { stdin: "8", stdout: "8", hidden: true },
    ],
  },
  {
    title: "공백을 사이에 두고 합치기",
    tier: 6,
    description:
      "공백으로 구분된 정수들을 다시 공백으로 연결해 출력합니다. (입력 정규화)",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "공백으로 연결된 같은 수열.",
    solution: "~]' '*",
    cases: [
      { stdin: "1 2 3", stdout: "1 2 3" },
      { stdin: "5 10 15", stdout: "5 10 15" },
      { stdin: "42", stdout: "42", hidden: true },
    ],
  },
  {
    title: "원소 개수",
    tier: 4,
    description:
      "공백으로 구분된 정수들의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "원소의 개수.",
    solution: "~],",
    cases: [
      { stdin: "1 2 3 4 5", stdout: "5" },
      { stdin: "10 20", stdout: "2" },
      { stdin: "7", stdout: "1", hidden: true },
    ],
  },

  // ---- Gold: ranges, sequences, formatting -------------------------
  {
    title: "1부터 n까지 나열",
    tier: 6,
    description:
      "정수 n을 입력받아 1부터 n까지를 공백으로 구분해 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "공백으로 구분된 1 2 ... n.",
    solution: "~),1>' '*",
    cases: [
      { stdin: "5", stdout: "1 2 3 4 5" },
      { stdin: "1", stdout: "1" },
      { stdin: "3", stdout: "1 2 3", hidden: true },
    ],
  },
  {
    title: "n부터 1까지 나열",
    tier: 7,
    description:
      "정수 n을 입력받아 n부터 1까지 내림차순으로 공백 구분 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "공백으로 구분된 n ... 2 1.",
    solution: "~),1>-1%' '*",
    cases: [
      { stdin: "5", stdout: "5 4 3 2 1" },
      { stdin: "1", stdout: "1" },
      { stdin: "3", stdout: "3 2 1", hidden: true },
    ],
  },
  {
    title: "별 출력",
    tier: 4,
    description: "정수 n을 입력받아 별(*)을 n개 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "별 n개로 이루어진 문자열.",
    solution: "~'*'*",
    cases: [
      { stdin: "5", stdout: "*****" },
      { stdin: "1", stdout: "*" },
      { stdin: "3", stdout: "***", hidden: true },
    ],
  },
  {
    title: "별 삼각형",
    tier: 8,
    description:
      "정수 n을 입력받아 1줄에 별 1개, 2줄에 2개 ... n줄에 n개인 삼각형을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "각 줄에 별이 늘어나는 삼각형.",
    solution: "~),1>{'*'*n+}%",
    cases: [
      { stdin: "3", stdout: "*\n**\n***" },
      { stdin: "1", stdout: "*" },
      { stdin: "4", stdout: "*\n**\n***\n****", hidden: true },
    ],
  },
  {
    title: "제곱수 나열",
    tier: 8,
    description:
      "정수 n을 입력받아 1²부터 n²까지를 공백 구분으로 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "공백으로 구분된 제곱수들.",
    solution: "~),1>{.*}%' '*",
    cases: [
      { stdin: "4", stdout: "1 4 9 16" },
      { stdin: "1", stdout: "1" },
      { stdin: "3", stdout: "1 4 9", hidden: true },
    ],
  },
  {
    title: "제곱수의 합",
    tier: 8,
    description: "1²+2²+...+n²을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "제곱수들의 합.",
    solution: "~),1>{.*}%{+}*",
    cases: [
      { stdin: "3", stdout: "14" },
      { stdin: "1", stdout: "1" },
      { stdin: "5", stdout: "55", hidden: true },
    ],
  },
  {
    title: "각 원소 2배",
    tier: 7,
    description:
      "공백으로 구분된 정수들을 각각 2배 하여 공백 구분 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "각 원소를 2배 한 수열.",
    solution: "~]{2*}%' '*",
    cases: [
      { stdin: "1 2 3", stdout: "2 4 6" },
      { stdin: "10 0 -5", stdout: "20 0 -10" },
      { stdin: "7", stdout: "14", hidden: true },
    ],
  },
  {
    title: "리스트 뒤집기",
    tier: 6,
    description:
      "공백으로 구분된 정수들을 역순으로 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "역순으로 나열된 수열.",
    solution: "~]-1%' '*",
    cases: [
      { stdin: "1 2 3", stdout: "3 2 1" },
      { stdin: "5 10 15 20", stdout: "20 15 10 5" },
      { stdin: "42", stdout: "42", hidden: true },
    ],
  },
  {
    title: "평균 (내림)",
    tier: 9,
    description:
      "공백으로 구분된 정수들의 평균을 내림하여 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "합을 개수로 나눈 몫.",
    solution: "~]:A,A{+}*\\/",
    cases: [
      { stdin: "2 4 6", stdout: "4" },
      { stdin: "1 2 3 4", stdout: "2" },
      { stdin: "10 20 30", stdout: "20", hidden: true },
    ],
  },
  {
    title: "팰린드롬 판별",
    tier: 7,
    description:
      "문자열이 앞뒤로 똑같이 읽히면 1, 아니면 0을 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "팰린드롬이면 1, 아니면 0.",
    solution: ".-1%=",
    cases: [
      { stdin: "abba", stdout: "1" },
      { stdin: "abc", stdout: "0" },
      { stdin: "level", stdout: "1", hidden: true },
    ],
  },
  {
    title: "2의 거듭제곱",
    tier: 6,
    description: "정수 n을 입력받아 2의 n제곱을 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "2^n의 값.",
    solution: "~2\\?",
    cases: [
      { stdin: "10", stdout: "1024" },
      { stdin: "0", stdout: "1" },
      { stdin: "16", stdout: "65536", hidden: true },
    ],
  },
  {
    title: "짝수만의 합",
    tier: 9,
    description:
      "1부터 n까지의 정수 중 짝수의 합을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "1..n 중 짝수의 합.",
    solution: "~),1>{2%!},{+}*",
    cases: [
      { stdin: "10", stdout: "30" },
      { stdin: "5", stdout: "6" },
      { stdin: "2", stdout: "2", hidden: true },
    ],
  },
  {
    title: "홀수만의 합",
    tier: 9,
    description:
      "1부터 n까지의 정수 중 홀수의 합을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "1..n 중 홀수의 합.",
    solution: "~),1>{2%},{+}*",
    cases: [
      { stdin: "10", stdout: "25" },
      { stdin: "5", stdout: "9" },
      { stdin: "1", stdout: "1", hidden: true },
    ],
  },
  {
    title: "특정 값보다 큰 원소 개수",
    tier: 9,
    description:
      "첫 수 k 다음에 오는 정수들 중 k보다 큰 것의 개수를 출력합니다.",
    inputDesc: "첫 번째 정수 k, 그 뒤에 공백 구분 정수들.",
    outputDesc: "k보다 큰 원소의 개수.",
    solution: "~](:k;{k>},,",
    cases: [
      { stdin: "5 1 6 3 8 5 9", stdout: "3" },
      { stdin: "0 -1 1 2", stdout: "2" },
      { stdin: "10 1 2 3", stdout: "0", hidden: true },
    ],
  },

  // ---- Gold/Platinum: number theory & formulas ---------------------
  {
    title: "세제곱",
    tier: 5,
    description: "정수 n을 입력받아 n의 세제곱을 출력합니다.",
    inputDesc: "정수 n.",
    outputDesc: "n³의 값.",
    solution: "~3?",
    cases: [
      { stdin: "3", stdout: "27" },
      { stdin: "4", stdout: "64" },
      { stdin: "10", stdout: "1000", hidden: true },
    ],
  },
  {
    title: "삼각수",
    tier: 7,
    description:
      "정수 n에 대해 1+2+...+n을 공식으로 계산해 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "n번째 삼각수.",
    solution: "~.)*2/",
    cases: [
      { stdin: "5", stdout: "15" },
      { stdin: "10", stdout: "55" },
      { stdin: "1", stdout: "1", hidden: true },
    ],
  },
  {
    title: "자릿수 개수",
    tier: 6,
    description:
      "음이 아닌 정수 n의 자릿수 개수를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "자릿수의 개수.",
    solution: "~`,",
    cases: [
      { stdin: "12345", stdout: "5" },
      { stdin: "7", stdout: "1" },
      { stdin: "1000", stdout: "4", hidden: true },
    ],
  },
  {
    title: "끝 두 자리",
    tier: 6,
    description: "정수 n을 100으로 나눈 나머지를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "n의 끝 두 자리 (n mod 100).",
    solution: "~100%",
    cases: [
      { stdin: "12345", stdout: "45" },
      { stdin: "7", stdout: "7" },
      { stdin: "100", stdout: "0", hidden: true },
    ],
  },
  {
    title: "3의 배수 개수",
    tier: 8,
    description:
      "1부터 n까지 중 3의 배수의 개수를 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "3의 배수 개수.",
    solution: "~),1>{3%!},,",
    cases: [
      { stdin: "10", stdout: "3" },
      { stdin: "9", stdout: "3" },
      { stdin: "2", stdout: "0", hidden: true },
    ],
  },
  {
    title: "최대 최소 차이",
    tier: 9,
    description:
      "공백으로 구분된 정수들의 최댓값과 최솟값의 차를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "최댓값 - 최솟값.",
    solution: "~]$.-1=\\0=-",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "4" },
      { stdin: "10 20 30", stdout: "20" },
      { stdin: "7 7 7", stdout: "0", hidden: true },
    ],
  },
  {
    title: "공백 제거 길이",
    tier: 6,
    description:
      "문자열에서 공백을 제외한 문자 수를 출력합니다.",
    inputDesc: "공백이 포함될 수 있는 한 줄.",
    outputDesc: "공백을 제외한 문자 수.",
    solution: "' '-,",
    cases: [
      { stdin: "a b c", stdout: "3" },
      { stdin: "hello world", stdout: "10" },
      { stdin: "x y z w", stdout: "4", hidden: true },
    ],
  },
  {
    title: "n의 약수 개수",
    tier: 11,
    description: "정수 n의 약수의 개수를 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "약수의 개수.",
    solution: "~:n),1>{n\\%!},,",
    cases: [
      { stdin: "6", stdout: "4" },
      { stdin: "12", stdout: "6" },
      { stdin: "7", stdout: "2", hidden: true },
      { stdin: "1", stdout: "1", hidden: true },
    ],
  },
  {
    title: "약수의 합",
    tier: 12,
    description: "정수 n의 모든 약수의 합을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "약수들의 합.",
    solution: "~:n),1>{n\\%!},{+}*",
    cases: [
      { stdin: "6", stdout: "12" },
      { stdin: "12", stdout: "28" },
      { stdin: "7", stdout: "8", hidden: true },
    ],
  },
  {
    title: "소수 판별",
    tier: 12,
    description:
      "정수 n이 소수이면 1, 아니면 0을 출력합니다.",
    inputDesc: "2 이상의 정수 n.",
    outputDesc: "소수면 1, 아니면 0.",
    solution: "~:n),1>{n\\%!},,2=",
    cases: [
      { stdin: "7", stdout: "1" },
      { stdin: "12", stdout: "0" },
      { stdin: "2", stdout: "1", hidden: true },
      { stdin: "97", stdout: "1", hidden: true },
    ],
  },
  {
    title: "완전수 판별",
    tier: 13,
    description:
      "자기 자신을 제외한 약수의 합이 자신과 같으면 1, 아니면 0을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "완전수면 1, 아니면 0.",
    solution: "~:n,1>{n\\%!},{+}*n=",
    cases: [
      { stdin: "6", stdout: "1" },
      { stdin: "28", stdout: "1" },
      { stdin: "12", stdout: "0", hidden: true },
    ],
  },
  {
    title: "1부터 n까지 제곱의 합",
    tier: 9,
    description:
      "1²+2²+...+n²을 계산해 출력합니다. (반복 활용)",
    inputDesc: "양의 정수 n.",
    outputDesc: "제곱들의 합.",
    solution: "~),1>{.*}%{+}*",
    cases: [
      { stdin: "3", stdout: "14" },
      { stdin: "5", stdout: "55" },
      { stdin: "10", stdout: "385", hidden: true },
    ],
  },
  {
    title: "5의 배수 개수",
    tier: 8,
    description:
      "1부터 n까지 중 5의 배수의 개수를 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "5의 배수 개수.",
    solution: "~),1>{5%!},,",
    cases: [
      { stdin: "20", stdout: "4" },
      { stdin: "5", stdout: "1" },
      { stdin: "4", stdout: "0", hidden: true },
    ],
  },

  // ---- Platinum/Diamond: combined techniques -----------------------
  {
    title: "서로 다른 원소 개수",
    tier: 10,
    description:
      "공백으로 구분된 정수들 중 서로 다른 값의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "중복을 제외한 값의 개수.",
    solution: "~].&,",
    cases: [
      { stdin: "1 2 2 3 3 1", stdout: "3" },
      { stdin: "5 5 5", stdout: "1" },
      { stdin: "1 2 3 4", stdout: "4", hidden: true },
    ],
  },
  {
    title: "두 번째로 큰 수",
    tier: 11,
    description:
      "공백으로 구분된 정수들 중 두 번째로 큰 값을 출력합니다. (정렬 후 선택)",
    inputDesc: "공백으로 구분된 서로 다른 정수들 (2개 이상).",
    outputDesc: "두 번째로 큰 값.",
    solution: "~]$-2=",
    cases: [
      { stdin: "3 1 4 5 9 2 6", stdout: "6" },
      { stdin: "10 20", stdout: "10" },
      { stdin: "100 50 75", stdout: "75", hidden: true },
    ],
  },
  {
    title: "자릿수의 곱",
    tier: 9,
    description:
      "음이 아닌 정수 n의 각 자리 숫자의 곱을 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "각 자리 숫자의 곱.",
    solution: "~`{48-}%{*}*",
    cases: [
      { stdin: "234", stdout: "24" },
      { stdin: "111", stdout: "1" },
      { stdin: "999", stdout: "729", hidden: true },
    ],
  },
  {
    title: "문자 두 배로 늘리기",
    tier: 8,
    description:
      "문자열의 각 문자를 두 번씩 반복해 출력합니다.",
    inputDesc: "한 줄의 문자열.",
    outputDesc: "각 문자가 두 번씩 나오는 문자열.",
    solution: "{.}%",
    cases: [
      { stdin: "ab", stdout: "aabb" },
      { stdin: "xyz", stdout: "xxyyzz" },
      { stdin: "go", stdout: "ggoo", hidden: true },
    ],
  },
  {
    title: "최댓값의 제곱",
    tier: 10,
    description:
      "공백으로 구분된 정수들 중 최댓값의 제곱을 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "최댓값의 제곱.",
    solution: "~]$-1=.*",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "25" },
      { stdin: "2 7 4", stdout: "49" },
      { stdin: "6", stdout: "36", hidden: true },
    ],
  },
  {
    title: "홀수 개수",
    tier: 8,
    description:
      "공백으로 구분된 정수들 중 홀수의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "홀수의 개수.",
    solution: "~]{2%},,",
    cases: [
      { stdin: "1 2 3 4 5", stdout: "3" },
      { stdin: "2 4 6", stdout: "0" },
      { stdin: "1 3 5 7", stdout: "4", hidden: true },
    ],
  },
  {
    title: "짝수 개수",
    tier: 8,
    description:
      "공백으로 구분된 정수들 중 짝수의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "짝수의 개수.",
    solution: "~]{2%!},,",
    cases: [
      { stdin: "1 2 3 4 5", stdout: "2" },
      { stdin: "2 4 6", stdout: "3" },
      { stdin: "1 3 5", stdout: "0", hidden: true },
    ],
  },
  {
    title: "양수 개수",
    tier: 9,
    description:
      "공백으로 구분된 정수들 중 0보다 큰 수의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "양수의 개수.",
    solution: "~]{0>},,",
    cases: [
      { stdin: "1 -2 3 -4 5", stdout: "3" },
      { stdin: "-1 -2 -3", stdout: "0" },
      { stdin: "1 2 3", stdout: "3", hidden: true },
    ],
  },
  {
    title: "제곱근 이하 정수",
    tier: 10,
    description:
      "정수 n에 대해 제곱이 n 이하인 가장 큰 정수(정수 제곱근)를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "floor(√n).",
    solution: "~:n),{.*n)<},-1=",
    cases: [
      { stdin: "16", stdout: "4" },
      { stdin: "17", stdout: "4" },
      { stdin: "24", stdout: "4", hidden: true },
      { stdin: "25", stdout: "5", hidden: true },
    ],
  },
  {
    title: "n 이하 소수 개수",
    tier: 13,
    description:
      "2부터 n까지의 소수의 개수를 출력합니다.",
    inputDesc: "2 이상의 정수 n.",
    outputDesc: "소수의 개수.",
    solution: "~),2>{:m),1>{m\\%!},,2=},,",
    cases: [
      { stdin: "10", stdout: "4" },
      { stdin: "2", stdout: "1" },
      { stdin: "20", stdout: "8", hidden: true },
    ],
  },
  {
    title: "1부터 n까지 곱 (계승)",
    tier: 8,
    description:
      "1부터 n까지의 모든 정수를 곱한 값을 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "1 × 2 × ... × n.",
    solution: "~),1>{*}*",
    cases: [
      { stdin: "4", stdout: "24" },
      { stdin: "1", stdout: "1" },
      { stdin: "5", stdout: "120", hidden: true },
    ],
  },
  {
    title: "리스트에서 특정 값 제거",
    tier: 9,
    description:
      "첫 수 k 다음에 오는 정수들에서 k와 같은 값을 모두 제거한 뒤, 남은 개수를 출력합니다.",
    inputDesc: "첫 번째 정수 k, 그 뒤에 공백 구분 정수들.",
    outputDesc: "k를 제거한 후 남은 원소 개수.",
    solution: "~](:k;{k=!},,",
    cases: [
      { stdin: "2 2 3 2 4 2", stdout: "2" },
      { stdin: "5 1 2 3", stdout: "3" },
      { stdin: "1 1 1 1", stdout: "0", hidden: true },
    ],
  },
  {
    title: "내림차순 정렬",
    tier: 9,
    description:
      "공백으로 구분된 정수들을 내림차순으로 정렬해 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "내림차순으로 정렬된 수열.",
    solution: "~]$-1%' '*",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "5 4 3 1 1" },
      { stdin: "10 5 20", stdout: "20 10 5" },
      { stdin: "1 2 3", stdout: "3 2 1", hidden: true },
    ],
  },
  {
    title: "오름차순 정렬",
    tier: 8,
    description:
      "공백으로 구분된 정수들을 오름차순으로 정렬해 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "오름차순으로 정렬된 수열.",
    solution: "~]$' '*",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "1 1 3 4 5" },
      { stdin: "20 5 10", stdout: "5 10 20" },
      { stdin: "3 2 1", stdout: "1 2 3", hidden: true },
    ],
  },
  {
    title: "절댓값들의 합",
    tier: 9,
    description:
      "공백으로 구분된 정수들의 절댓값을 모두 더해 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "절댓값들의 합.",
    solution: "~]{abs}%{+}*",
    cases: [
      { stdin: "-1 2 -3", stdout: "6" },
      { stdin: "5 -5", stdout: "10" },
      { stdin: "-10", stdout: "10", hidden: true },
    ],
  },
  {
    title: "최댓값과 최솟값의 합",
    tier: 9,
    description:
      "공백으로 구분된 정수들의 최댓값과 최솟값을 더해 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "최댓값 + 최솟값.",
    solution: "~]$.0=\\-1=+",
    cases: [
      { stdin: "3 1 4 1 5", stdout: "6" },
      { stdin: "10 20 30", stdout: "40" },
      { stdin: "7", stdout: "14", hidden: true },
    ],
  },
  {
    title: "각 자리 숫자 나열",
    tier: 8,
    description:
      "정수 n의 각 자리 숫자를 공백으로 구분해 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "각 자리 숫자를 공백으로 구분한 수열.",
    solution: "~`{48-}%' '*",
    cases: [
      { stdin: "123", stdout: "1 2 3" },
      { stdin: "5", stdout: "5" },
      { stdin: "9081", stdout: "9 0 8 1", hidden: true },
    ],
  },
  {
    title: "최대 자리 숫자",
    tier: 10,
    description:
      "정수 n의 각 자리 숫자 중 가장 큰 숫자를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "가장 큰 자리 숫자.",
    solution: "~`{48-}%$-1=",
    cases: [
      { stdin: "1729", stdout: "9" },
      { stdin: "555", stdout: "5" },
      { stdin: "3081", stdout: "8", hidden: true },
    ],
  },
  {
    title: "최소 자리 숫자",
    tier: 10,
    description:
      "정수 n의 각 자리 숫자 중 가장 작은 숫자를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "가장 작은 자리 숫자.",
    solution: "~`{48-}%$0=",
    cases: [
      { stdin: "1729", stdout: "1" },
      { stdin: "555", stdout: "5" },
      { stdin: "3081", stdout: "0", hidden: true },
    ],
  },
  {
    title: "처음 n개의 홀수 합",
    tier: 9,
    description:
      "처음 n개의 홀수(1, 3, 5, ...)의 합을 출력합니다. (결과는 n²)",
    inputDesc: "양의 정수 n.",
    outputDesc: "처음 n개 홀수의 합.",
    solution: "~,{2*)}%{+}*",
    cases: [
      { stdin: "3", stdout: "9" },
      { stdin: "1", stdout: "1" },
      { stdin: "5", stdout: "25", hidden: true },
    ],
  },
  {
    title: "n번 반복 출력",
    tier: 7,
    description:
      "정수 n을 입력받아 문자 '#'을 n번 반복해 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "'#'을 n번 반복한 문자열.",
    solution: "~'#'*",
    cases: [
      { stdin: "3", stdout: "###" },
      { stdin: "5", stdout: "#####" },
      { stdin: "1", stdout: "#", hidden: true },
    ],
  },
  {
    title: "0의 개수",
    tier: 8,
    description:
      "공백으로 구분된 정수들 중 0의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "0의 개수.",
    solution: "~]{!},,",
    cases: [
      { stdin: "0 1 0 2 0", stdout: "3" },
      { stdin: "1 2 3", stdout: "0" },
      { stdin: "0 0", stdout: "2", hidden: true },
    ],
  },
  {
    title: "음수 개수",
    tier: 9,
    description:
      "공백으로 구분된 정수들 중 0보다 작은 수의 개수를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "음수의 개수.",
    solution: "~]{0<},,",
    cases: [
      { stdin: "1 -2 3 -4 -5", stdout: "3" },
      { stdin: "1 2 3", stdout: "0" },
      { stdin: "-1 -2", stdout: "2", hidden: true },
    ],
  },
  {
    title: "n진수 자리합 (2진수)",
    tier: 12,
    description:
      "정수 n의 이진수 표현에서 1의 개수(팝카운트)를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "이진수에서 1의 개수.",
    solution: "~2base{+}*",
    cases: [
      { stdin: "5", stdout: "2" },
      { stdin: "7", stdout: "3" },
      { stdin: "8", stdout: "1", hidden: true },
      { stdin: "255", stdout: "8", hidden: true },
    ],
  },
  {
    title: "최댓값 위치",
    tier: 12,
    description:
      "공백으로 구분된 정수들에서 최댓값이 처음 등장하는 위치(0부터 시작)를 출력합니다.",
    inputDesc: "공백으로 구분된 정수들.",
    outputDesc: "최댓값의 인덱스.",
    solution: "~]:a$-1=a\\?",
    cases: [
      { stdin: "3 1 4 1 5 9 2", stdout: "5" },
      { stdin: "10 5 3", stdout: "0" },
      { stdin: "1 2 3", stdout: "2", hidden: true },
    ],
  },
  {
    title: "범위 내 합",
    tier: 10,
    description:
      "두 정수 a, b (a ≤ b)에 대해 a부터 b까지의 합을 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수 a와 b.",
    outputDesc: "a + (a+1) + ... + b.",
    solution: "~\\:a;),a>{+}*",
    cases: [
      { stdin: "1 5", stdout: "15" },
      { stdin: "3 3", stdout: "3" },
      { stdin: "1 10", stdout: "55", hidden: true },
      { stdin: "5 8", stdout: "26", hidden: true },
    ],
  },

  // ---- Diamond: extra challenges -----------------------------------
  {
    title: "이진수 변환",
    tier: 11,
    description:
      "음이 아닌 정수 n을 이진수 문자열로 변환해 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "n의 이진수 표현.",
    solution: "~2base''*",
    cases: [
      { stdin: "5", stdout: "101" },
      { stdin: "8", stdout: "1000" },
      { stdin: "255", stdout: "11111111", hidden: true },
    ],
  },
  {
    title: "이진수 1의 개수",
    tier: 11,
    description:
      "정수 n의 이진수 표현에서 1의 개수를 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "이진수에서 1의 개수.",
    solution: "~2base{+}*",
    cases: [
      { stdin: "5", stdout: "2" },
      { stdin: "7", stdout: "3" },
      { stdin: "8", stdout: "1", hidden: true },
      { stdin: "255", stdout: "8", hidden: true },
    ],
  },
  {
    title: "각 단어 길이",
    tier: 10,
    description:
      "공백으로 구분된 단어들의 길이를 공백으로 구분해 출력합니다.",
    inputDesc: "공백으로 구분된 단어들.",
    outputDesc: "각 단어의 길이.",
    solution: "' '/{,}%' '*",
    cases: [
      { stdin: "a bb ccc", stdout: "1 2 3" },
      { stdin: "hello world", stdout: "5 5" },
      { stdin: "x", stdout: "1", hidden: true },
    ],
  },
  {
    title: "가장 긴 단어 길이",
    tier: 11,
    description:
      "공백으로 구분된 단어들 중 가장 긴 단어의 길이를 출력합니다.",
    inputDesc: "공백으로 구분된 단어들.",
    outputDesc: "가장 긴 단어의 길이.",
    solution: "' '/{,}%$-1=",
    cases: [
      { stdin: "a bb ccc", stdout: "3" },
      { stdin: "hi hello hey", stdout: "5" },
      { stdin: "x", stdout: "1", hidden: true },
    ],
  },
  {
    title: "수열의 누적 차이 합",
    tier: 12,
    description:
      "공백으로 구분된 정수들의 인접한 두 수의 차의 합을 출력합니다. (마지막 - 첫 번째와 같음)",
    inputDesc: "공백으로 구분된 정수들 (2개 이상).",
    outputDesc: "(마지막 값) - (첫 번째 값).",
    solution: "~].-1=\\0=-",
    cases: [
      { stdin: "1 3 6 10", stdout: "9" },
      { stdin: "5 2", stdout: "-3" },
      { stdin: "10 10 10", stdout: "0", hidden: true },
    ],
  },
  {
    title: "제곱수 판별",
    tier: 12,
    description:
      "정수 n이 어떤 정수의 제곱이면 1, 아니면 0을 출력합니다.",
    inputDesc: "0 이상의 정수 n.",
    outputDesc: "완전제곱수면 1, 아니면 0.",
    solution: "~:n),{.*n=},,0>",
    cases: [
      { stdin: "16", stdout: "1" },
      { stdin: "17", stdout: "0" },
      { stdin: "0", stdout: "1", hidden: true },
      { stdin: "100", stdout: "1", hidden: true },
    ],
  },
  {
    title: "약수들의 곱셈 여부",
    tier: 11,
    description:
      "정수 n이 1을 제외한 약수를 가지면(즉 1보다 큰 합성수 또는 소수) 약수의 개수를 출력합니다. 약수 개수가 2이면 소수입니다.",
    inputDesc: "2 이상의 정수 n.",
    outputDesc: "약수의 총 개수.",
    solution: "~:n),1>{n\\%!},,",
    cases: [
      { stdin: "6", stdout: "4" },
      { stdin: "7", stdout: "2" },
      { stdin: "16", stdout: "5", hidden: true },
    ],
  },
  {
    title: "0부터 n까지 짝수 나열",
    tier: 9,
    description:
      "0부터 n까지의 짝수를 공백으로 구분해 오름차순 출력합니다.",
    inputDesc: "양의 정수 n.",
    outputDesc: "0부터 n까지의 짝수들.",
    solution: "~),{2%!},' '*",
    cases: [
      { stdin: "10", stdout: "0 2 4 6 8 10" },
      { stdin: "5", stdout: "0 2 4" },
      { stdin: "1", stdout: "0", hidden: true },
    ],
  },
  {
    title: "문자열 안의 숫자 합",
    tier: 13,
    description:
      "문자열에 섞여 있는 숫자 문자(0-9)들의 합을 출력합니다. 숫자는 적어도 하나 이상 포함됩니다.",
    inputDesc: "숫자가 하나 이상 포함된 한 줄.",
    outputDesc: "숫자 문자들의 합.",
    solution: "{.47>\\58<*},{48-}%{+}*",
    cases: [
      { stdin: "a1b2c3", stdout: "6" },
      { stdin: "x5y", stdout: "5" },
      { stdin: "9z9", stdout: "18", hidden: true },
    ],
  },
  {
    title: "최빈 자리 숫자 합",
    tier: 12,
    description:
      "두 정수의 각 자리 숫자 합을 더해 출력합니다.",
    inputDesc: "공백으로 구분된 두 정수.",
    outputDesc: "두 수의 자리 숫자 합의 합.",
    solution: "~]{`{48-}%{+}*}%{+}*",
    cases: [
      { stdin: "123 45", stdout: "15" },
      { stdin: "11 11", stdout: "4" },
      { stdin: "999 1", stdout: "28", hidden: true },
    ],
  },
  {
    title: "수의 범위 곱",
    tier: 11,
    description:
      "두 정수 a, b (a ≤ b, 모두 양수)에 대해 a부터 b까지의 곱을 출력합니다.",
    inputDesc: "공백으로 구분된 두 양의 정수 a와 b.",
    outputDesc: "a × (a+1) × ... × b.",
    solution: "~\\:a;),a>{*}*",
    cases: [
      { stdin: "1 5", stdout: "120" },
      { stdin: "3 4", stdout: "12" },
      { stdin: "2 5", stdout: "120", hidden: true },
    ],
  },
];

export default P;
