-- ============================================================
--  Migration 013: tag the existing 142 problems
--  Run in the Supabase SQL Editor after 012_problem_tags.sql.
--  Idempotent: re-running just re-sets the same tags by title.
-- ============================================================

-- 사칙연산
update public.problems set tags = '{사칙연산}' where title in (
  '두 수의 합','두 수의 차','두 수의 곱','몫 구하기','나머지 구하기','두 배','1 더하기','1 빼기'
);

-- 수학
update public.problems set tags = '{수학}' where title in (
  '제곱','1부터 n까지 합','절댓값','두 수의 절대 차','마지막 자리 숫자','거듭제곱',
  '제곱수의 합','2의 거듭제곱','세제곱','삼각수','끝 두 자리','1부터 n까지 제곱의 합',
  '제곱근 이하 정수','처음 n개의 홀수 합','범위 내 합','제곱수 판별','수의 범위 곱',
  'n번째 피보나치 수','두 수의 평균 (내림)','제곱근 (정수)','계단 오르기','등차수열의 합'
);

-- 수학 + 배열
update public.problems set tags = '{수학,배열}' where title in (
  '0부터 n-1까지 합','제곱수 나열','평균 (내림)'
);

-- 배열
update public.problems set tags = '{배열}' where title in (
  '리스트의 합','리스트의 곱','리스트 최댓값','리스트 최솟값','원소 개수','각 원소 2배',
  '리스트 뒤집기','특정 값보다 큰 원소 개수','최대 최소 차이','서로 다른 원소 개수',
  '홀수 개수','짝수 개수','양수 개수','리스트에서 특정 값 제거','최댓값과 최솟값의 합',
  '0의 개수','음수 개수','최댓값 위치','0부터 n까지 짝수 나열','최댓값과의 차이','최댓값 여러 개'
);

-- 배열 + 수학
update public.problems set tags = '{배열,수학}' where title in (
  '짝수만의 합','홀수만의 합','최댓값의 제곱','절댓값들의 합','수열의 누적 차이 합',
  '최댓값 빼기 최솟값의 절반','최고점과 최저점 제외 평균'
);

-- 배열 + 정렬
update public.problems set tags = '{배열,정렬}' where title in (
  '두 번째로 큰 수','내림차순 정렬','오름차순 정렬'
);

-- 배열 + 정수론
update public.problems set tags = '{배열,정수론}' where title in (
  '3의 배수 개수','5의 배수 개수','3의 배수의 합'
);

-- 배열 + 구현
update public.problems set tags = '{배열,구현}' where title in (
  '1부터 n까지 나열','n부터 1까지 나열'
);

-- 문자열
update public.problems set tags = '{문자열}' where title in (
  '문자열 뒤집기','문자열 길이','문자열 두 번 반복','단어 개수','중복 문자 제거',
  '특정 문자 개수 세기','팰린드롬 판별','공백 제거 길이','문자 두 배로 늘리기','각 단어 길이',
  '가장 긴 단어 길이','Hello, World!','대문자로 변환','소문자로 변환','단어 순서 뒤집기',
  '소문자 개수','ASCII 코드 값','문자열 이어붙이기','각 단어 첫 글자','모음 개수 세기'
);

-- 수학 + 문자열
update public.problems set tags = '{수학,문자열}' where title in (
  '자릿수의 합','자릿수 개수','자릿수의 곱','각 자리 숫자 나열','최대 자리 숫자','최소 자리 숫자',
  '문자열 안의 숫자 합','최빈 자리 숫자 합','자릿수 제곱의 합','회문 수 판별'
);

-- 문자열 + 구현
update public.problems set tags = '{문자열,구현}' where title in (
  '그대로 출력','별 출력','별 삼각형','n번 반복 출력','369 게임','시저 암호'
);

-- 문자열 + 정렬
update public.problems set tags = '{문자열,정렬}' where title = '문자열 정렬';

-- 문자열 + 배열
update public.problems set tags = '{문자열,배열}' where title = '공백을 사이에 두고 합치기';

-- 정수론
update public.problems set tags = '{정수론}' where title in (
  '배수 판별','n의 약수 개수','약수의 합','소수 판별','완전수 판별','n 이하 소수 개수',
  '약수들의 곱셈 여부','최대공약수','최소공배수','약수 목록','가장 큰 진약수','약수의 개수가 홀수인가'
);

-- 정수론 + 수학
update public.problems set tags = '{정수론,수학}' where title in (
  '팩토리얼','1부터 n까지 곱 (계승)','3 또는 5의 배수 합'
);

-- 진법
update public.problems set tags = '{진법}' where title in (
  'n진수 자리합 (2진수)','이진수 변환','이진수 1의 개수'
);

-- 수학 + 구현
update public.problems set tags = '{수학,구현}' where title in (
  '짝수 판별','홀수 판별','콜라츠 다음 수','타일 깔기','사탕 공평하게 나누기',
  '두 분수 크기 비교','세 과목 평균','구구단 한 줄'
);

-- 구현
update public.problems set tags = '{구현}' where title in (
  '두 수 중 큰 값','두 수 중 작은 값','윤년 판별','초를 시:분:초로'
);

-- 구현 + 수학
update public.problems set tags = '{구현,수학}' where title = '거스름돈 동전 개수';

-- 구현 + 시뮬레이션
update public.problems set tags = '{구현,시뮬레이션}' where title = '숫자 합이 같아질 때까지';

-- 기하 + 수학
update public.problems set tags = '{기하,수학}' where title in (
  '직사각형 농장의 울타리','다각형의 내각의 합','두 점 사이 거리의 제곱'
);

-- ============================================================
--  End of migration 013
-- ============================================================
