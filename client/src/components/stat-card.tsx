import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  iconColor?: string;
  className?: string;
  "data-testid"?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = "text-foreground",
  className,
  "data-testid": testId,
}: StatCardProps) {
  return (
    <Card className={className} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg bg-muted", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
