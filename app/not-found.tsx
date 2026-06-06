import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <p className="aurora-text font-mono text-6xl font-bold">404</p>
      <h1 className="text-xl font-medium text-mist">Problem not found</h1>
      <p className="max-w-sm text-sm text-mist-soft">
        This problem does not exist, or the database has not been seeded yet.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-aurora-indigo/40 px-4 py-2 text-sm text-mist transition-colors hover:bg-aurora-indigo/10 hover:text-white"
      >
        Back to problems
      </Link>
    </div>
  );
}
