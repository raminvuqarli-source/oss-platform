import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  badge?: number;
  accentColor?: string;
  glowColor?: string;
  onClick: () => void;
  testId?: string;
}

export function ActionCard({
  icon: Icon,
  label,
  description,
  badge,
  accentColor = "bg-primary",
  glowColor,
  onClick,
  testId,
}: ActionCardProps) {
  const hasAlert = badge !== undefined && badge > 0;

  return (
    <motion.button
      onClick={onClick}
      data-testid={testId}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={`
        relative w-full h-full min-h-[156px] rounded-2xl bg-card border text-left overflow-hidden group
        flex flex-col items-start justify-between p-5
        transition-all duration-200
        ${hasAlert
          ? "border-primary/40 shadow-lg shadow-primary/10"
          : "border-border/50 hover:border-primary/25 hover:shadow-xl hover:shadow-black/5"
        }
      `}
    >
      {/* Glow background when badge active */}
      {hasAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 ${glowColor || "bg-primary/5"} rounded-2xl`}
        />
      )}

      {/* Hover gradient (always subtle) */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-primary/3 group-hover:to-transparent transition-all duration-300 rounded-2xl" />

      {/* Alert pulse ring (when active) */}
      {hasAlert && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/25"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Badge */}
      {hasAlert && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute top-3.5 right-3.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center z-10 shadow-md"
          data-testid={`badge-${testId}`}
        >
          {badge > 99 ? "99+" : badge}
        </motion.span>
      )}

      {/* Icon block */}
      <div
        className={`${accentColor} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200 ${hasAlert ? "shadow-md" : ""}`}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2.1} />
      </div>

      {/* Label + description */}
      <div className="space-y-0.5 z-10 w-full pr-6">
        <p className="font-semibold text-[13.5px] leading-snug text-foreground break-words hyphens-auto">
          {label}
        </p>
        {description && (
          <p className="text-[11.5px] text-muted-foreground leading-snug line-clamp-2 break-words">
            {description}
          </p>
        )}
      </div>
    </motion.button>
  );
}
