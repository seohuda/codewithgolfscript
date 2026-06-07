"use client";

interface ActivityGraphProps {
  activity: Record<string, number>; // "YYYY-MM-DD" -> count
  weeks?: number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function levelColor(count: number): string {
  if (count <= 0) return "rgb(var(--surface-variant))";
  if (count >= 8) return "rgb(var(--primary))";
  if (count >= 5) return "rgb(var(--primary) / 0.8)";
  if (count >= 3) return "rgb(var(--primary) / 0.6)";
  if (count >= 1) return "rgb(var(--primary) / 0.35)";
  return "rgb(var(--surface-variant))";
}

export default function ActivityGraph({
  activity,
  weeks = 17,
}: ActivityGraphProps) {
  // Build a grid ending today, going back `weeks` weeks (columns = weeks).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Start on the Sunday `weeks` weeks ago.
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const columns: { date: Date; count: number }[][] = [];
  const cursor = new Date(start);
  let total = 0;
  for (let w = 0; w < weeks; w++) {
    const col: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const count = activity[dayKey(cursor)] ?? 0;
      if (cursor <= today) total += count;
      col.push({ date: new Date(cursor), count: cursor <= today ? count : -1 });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">활동</h2>
        <span className="text-xs text-ink-faint">
          최근 {weeks}주 · 제출 {total}회
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell, di) =>
                cell.count < 0 ? (
                  <div key={di} className="h-3 w-3" />
                ) : (
                  <div
                    key={di}
                    title={`${dayKey(cell.date)} · 제출 ${cell.count}회`}
                    className="h-3 w-3 rounded-[2px]"
                    style={{ background: levelColor(cell.count) }}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ink-faint">
        <span>적음</span>
        {[0, 1, 3, 5, 8].map((n) => (
          <span
            key={n}
            className="h-3 w-3 rounded-[2px]"
            style={{ background: levelColor(n) }}
          />
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}
