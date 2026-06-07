"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RandomProblemButton({
  className = "btn-outlined",
}: {
  className?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const qs = user ? "?unsolvedOnly=1" : "";
      const res = await fetch(`/api/problems/random${qs}`, {
        cache: "no-store",
      });
      const d = await res.json();
      if (res.ok && d.id) {
        router.push(`/problems/${d.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={go} disabled={loading} className={className}>
      {loading ? "고르는 중…" : "랜덤 문제"}
    </button>
  );
}
