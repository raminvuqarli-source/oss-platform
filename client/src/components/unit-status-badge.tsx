import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const statusI18nKeys: Record<string, string> = {
  available: "roomStatus.ready",
  ready: "roomStatus.ready",
  occupied: "roomStatus.occupied",
  maintenance: "roomStatus.maintenance",
  cleaning: "roomStatus.cleaning",
  dirty: "roomStatus.dirty",
  out_of_service: "roomStatus.outOfService",
  out_of_order: "roomStatus.outOfOrder",
};

const statusFallbacks: Record<string, string> = {
  available: "Ready",
  ready: "Ready",
  occupied: "Occupied",
  maintenance: "Maintenance",
  cleaning: "Cleaning",
  dirty: "Dirty",
  out_of_service: "Out of Service",
  out_of_order: "Out of Order",
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ready: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  occupied: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  maintenance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  cleaning: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  dirty: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  out_of_service: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  out_of_order: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

interface UnitStatusBadgeProps {
  status: string;
  "data-testid"?: string;
}

export function UnitStatusBadge({ status, "data-testid": testId }: UnitStatusBadgeProps) {
  const { t } = useTranslation();
  const key = statusI18nKeys[status];
  const label = key ? t(key, statusFallbacks[status] || status) : status;
  return (
    <Badge className={`text-xs ${statusColors[status] || ""}`} data-testid={testId}>
      {label}
    </Badge>
  );
}

export function getUnitStatusLabel(status: string, t?: (key: string, fallback?: string) => string): string {
  if (t) {
    const key = statusI18nKeys[status];
    return key ? t(key, statusFallbacks[status] || status) : (statusFallbacks[status] || status);
  }
  return statusFallbacks[status] || status;
}

export function getUnitStatusColor(status: string): string {
  return statusColors[status] || "";
}
