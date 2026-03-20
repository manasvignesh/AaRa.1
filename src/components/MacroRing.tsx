import { motion } from "framer-motion";
import { useTheme } from "next-themes";

interface MacroRingProps {
  caloriesTarget: number;
  caloriesCurrent: number;
  proteinTarget: number;
  proteinCurrent: number;
  size?: number;
  strokeWidth?: number;
}

export function MacroRing({
  caloriesTarget,
  caloriesCurrent,
  proteinTarget,
  proteinCurrent,
  size = 88,
  strokeWidth = 8,
}: MacroRingProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, (caloriesCurrent / caloriesTarget) * 100) || 0;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(47,128,237,0.1)"}
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isDark ? "#E8A93A" : "#2F80ED"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* Center text - percentage */}
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="16"
        fontWeight="700"
        fill={isDark ? "#EDE9E1" : "#1E2A3A"}
        className="font-display"
      >
        {Math.round(progress)}%
      </text>
      {/* Center text - label */}
      <text
        x={size / 2}
        y={size / 2 + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="600"
        letterSpacing="0.1em"
        fill={isDark ? "#6B7280" : "#8AA5BE"}
      >
        DAILY GOAL
      </text>
    </svg>
  );
}
