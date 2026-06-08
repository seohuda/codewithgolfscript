import Link from "next/link";

export const metadata = {
  title: "GolfScript 배우기",
  description:
    "GolfScript 기초부터 코드 골프 테크닉까지. 스택 기반 언어를 예제로 배워 보세요.",
};

interface Op {
  sym: string;
  desc: string;
  ex?: string;
  out?: string;
}

function OpTable({ rows }: { rows: Op[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-surface-dim text-left text-xs font-semibold text-ink-soft">
            <th className="w-16 px-4 py-2.5">기호</th>
            <th className="px-4 py-2.5">설명</th>
            <th className="hidden px-4 py-2.5 sm:table-cell">예시</th>
            <th className="hidden px-4 py-2.5 sm:table-cell">결과</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-surface-border last:border-0 hover:bg-surface-dim"
            >
              <td className="px-4 py-2.5 font-mono font-bold text-accent">
                {r.sym}
              </td>
              <td className="px-4 py-2.5 text-ink-soft">{r.desc}</td>
              <td className="hidden px-4 py-2.5 font-mono text-xs text-ink sm:table-cell">
                {r.ex ?? ""}
              </td>
              <td className="hidden px-4 py-2.5 font-mono text-xs text-ink-faint sm:table-cell">
                {r.out ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Example({ code, result, note }: { code: string; result: string; note?: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <code className="font-mono text-sm text-ink">{code}</code>
        <span className="font-mono text-sm text-success">→ {result}</span>
      </div>
      {note && (
        <p className="border-t border-surface-border px-4 py-2 text-xs text-ink-faint">
          {note}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function LearnPage() {
  return (
    <div className="animate-fade-in space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-ink">GolfScript 배우기</h1>
        <p className="text-sm text-ink-soft">
          GolfScript는 코드를 최대한 짧게 쓰는 데 특화된 스택 기반 언어입니다.
          값이 스택에 쌓이고, 연산자가 스택에서 값을 꺼내 계산한 뒤 결과를 다시
          올립니다. 아래 내용을 따라가며 직접 문제에 적용해 보세요.
        </p>
      </header>

      <Section title="1. 스택이 핵심입니다">
        <p className="text-sm text-ink-soft">
          모든 값은 스택에 쌓입니다. 숫자나 문자열을 쓰면 스택에 올라가고,
          연산자는 스택 위의 값들을 꺼내 계산합니다. 프로그램이 끝나면 스택에
          남은 값이 모두 출력됩니다.
        </p>
        <Example
          code="5 3 +"
          result="8"
          note="5와 3을 스택에 올리고, +가 둘을 꺼내 더한 8을 올립니다. 끝에 8이 출력됩니다."
        />
        <Example
          code='"Hello"'
          result="Hello"
          note="문자열도 그대로 스택에 올라가 출력됩니다."
        />
      </Section>

      <Section title="2. 입력 다루기">
        <p className="text-sm text-ink-soft">
          표준 입력 전체가 처음에 <span className="font-mono">문자열</span> 하나로
          스택에 올라옵니다. 숫자로 계산하려면{" "}
          <span className="font-mono text-accent">~</span> (eval) 로 평가해야
          합니다.
        </p>
        <Example
          code="~ 2 *"
          result="42"
          note='입력이 "21"일 때: ~로 숫자 21로 만들고 2를 곱해 42.'
        />
        <Example
          code="~ 2 %"
          result="1"
          note='입력이 "7"일 때: 7을 2로 나눈 나머지 1 (홀짝 판별에 활용).'
        />
      </Section>

      <Section title="3. 기본 연산자">
        <OpTable
          rows={[
            { sym: "+", desc: "더하기 (문자열/배열은 이어붙이기)", ex: "5 3+", out: "8" },
            { sym: "-", desc: "빼기", ex: "5 3-", out: "2" },
            { sym: "*", desc: "곱하기 (문자열/배열은 반복)", ex: "5 3*", out: "15" },
            { sym: "/", desc: "나누기 (몫)", ex: "7 2/", out: "3" },
            { sym: "%", desc: "나머지", ex: "7 2%", out: "1" },
            { sym: "~", desc: "eval / 비트반전", ex: '"5"~', out: "5" },
          ]}
        />
      </Section>

      <Section title="4. 스택 조작">
        <OpTable
          rows={[
            { sym: ".", desc: "맨 위 값 복제", ex: "5.", out: "55" },
            { sym: "\\", desc: "위 두 값 자리 바꾸기(swap)", ex: "1 2\\", out: "21" },
            { sym: ";", desc: "맨 위 값 버리기", ex: "1 2;", out: "1" },
            { sym: ":", desc: "변수에 저장 (예: :x)", ex: "5:x;x x*", out: "25" },
          ]}
        />
        <Example
          code="5 :x; x x *"
          result="25"
          note=":x로 5를 변수 x에 저장(;로 스택 정리), x를 두 번 올려 곱하면 25."
        />
      </Section>

      <Section title="5. 배열과 범위">
        <OpTable
          rows={[
            { sym: ",", desc: "숫자 n → [0..n-1] 배열 / 배열 → 길이", ex: "5,", out: "01234" },
            { sym: "[ ]", desc: "배열 묶기", ex: "[1 2 3]", out: "123" },
            { sym: "<", desc: "비교 또는 앞부분 자르기", ex: "3 4<", out: "1" },
            { sym: "=", desc: "같은지 비교 / 인덱스 접근", ex: "3 3=", out: "1" },
          ]}
        />
        <Example
          code='"hello" ,'
          result="5"
          note="문자열에 , 를 쓰면 길이가 나옵니다."
        />
      </Section>

      <Section title="6. 블록과 반복">
        <p className="text-sm text-ink-soft">
          <span className="font-mono">{"{ }"}</span> 로 묶은 코드 덩어리(블록)는
          나중에 실행됩니다. 배열과 함께 쓰면 강력합니다:
        </p>
        <OpTable
          rows={[
            { sym: "{}%", desc: "map: 각 원소에 블록 적용", ex: "5,{)}%", out: "12345" },
            { sym: "{}*", desc: "fold: 누적 적용 (합/곱 등)", ex: "5,{+}*", out: "10" },
            { sym: "{}/", desc: "each: 각 원소에 대해 실행", ex: "", out: "" },
            { sym: ")", desc: "1 더하기 (또는 배열 마지막 떼기)", ex: "5)", out: "6" },
            { sym: "(", desc: "1 빼기 (또는 배열 첫 원소 떼기)", ex: "5(", out: "4" },
          ]}
        />
        <Example
          code="~ ) , { + } *"
          result="5050"
          note='입력이 "100"일 때: 1부터 100까지의 합. )로 101, ,로 [0..100], {+}*로 모두 더함.'
        />
      </Section>

      <Section title="7. 문자열 테크닉">
        <OpTable
          rows={[
            { sym: '"abc"-1%', desc: "문자열 뒤집기", ex: '"abc"-1%', out: "cba" },
            { sym: 'n', desc: "줄바꿈 문자", ex: "", out: "" },
            { sym: "*", desc: "문자열 반복", ex: '"ab"3*', out: "ababab" },
          ]}
        />
        <Example
          code='"abc" -1 %'
          result="cba"
          note="-1 스텝으로 거꾸로 훑어 뒤집습니다."
        />
      </Section>

      <Section title="8. 골프 팁">
        <ul className="card list-disc space-y-2 p-5 pl-9 text-sm text-ink-soft">
          <li>공백은 가능한 한 줄이세요. 숫자와 연산자 사이 외엔 대부분 생략 가능합니다.</li>
          <li>
            출력은 스택에 남은 값으로 자동 처리됩니다.{" "}
            <span className="font-mono">print</span> 를 따로 쓸 필요가 거의 없어요.
          </li>
          <li>
            <span className="font-mono">~</span>,{" "}
            <span className="font-mono">.</span>,{" "}
            <span className="font-mono">\\</span> 같은 1글자 연산자를 적극 활용하세요.
          </li>
          <li>변수 저장보다 스택 조작이 더 짧은 경우가 많습니다.</li>
        </ul>
      </Section>

      <section className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">이제 직접 풀어 볼까요?</h2>
          <p className="mt-1 text-sm text-ink-soft">
            단계별 학습으로 쉬운 문제부터 차근차근 도전하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/steps" className="btn-filled">
            단계별로 풀기
          </Link>
          <Link href="/problems" className="btn-outlined">
            전체 문제
          </Link>
        </div>
      </section>
    </div>
  );
}
