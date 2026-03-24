import { motion } from "framer-motion";

interface QualityScoreProps {
  score: number;
  label?: string;
}

export function QualityScore({ score, label = "Code Quality" }: QualityScoreProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-muted" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none" strokeWidth="6"
            strokeLinecap="round"
            className={`${color.replace("text-", "stroke-")}`}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
