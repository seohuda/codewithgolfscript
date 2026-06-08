-- ============================================================
--  Migration 021: seed the "등교" subtask example problem (additive)
--  Demonstrates partial scoring (subtasks). Safe to re-run: inserted
--  only if the title does not already exist.
--  Run after 020_subtasks.sql.
-- ============================================================

do $$
declare new_id bigint;
begin
  if not exists (select 1 from public.problems where title = '등교') then
    insert into public.problems
      (title, description, input_desc, output_desc, tier, source,
       sample_input, sample_output, step_group, step_order, tags, subtasks)
    values (
      '등교',
      E'정올이는 수업에 지각하지 않기 위해 학교에 X분 이내로 도착해야 한다. 학교로 이동하려면 정류장에 정차하는 N개의 버스 중 하나를 선택하여 탑승해야 한다.\n\n게으른 정올이는 최대한 늦게 버스를 타기 위해서 N개의 버스의 정보를 찾아보았다. 각 버스가 지금부터 몇 분 후에 정류장에서 출발하며, 정류장에서 출발한 버스가 학교에 도착하기 위해 몇 분이 걸리는지 알아낼 수 있었지만, 어떤 버스를 타고 학교에 갈지 아직 결정하지 못했다.\n\n정올이를 위해서 학교에 지각하지 않는 시각에 도착하는 버스 중에서, 가장 늦게 출발하는 버스가 출발할 때까지 걸리는 시간을 구해주자. 학교에 지각하지 않도록 버스를 선택하는 방법이 없을 수도 있다.\n\n[제약 조건]\n- 주어지는 모든 수는 정수이다.\n- 1 ≤ N ≤ 100\n- 2 ≤ X ≤ 200\n- 각 버스에 대해, 출발까지 걸리는 시간 S와 학교까지 가는 시간 T는 1 ≤ S ≤ 100, 1 ≤ T ≤ 100.\n\n[부분 문제]\n1. (10점) N = 1\n2. (15점) 모든 버스는 X분 이내로 학교에 도착한다.\n3. (30점) 모든 버스에 대해 T = 20\n4. (45점) 추가 제약 조건 없음',
      E'첫 번째 줄에 N과 X가 공백을 하나 사이에 두고 주어진다.\n두 번째 줄부터 N개의 줄에 걸쳐, 한 줄에 하나씩 출발까지 걸리는 시간 S와 학교까지 가는 시간 T가 공백을 사이에 두고 주어진다.',
      E'학교에 X분 이내로 도착할 수 없다면 -1을 출력한다.\n도착할 수 있다면, 가장 늦게 출발하는 버스가 출발할 때까지 걸리는 시간을 출력한다.',
      12,
      '자체 제작',
      E'3 200\n5 10\n20 30\n100 100',
      '100',
      '정보올림피아드 입문',
      100,
      '{"수학","구현","정렬"}',
      '[{"no":1,"points":10,"desc":"N = 1"},{"no":2,"points":15,"desc":"모든 버스는 X분 이내로 도착"},{"no":3,"points":30,"desc":"모든 버스에 대해 T = 20"},{"no":4,"points":45,"desc":"추가 제약 조건 없음"}]'::jsonb
    ) returning id into new_id;

    insert into public.test_cases (problem_id, stdin, stdout, is_hidden, subtask) values
      (new_id, E'1 50\n10 20',                         '10',  false, 1),
      (new_id, E'1 30\n10 25',                         '-1',  true,  1),
      (new_id, E'1 30\n10 20',                         '10',  true,  1),
      (new_id, E'3 200\n5 10\n20 30\n100 100',         '100', false, 2),
      (new_id, E'2 100\n10 20\n30 40',                 '30',  true,  2),
      (new_id, E'4 200\n1 1\n2 2\n3 3\n50 50',         '50',  true,  2),
      (new_id, E'3 60\n5 20\n40 20\n80 20',            '40',  false, 3),
      (new_id, E'2 30\n50 20\n90 20',                  '-1',  true,  3),
      (new_id, E'3 40\n10 20\n20 20\n5 20',            '20',  true,  3),
      (new_id, E'3 30\n5 10\n100 100',                 '5',   true,  4),
      (new_id, E'5 100\n10 80\n50 60\n90 5\n30 70\n100 100', '90', true, 4),
      (new_id, E'2 10\n50 60\n90 30',                  '-1',  true,  4);
  end if;
end $$;

-- ============================================================
--  End of migration 021
-- ============================================================
