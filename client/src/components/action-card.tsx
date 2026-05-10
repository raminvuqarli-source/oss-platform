import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

const COLOR_MAP: Record<string, { accent: string; glow: string; ring: string }> = {
  orange: { accent: "bg-orange-500", glow: "bg-orange-500/6", ring: "border-orange-400/30" },
  blue:   { accent: "bg-blue-500",   glow: "bg-blue-500/6",   ring: "border-blue-400/30"   },
  green:  { accent: "bg-emerald-500",glow: "bg-emerald-500/6",ring: "border-emerald-400/30"},
  purple: { accent: "bg-violet-500", glow: "bg-violet-500/6", ring: "border-violet-400/30" },
  red:    { accent: "bg-red-500",    glow: "bg-red-500/6",    ring: "border-red-400/30"    },
};

interface ActionCardProps {
  icon: LucideIcon | React.ElementType;
  label: string;
  description?: string;
  sublabel?: string;
  badge?: number | string;
  accentColor?: string;
  glowColor?: string;
  color?: keyof typeof COLOR_MAP;
  onClick: () => void;
  testId?: string;
  "data-testid"?: string;
}

export function ActionCard({
  icon: Icon,
  label,
  description,
  sublabel,
  badge,
  accentColor,
  glowColor,
  color,
  onClick,
  testId,
  "data-testid": dataTestId,
}: ActionCardProps) {
  const resolved = color ? COLOR_MAP[color] : null;
  const finalAccent  = accentColor ?? resolved?.accent ?? "bg-primary";
  const finalGlow    = glowColor   ?? resolved?.glow   ?? "bg-primary/5";
  const finalRing    = resolved?.ring ?? "border-primary/25";
  const desc = sublabel ?? description;

  const hasAlert = badge !== undefined && (typeof badge === "number" ? badge > 0 : badge.length > 0);
  const badgeText = typeof badge === "number"
    ? (badge > 99 ? "99+" : String(badge))
    : badge;

  return (
    <motion.button
      onClick={onClick}
      data-testid={dataTestId ?? testId}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={`
        relative w-full h-full min-h-[156px] rounded-2xl bg-card border text-left overflow-hidden group
        flex flex-col items-start justify-between p-5
        transition-all duration-200
        ${hasAlert
          ? `border-primary/40 shadow-lg shadow-primary/10`
          : "border-border/50 hover:border-primary/25 hover:shadow-xl hover:shadow-black/5"
        }
      `}
    >
      {hasAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 ${finalGlow} rounded-2xl`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-primary/3 group-hover:to-transparent transition-all duration-300 rounded-2xl" />

      {hasAlert && (
        <motion.div
          className={`absolute inset-0 rounded-2xl border-2 ${finalRing}`}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {hasAlert && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute top-3.5 right-3.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center z-10 shadow-md"
          data-testid={`badge-${dataTestId ?? testId}`}
        >
          {badgeText}
        </motion.span>
      )}

      <div
        className={`${finalAccent} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200 ${hasAlert ? "shadow-md" : ""}`}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2.1} />
      </div>

      <div className="space-y-0.5 z-10 w-full pr-6">
        <p className="font-semibold text-[13.5px] leading-snug text-foreground break-words hyphens-auto">
          {label}
        </p>
        {desc && (
          <p className="text-[11.5px] text-muted-foreground leading-snug line-clamp-2 break-words">
            {desc}
          </p>
        )}
      </div>
    </motion.button>
  );
}
