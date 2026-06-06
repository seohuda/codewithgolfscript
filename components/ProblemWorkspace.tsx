"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import Leaderboard from "@/components/Leaderboard";

interface ProblemWorkspaceProps {
  problemId: number;
}

/**
 * Client-side coordinator. When the editor reports an Accepted
 * submission, it bumps a refresh key so the Leaderboard refetches.
 */
export default function ProblemWorkspace({
  problemId,
}: ProblemWorkspaceProps) {
  const [refreshKey, setRefreshKey] = useState<number>(0);

  return (
    <div className="space-y-8">
      <CodeEditor
        problemId={problemId}
        onAccepted={() => setRefreshKey((k) => k + 1)}
      />
      <Leaderboard problemId={problemId} refreshKey={refreshKey} />
    </div>
  );
}
