/**
 * Per-problem metadata: example input (distinct from grading test cases)
 * and source attribution.
 *
 * The sample output is NOT stored here — the seed script derives it by
 * running the reference solution on the sample input, guaranteeing the
 * displayed example is always correct.
 *
 * Sources: where a problem type is a well-known classic, we credit the
 * origin (the problem text itself is freshly written in Korean, not
 * copied). Original problems are marked "자체 제작".
 */

export interface ProblemMeta {
  sampleInput: string;
  source: string;
}

const META: Record<string, ProblemMeta> = {
  "그대로 출력": { sampleInput: "world", source: "Anarchy Golf - echo 계열" },
  "두 수의 합": { sampleInput: "7 8", source: "Project Euler / 기초 산술" },
  "두 수의 차": { sampleInput: "20 5", source: "자체 제작" },
  "두 수의 곱": { sampleInput: "6 9", source: "자체 제작" },
  "몫 구하기": { sampleInput: "17 5", source: "자체 제작" },
  "나머지 구하기": { sampleInput: "17 5", source: "자체 제작" },
  제곱: { sampleInput: "12", source: "자체 제작" },
  "두 배": { sampleInput: "15", source: "자체 제작" },
  "1 더하기": { sampleInput: "7", source: "자체 제작" },
  "1 빼기": { sampleInput: "10", source: "자체 제작" },
  "문자열 뒤집기": {
    sampleInput: "stack",
    source: "Rosetta Code - Reverse a string",
  },
  "문자열 길이": { sampleInput: "abcdef", source: "자체 제작" },
  "문자열 두 번 반복": { sampleInput: "hi", source: "자체 제작" },
  "0부터 n-1까지 합": { sampleInput: "4", source: "자체 제작" },
  "1부터 n까지 합": {
    sampleInput: "10",
    source: "Project Euler #1 변형 / Gauss 합",
  },
  "리스트의 합": {
    sampleInput: "2 4 6 8",
    source: "Rosetta Code - Sum of a series",
  },
  "리스트의 곱": { sampleInput: "2 3 4", source: "자체 제작" },
  팩토리얼: { sampleInput: "4", source: "Rosetta Code - Factorial" },
  "두 수 중 큰 값": { sampleInput: "12 7", source: "자체 제작" },
  "두 수 중 작은 값": { sampleInput: "12 7", source: "자체 제작" },
  절댓값: { sampleInput: "-9", source: "Rosetta Code - Abs" },
  "두 수의 절대 차": { sampleInput: "4 11", source: "자체 제작" },
  "짝수 판별": { sampleInput: "6", source: "자체 제작" },
  "홀수 판별": { sampleInput: "5", source: "자체 제작" },
  "배수 판별": { sampleInput: "12 4", source: "자체 제작" },
  "마지막 자리 숫자": { sampleInput: "98765", source: "자체 제작" },
  거듭제곱: { sampleInput: "3 4", source: "Rosetta Code - Exponentiation" },
  "자릿수의 합": {
    sampleInput: "256",
    source: "Rosetta Code - Sum digits of an integer",
  },
  "단어 개수": {
    sampleInput: "the quick brown fox",
    source: "Rosetta Code - Word count",
  },
  "문자열 정렬": {
    sampleInput: "edcba",
    source: "Rosetta Code - Sort characters",
  },
  "중복 문자 제거": {
    sampleInput: "aabbccdd",
    source: "Rosetta Code - Remove duplicate elements",
  },
  "특정 문자 개수 세기": {
    sampleInput: "alabama",
    source: "Rosetta Code - Count occurrences",
  },
  "리스트 최댓값": {
    sampleInput: "2 8 1 9 3",
    source: "Rosetta Code - Greatest element of a list",
  },
  "리스트 최솟값": { sampleInput: "2 8 1 9 3", source: "자체 제작" },
  "공백을 사이에 두고 합치기": { sampleInput: "7 8 9", source: "자체 제작" },
  "원소 개수": { sampleInput: "4 5 6", source: "자체 제작" },
  "1부터 n까지 나열": { sampleInput: "4", source: "자체 제작" },
  "n부터 1까지 나열": { sampleInput: "4", source: "자체 제작" },
  "별 출력": { sampleInput: "4", source: "자체 제작" },
  "별 삼각형": {
    sampleInput: "2",
    source: "Rosetta Code - Pascal/ASCII art 계열",
  },
  "제곱수 나열": { sampleInput: "5", source: "자체 제작" },
  "제곱수의 합": {
    sampleInput: "4",
    source: "Project Euler #6 변형 / 제곱의 합",
  },
  "각 원소 2배": { sampleInput: "4 5 6", source: "자체 제작" },
  "리스트 뒤집기": {
    sampleInput: "1 2 3 4",
    source: "Rosetta Code - Reverse a list",
  },
  "평균 (내림)": {
    sampleInput: "3 6 9",
    source: "Rosetta Code - Averages/Arithmetic mean",
  },
  "팰린드롬 판별": {
    sampleInput: "noon",
    source: "Rosetta Code - Palindrome detection",
  },
  "2의 거듭제곱": { sampleInput: "5", source: "자체 제작" },
  "짝수만의 합": { sampleInput: "8", source: "자체 제작" },
  "홀수만의 합": { sampleInput: "8", source: "자체 제작" },
  "특정 값보다 큰 원소 개수": { sampleInput: "4 2 5 1 7 4", source: "자체 제작" },
  세제곱: { sampleInput: "5", source: "자체 제작" },
  삼각수: {
    sampleInput: "6",
    source: "Rosetta Code - Triangular numbers",
  },
  "자릿수 개수": {
    sampleInput: "424242",
    source: "자체 제작",
  },
  "끝 두 자리": { sampleInput: "98765", source: "자체 제작" },
  "3의 배수 개수": { sampleInput: "15", source: "자체 제작" },
  "최대 최소 차이": { sampleInput: "2 8 1 9 3", source: "자체 제작" },
  "공백 제거 길이": { sampleInput: "a b c d", source: "자체 제작" },
  "n의 약수 개수": {
    sampleInput: "10",
    source: "Rosetta Code - Count in factors / 약수",
  },
  "약수의 합": {
    sampleInput: "10",
    source: "Project Euler #21 변형 / 약수 합",
  },
  "소수 판별": {
    sampleInput: "13",
    source: "Rosetta Code - Primality by trial division",
  },
  "완전수 판별": {
    sampleInput: "8",
    source: "Rosetta Code - Perfect numbers",
  },
  "1부터 n까지 제곱의 합": {
    sampleInput: "4",
    source: "Project Euler #6 변형",
  },
  "5의 배수 개수": { sampleInput: "30", source: "자체 제작" },
  "서로 다른 원소 개수": {
    sampleInput: "4 4 5 6 6",
    source: "Rosetta Code - Unique elements",
  },
  "두 번째로 큰 수": {
    sampleInput: "5 9 3 8 1",
    source: "자체 제작",
  },
  "자릿수의 곱": {
    sampleInput: "345",
    source: "Rosetta Code - Digit product",
  },
  "문자 두 배로 늘리기": { sampleInput: "cat", source: "자체 제작" },
  "최댓값의 제곱": { sampleInput: "2 5 3", source: "자체 제작" },
  "홀수 개수": { sampleInput: "2 3 4 5 6", source: "자체 제작" },
  "짝수 개수": { sampleInput: "2 3 4 5 6", source: "자체 제작" },
  "양수 개수": { sampleInput: "3 -1 0 2 -4", source: "자체 제작" },
  "제곱근 이하 정수": {
    sampleInput: "30",
    source: "Rosetta Code - Integer square root",
  },
  "n 이하 소수 개수": {
    sampleInput: "15",
    source: "Project Euler #10 변형 / 소수 세기",
  },
  "1부터 n까지 곱 (계승)": { sampleInput: "6", source: "자체 제작" },
  "리스트에서 특정 값 제거": { sampleInput: "3 1 3 2 3", source: "자체 제작" },
  "내림차순 정렬": {
    sampleInput: "4 2 7 1",
    source: "Rosetta Code - Sort descending",
  },
  "오름차순 정렬": {
    sampleInput: "4 2 7 1",
    source: "Rosetta Code - Sort ascending",
  },
  "절댓값들의 합": { sampleInput: "-2 3 -4", source: "자체 제작" },
  "최댓값과 최솟값의 합": { sampleInput: "2 8 1 9", source: "자체 제작" },
  "각 자리 숫자 나열": {
    sampleInput: "4071",
    source: "Rosetta Code - Split a number into digits",
  },
  "최대 자리 숫자": { sampleInput: "5283", source: "자체 제작" },
  "최소 자리 숫자": { sampleInput: "5283", source: "자체 제작" },
  "처음 n개의 홀수 합": {
    sampleInput: "4",
    source: "Rosetta Code - Sum of odd numbers",
  },
  "n번 반복 출력": { sampleInput: "4", source: "자체 제작" },
  "0의 개수": { sampleInput: "0 5 0 3", source: "자체 제작" },
  "음수 개수": { sampleInput: "3 -1 -2 4", source: "자체 제작" },
  "n진수 자리합 (2진수)": {
    sampleInput: "6",
    source: "Rosetta Code - Population count",
  },
  "최댓값 위치": {
    sampleInput: "2 9 4 9 1",
    source: "자체 제작",
  },
  "범위 내 합": {
    sampleInput: "2 6",
    source: "Project Euler #1 변형 / 구간 합",
  },
  "이진수 변환": {
    sampleInput: "6",
    source: "Rosetta Code - Binary digits",
  },
  "이진수 1의 개수": {
    sampleInput: "6",
    source: "Rosetta Code - Population count",
  },
  "각 단어 길이": { sampleInput: "i am here", source: "자체 제작" },
  "가장 긴 단어 길이": {
    sampleInput: "a bb cccc d",
    source: "자체 제작",
  },
  "수열의 누적 차이 합": { sampleInput: "2 5 9", source: "자체 제작" },
  "제곱수 판별": {
    sampleInput: "36",
    source: "Rosetta Code - Perfect square",
  },
  "약수들의 곱셈 여부": { sampleInput: "8", source: "자체 제작" },
  "0부터 n까지 짝수 나열": { sampleInput: "8", source: "자체 제작" },
  "문자열 안의 숫자 합": {
    sampleInput: "k7m2",
    source: "자체 제작",
  },
  "최빈 자리 숫자 합": { sampleInput: "12 34", source: "자체 제작" },
  "수의 범위 곱": { sampleInput: "2 4", source: "자체 제작" },
  "Hello, World!": { sampleInput: "test", source: "고전 프로그래밍 입문 예제 (K&R)" },
  "3 또는 5의 배수 합": {
    sampleInput: "16",
    source: "Project Euler #1 (Multiples of 3 and 5)",
  },
  최대공약수: {
    sampleInput: "24 16",
    source: "Rosetta Code - Greatest common divisor",
  },
  최소공배수: {
    sampleInput: "4 10",
    source: "Rosetta Code - Least common multiple",
  },
  "대문자로 변환": { sampleInput: "world", source: "Rosetta Code - String case" },
  "소문자로 변환": { sampleInput: "WORLD", source: "Rosetta Code - String case" },
  "n번째 피보나치 수": {
    sampleInput: "7",
    source: "Rosetta Code - Fibonacci sequence",
  },
  "단어 순서 뒤집기": {
    sampleInput: "i love golf",
    source: "Rosetta Code - Reverse words in a string",
  },
  "자릿수 제곱의 합": {
    sampleInput: "44",
    source: "Project Euler / Happy number 계열",
  },
  "소문자 개수": {
    sampleInput: "HelloWorld",
    source: "Rosetta Code - Count occurrences",
  },
  "콜라츠 다음 수": {
    sampleInput: "10",
    source: "Project Euler #14 (Collatz)",
  },
  "두 수의 평균 (내림)": {
    sampleInput: "5 9",
    source: "Rosetta Code - Averages/Arithmetic mean",
  },
  "ASCII 코드 값": {
    sampleInput: "Z",
    source: "Rosetta Code - Character codes",
  },
  "문자열 이어붙이기": {
    sampleInput: "hello world",
    source: "Rosetta Code - String concatenation",
  },
  "제곱근 (정수)": {
    sampleInput: "50",
    source: "Rosetta Code - Isqrt",
  },
  "약수 목록": {
    sampleInput: "18",
    source: "Rosetta Code - Factors of an integer",
  },
  "숫자 합이 같아질 때까지": {
    sampleInput: "456",
    source: "디지털 루트 - Rosetta Code",
  },
  "최댓값 빼기 최솟값의 절반": {
    sampleInput: "2 12",
    source: "자체 제작",
  },
  "회문 수 판별": {
    sampleInput: "1331",
    source: "Project Euler #4 (Palindrome)",
  },
  "각 단어 첫 글자": {
    sampleInput: "what you see",
    source: "Rosetta Code - Acronym",
  },
  "직사각형 농장의 울타리": { sampleInput: "4 6", source: "자체 제작 (정올 스타일)" },
  "타일 깔기": { sampleInput: "4 6", source: "자체 제작 (정올 스타일)" },
  "윤년 판별": { sampleInput: "2100", source: "자체 제작 (정올 스타일)" },
  "다각형의 내각의 합": { sampleInput: "6", source: "자체 제작 (정올 스타일)" },
  "가장 큰 진약수": { sampleInput: "18", source: "자체 제작 (정올 스타일)" },
  "사탕 공평하게 나누기": { sampleInput: "17 5", source: "자체 제작 (정올 스타일)" },
  "계단 오르기": { sampleInput: "6", source: "자체 제작 (정올 스타일)" },
  "369 게임": { sampleInput: "20", source: "자체 제작 (정올 스타일)" },
  "두 분수 크기 비교": { sampleInput: "3 4 2 3", source: "자체 제작 (정올 스타일)" },
  "초를 시:분:초로": { sampleInput: "3725", source: "자체 제작 (정올 스타일)" },
  "최댓값과의 차이": { sampleInput: "80 95 60", source: "자체 제작 (정올 스타일)" },
  "등차수열의 합": { sampleInput: "3 2 5", source: "자체 제작 (정올 스타일)" },
};

export default META;
