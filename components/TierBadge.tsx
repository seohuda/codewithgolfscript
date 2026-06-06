import { getTierInfo } from "@/lib/tiers";

interface TierBadgeProps {
  tier: number;
  showName?: boolean;
  size?: "sm" | "md";
}

/**
 * solved.ac-style tier badge: a small diamond/shield mark colored by
 * tier group, optionally followed by the Korean tier name.
 */
export default function TierBadge({
  tier,
  showName = false,
  size = "md",
}: TierBadgeProps) {
  const info = getTierInfo(tier);
  const dim = size === "sm" ? 14 : 18;

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <polygon
          points="12,2 22,9 12,22 2,9"
          fill={info.color}
          stroke={info.color}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {info.tier > 0 && (
          <text
            x="12"
            y="13.5"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#ffffff"
            fontFamily="system-ui, sans-serif"
          >
            {info.roman}
          </text>
        )}
      </svg>
      {showName && (
        <span
          className={size === "sm" ? "text-xs" : "text-sm"}
          style={{ color: info.color, fontWeight: 600 }}
        >
          {info.nameKo}
        </span>
      )}
    </span>
  );
}
