"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

type Status = "solved" | "tried" | "none";

export default function ProblemStatusBadge({
  problemId,
}: {
  problemId: number;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("none");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setStatus("none");
        return;
      }
      try {
        const res = await fetch("/api/me/solved", { cache: "no-store" });
        const d = await res.json();
        if (cancelled) return;
        if ((d.solved ?? []).includes(problemId)) setStatus("solved");
        else if ((d.tried ?? []).includes(problemId)) setStatus("tried");
        else setStatus("none");
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, problemId]);

  if (!user || status === "none") return null;

  if (status === "solved") {
    return (
      <span className="chip border-success/30 bg-success/10 text-success">
        맞은 문제
      </span>
    );
  }
  return (
    <span className="chip border-danger/30 bg-danger/10 text-danger">
      시도함
    </span>
  );
}
