import Link from "next/link";
import { getTierInfo } from "@/lib/tiers";

interface UserNameProps {
  username: string;
  tier?: number;
  link?: boolean;
  className?: string;
}

/**
 * Renders a username colored by the user's tier (solved.ac style).
 * Optionally wraps it in a link to the user's profile.
 */
export default function UserName({
  username,
  tier = 0,
  link = true,
  className = "",
}: UserNameProps) {
  const info = getTierInfo(tier);
  const color = info.tier === 0 ? "#5f6368" : info.color;

  const inner = (
    <span
      className={`font-semibold ${className}`}
      style={{ color }}
      title={info.tier === 0 ? "언레이티드" : info.nameKo}
    >
      {username}
    </span>
  );

  if (!link) return inner;
  return (
    <Link
      href={`/users/${encodeURIComponent(username)}`}
      className="hover:underline"
    >
      {inner}
    </Link>
  );
}
