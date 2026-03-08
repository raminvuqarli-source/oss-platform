import { Badge } from "@/components/ui/badge";

// Priority level display for tasks and service requests across all roles

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const priorityTextColors: Record<string, string> = {
  low: "text-green-500",
  normal: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

interface PriorityBadgeProps {
  priority: string;
  "data-testid"?: string;
}

export function PriorityBadge({ priority, "data-testid": testId }: PriorityBadgeProps) {
  return (
    <Badge className={`text-xs ${priorityColors[priority] || priorityColors.normal}`} data-testid={testId}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

export function getPriorityColor(priority: string): string {
  return priorityColors[priority] || priorityColors.normal;
}

export function getPriorityTextColor(priority: string): string {
  return priorityTextColors[priority] || priorityTextColors.normal;
}
