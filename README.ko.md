# CODE WITH GOLF - GolfScript online judge

이 문서는 [`README.md`](README.md)의 한국어 번역본입니다.

사이트: https://golfscript.xyz

GolfScript 전용 숏코딩 저지입니다. 제출한 솔루션은 **정확한 UTF-8 바이트 수** 기준으로 순위가 매겨지며, 바이트 수가 적을수록 유리합니다.

## 기술 스택

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** - Gemini 스타일의 심해 다크 UI와 오로라 네온 포인트
- **Supabase** (PostgreSQL) - 데이터 저장 + Row Level Security
- **Piston** 공개 API - GolfScript 코드 실행

## 설정

1. **의존성 설치**

   ```bash
   npm install
   ```

2. **Supabase 설정**

   환경 변수 템플릿을 복사한 뒤 프로젝트 값으로 채웁니다.

   ```bash
   cp .env.example .env.local
   ```

   | 변수 | 위치 | 설명 |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 + 서버 | 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | 익명 공개 키 |
   | `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | 숨겨진 테스트케이스를 읽기 위해 RLS를 우회합니다. 절대 노출하지 마세요. |
   | `PISTON_API_URL` | 서버 | 기본값은 `https://emkc.org/api/v2/execute` 입니다. |

3. **스키마 생성**

   Supabase SQL Editor에서 [`sql/schema.sql`](sql/schema.sql)을 실행합니다. 이 스크립트는 4개 테이블, `leaderboard` 뷰, RLS 정책, 그리고 샘플 + 숨겨진 테스트케이스가 포함된 3개 문제 시드를 생성합니다.

4. **실행**

   ```bash
   npm run dev
   ```

## 보안 모델

- `test_cases`에는 **SELECT RLS 정책이 없습니다.** 따라서 anon 클라이언트는 절대 해당 데이터를 읽을 수 없습니다.
- 제출 API는 서버 측에서만 `lib/supabaseAdmin.ts`의 **service role** 클라이언트를 사용해, 숨겨진 케이스를 포함한 모든 테스트케이스를 조회합니다.
- API 응답에는 각 케이스에 대해 `{ index, hidden, verdict }`만 노출되며, 숨겨진 stdin/stdout은 **브라우저로 전송되지 않습니다.**

## 채점 흐름 (`app/api/submit/route.ts`)

1. 원본 코드의 정확한 UTF-8 바이트 수를 계산합니다.
2. 사용자를 찾거나 생성하고, 문제 유효성을 확인합니다.
3. 모든 테스트케이스를 서버 전용으로 가져옵니다.
4. 각 케이스를 Piston에서 병렬 실행합니다.
5. 출력 결과를 trim한 뒤 비교하여 `AC` / `WA` 를 결정하고, 신호/종료 코드에 따라 `TLE` / `RE` / `CE` 로 매핑합니다.
6. 최종 verdict를 집계해 `submissions`에 저장하고 결과를 반환합니다.
