import { motion } from "framer-motion";

interface MacroRingProps {
  current: number;
  target: number;
  label: string;
  unit: string;
  color?: string;
  size?: number;
}

export function MacroRing({
  current,
  target,
  label,
  unit,
  color = "#27AE60",
  size = 120
}: MacroRingProps) {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-secondary"
          />
          {/* Progress Ring */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-display" style={{ color }}>{current}</span>
          <span className="text-xs text-muted-foreground">/ {target} {unit}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
