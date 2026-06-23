# CODE WITH GOLF - GolfScript online judge

A GolfScript-only short-coding judge. Solutions are ranked by **exact UTF-8 byte size** — fewest bytes wins.

Site: https://golfscript.xyz

한국어로 읽기: [README.ko.md](README.ko.md)

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** — Gemini-style deep-sea dark UI with aurora neon accents
- **Supabase** (PostgreSQL) — data + Row Level Security
- **Piston** public API — GolfScript code execution

## File Structure

```text
app/        # routes, pages, route handlers, metadata, OG images
components/ # shared UI components
lib/        # domain logic, integrations, utilities
scripts/    # seed/verification/build helpers
sql/        # Supabase schema and seed SQL
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   Copy the env template and fill in your project values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | client + server | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS to read hidden test cases. Never expose this. |
   | `PISTON_API_URL` | server | Defaults to `https://emkc.org/api/v2/execute` |

3. **Create the schema**

   In the Supabase SQL Editor, run [`sql/schema.sql`](sql/schema.sql). It creates the four tables, the `leaderboard` view, RLS policies, and seed data (3 problems with sample + hidden cases).

4. **Run**

   ```bash
   npm run dev
   ```

## Security model

- `test_cases` has **no SELECT RLS policy**, so the anon client can never read it.
- The submit API uses the **service role** client (`lib/supabaseAdmin.ts`) server-side only to fetch every test case, including hidden ones.
- The API response exposes only `{ index, hidden, verdict }` per case — hidden stdin/stdout are **never** sent to the browser.

## Judging flow (`app/api/submit/route.ts`)

1. Compute exact UTF-8 byte size of the raw code.
2. Resolve/create the user, verify the problem.
3. Fetch all test cases (server-only).
4. Run each case in parallel on Piston.
5. Compare trimmed stdout → `AC` / `WA`; map signals/exit codes → `TLE` / `RE` / `CE`.
6. Aggregate the final verdict, insert into `submissions`, return the result.
