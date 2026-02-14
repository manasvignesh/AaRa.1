import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

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
  color = "hsl(var(--primary))",
  size = 140
}: MacroRingProps) {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center group">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Shadow/Glow Background */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-30"
          style={{ backgroundColor: color }}
        />

        {/* SVG Container */}
        <svg className="w-full h-full transform -rotate-90 perspective-1000">
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="white"
            strokeWidth="6"
            fill="transparent"
            className="opacity-[0.05]"
          />
          {/* Progress Ring with Glow */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 6px ${color})`
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-display font-bold tracking-tighter" style={{ color }}>
            <CountUp value={current} />
          </div>
          <div className="text-[10px] uppercase tracking-widest font-mono opacity-50">
            {label}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
        <span className="text-[10px] font-mono opacity-40">TARGET</span>
        <span className="text-[11px] font-bold tracking-tight">{target}{unit}</span>
      </div>
    </div>
  );
}
