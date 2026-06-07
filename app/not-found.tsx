import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="text-xl font-semibold text-ink">페이지를 찾을 수 없습니다</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        존재하지 않는 페이지이거나, 아직 등록되지 않았습니다.
      </p>
      <Link href="/" className="btn-outlined">
        홈으로
      </Link>
    </div>
  );
}
