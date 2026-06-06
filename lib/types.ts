export type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE" | "PENDING";

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  input_desc: string;
  output_desc: string;
  tier?: number;
  source?: string;
  sample_input?: string;
  sample_output?: string;
  created_at: string;
}

export interface TestCase {
  id: number;
  problem_id: number;
  stdin: string;
  stdout: string;
  is_hidden: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: number;
  code: string;
  bytes: number;
  verdict: Verdict;
  created_at: string;
}

export interface LeaderboardRow {
  problem_id: number;
  user_id: string;
  username: string;
  bytes: number;
  created_at: string;
  rank: number;
}

export interface CaseResult {
  index: number;
  hidden: boolean;
  verdict: Verdict;
}

export interface SubmitRequestBody {
  problemId: number;
  code: string;
}

export interface SubmitResponse {
  submissionId: string | null;
  verdict: Verdict;
  bytes: number;
  passed: number;
  total: number;
  results: CaseResult[];
  message?: string;
}
