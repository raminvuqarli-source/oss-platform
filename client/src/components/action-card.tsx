import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  badge?: number;
  accentColor?: string;
  onClick: () => void;
  testId?: string;
}

export function ActionCard({
  icon: Icon,
  label,
  description,
  badge,
  accentColor = "bg-primary",
  onClick,
  testId,
}: ActionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      data-testid={testId}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative w-full h-full min-h-[160px] rounded-2xl bg-card border border-border/50 p-6 flex flex-col items-start justify-between text-left overflow-hidden group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-200"
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/4 group-hover:to-transparent transition-all duration-300 rounded-2xl" />

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 min-w-[24px] h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10 shadow-md"
          data-testid={`badge-${testId}`}
        >
          {badge > 99 ? "99+" : badge}
        </motion.span>
      )}

      {/* Icon */}
      <div className={`${accentColor} p-3.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
        <Icon className="h-6 w-6 text-white" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="space-y-0.5 z-10">
        <p className="font-semibold text-base text-foreground leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-snug">{description}</p>
        )}
      </div>
    </motion.button>
  );
}
