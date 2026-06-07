"use client";

import { useEffect, useState } from "react";

interface SolvedData {
  solved: Set<number>;
  tried: Set<number>;
}

let cache: SolvedData | null = null;
let inflight: Promise<SolvedData> | null = null;

async function fetchSolved(): Promise<SolvedData> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/me/solved", { cache: "no-store" });
      const d = await res.json();
      cache = {
        solved: new Set<number>(d.solved ?? []),
        tried: new Set<number>(d.tried ?? []),
      };
    } catch {
      cache = { solved: new Set(), tried: new Set() };
    }
    inflight = null;
    return cache;
  })();
  return inflight;
}

/** Clears the cache (e.g. after a new accepted submission). */
export function clearSolvedCache() {
  cache = null;
  inflight = null;
}

export function useSolved(): SolvedData {
  const [data, setData] = useState<SolvedData>(
    cache ?? { solved: new Set(), tried: new Set() },
  );
  useEffect(() => {
    let cancelled = false;
    fetchSolved().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
