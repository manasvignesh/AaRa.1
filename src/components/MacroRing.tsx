import { motion } from "framer-motion";

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
  size = 240,
  strokeWidth = 20
}: MacroRingProps) {
  const caloriesPercentage = Math.min(100, (caloriesCurrent / caloriesTarget) * 100);
  const proteinPercentage = Math.min(100, (proteinCurrent / proteinTarget) * 100);

  const center = size / 2;
  const caloriesRadius = (size / 2) - (strokeWidth / 2);
  const proteinRadius = caloriesRadius - strokeWidth - 4;

  const caloriesCircumference = 2 * Math.PI * caloriesRadius;
  const proteinCircumference = 2 * Math.PI * proteinRadius;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Calories Background */}
        <circle
          cx={center}
          cy={center}
          r={caloriesRadius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-primary/10"
        />
        {/* Calories Ring */}
        <motion.circle
          initial={{ strokeDashoffset: caloriesCircumference }}
          animate={{ strokeDashoffset: caloriesCircumference - (caloriesPercentage / 100) * caloriesCircumference }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={center}
          cy={center}
          r={caloriesRadius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          style={{ strokeDasharray: caloriesCircumference }}
        />

        {/* Protein Background */}
        <circle
          cx={center}
          cy={center}
          r={proteinRadius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-brand-green/10"
        />
        {/* Protein Ring */}
        <motion.circle
          initial={{ strokeDashoffset: proteinCircumference }}
          animate={{ strokeDashoffset: proteinCircumference - (proteinPercentage / 100) * proteinCircumference }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
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
        <span className="text-4xl font-black tracking-tighter text-foreground">
          {Math.round(caloriesPercentage)}%
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Daily Progress</span>
      </div>
    </div>
  );
}
