import { motion } from "framer-motion";

interface MacroRingProps {
  caloriesTarget: number;
  caloriesCurrent: number;
  proteinTarget: number;
  proteinCurrent: number;
  size?: number;
}

export function MacroRing({
  caloriesTarget,
  caloriesCurrent,
  proteinTarget,
  proteinCurrent,
  size = 180,
}: MacroRingProps) {
  const strokeWidth = 12;
  const gap = 4;

  const caloriesPercentage = Math.min(100, (caloriesCurrent / caloriesTarget) * 100);
  const proteinPercentage = Math.min(100, (proteinCurrent / proteinTarget) * 100);

  const center = size / 2;
  const caloriesRadius = (size / 2) - (strokeWidth / 2);
  const proteinRadius = caloriesRadius - strokeWidth - gap;

  const caloriesCircumference = 2 * Math.PI * caloriesRadius;
  const proteinCircumference = 2 * Math.PI * proteinRadius;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Calories Track */}
        <circle
          cx={center}
          cy={center}
          r={caloriesRadius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100"
        />
        {/* Calories Indicator */}
        <motion.circle
          initial={{ strokeDashoffset: caloriesCircumference }}
          animate={{ strokeDashoffset: caloriesCircumference - (caloriesPercentage / 100) * caloriesCircumference }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          cx={center}
          cy={center}
          r={caloriesRadius}
          stroke="hsl(var(--brand-blue))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          style={{ strokeDasharray: caloriesCircumference }}
        />

        {/* Protein Track */}
        <circle
          cx={center}
          cy={center}
          r={proteinRadius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100"
        />
        {/* Protein Indicator */}
        <motion.circle
          initial={{ strokeDashoffset: proteinCircumference }}
          animate={{ strokeDashoffset: proteinCircumference - (proteinPercentage / 100) * proteinCircumference }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          cx={center}
          cy={center}
          r={proteinRadius}
          stroke="hsl(var(--brand-green))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          style={{ strokeDasharray: proteinCircumference }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold tracking-tight text-slate-800">
            {Math.round(caloriesPercentage)}%
          </span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Daily Goal</span>
        </div>
      </div>
    </div>
  );
}
