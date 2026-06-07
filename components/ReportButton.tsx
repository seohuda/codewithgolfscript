"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

interface Props {
  targetType: "post" | "comment";
  targetId: number;
}

export default function ReportButton({ targetType, targetId }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user) return null;

  async function submit() {
    setSending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
        }),
      });
      if (res.ok) {
        setDone(true);
        setOpen(false);
      }
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return <span className="text-xs text-ink-faint">신고됨</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-faint hover:text-danger"
      >
        신고
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border border-surface-border bg-surface p-5">
            <h3 className="text-sm font-bold text-ink">신고하기</h3>
            <p className="mt-1 text-xs text-ink-faint">
              신고 사유를 적어 주세요 (선택).
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="예: 욕설/스팸/도배"
              className="field mt-3 resize-y"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="btn-outlined px-3 py-1.5 text-xs"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={sending}
                className="btn-filled px-3 py-1.5 text-xs"
              >
                {sending ? "전송 중…" : "신고"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
