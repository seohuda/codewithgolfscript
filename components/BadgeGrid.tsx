"use client";

interface Badge {
  id: string;
  name: string;
  desc: string;
  earned: boolean;
}

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  if (!badges || badges.length === 0) return null;
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">뱃지</h2>
        <span className="text-xs text-ink-faint">
          {earnedCount} / {badges.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.id}
            title={b.desc}
            className={`flex items-center gap-2 border p-3 ${
              b.earned
                ? "border-accent/40 bg-accent/5"
                : "border-surface-border opacity-50"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold ${
                b.earned ? "bg-accent text-white" : "bg-surface-variant text-ink-faint"
              }`}
            >
              {b.earned ? "★" : "·"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{b.name}</p>
              <p className="truncate text-[11px] text-ink-faint">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
