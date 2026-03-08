import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";

// Shared status badge components used across all dashboard roles (guest, reception, admin, owner)

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusConfig {
  variant: BadgeVariant;
  labelKey: string;
  icon?: React.ElementType;
}

const requestStatusConfig: Record<string, StatusConfig> = {
  pending: { variant: "secondary", labelKey: "common.pending", icon: Clock },
  approved: { variant: "default", labelKey: "common.approved", icon: CheckCircle },
  in_progress: { variant: "outline", labelKey: "common.inProgress", icon: UserCheck },
  completed: { variant: "default", labelKey: "common.completed", icon: CheckCircle },
  cancelled: { variant: "destructive", labelKey: "common.cancelled", icon: XCircle },
};

const prepStatusConfig: Record<string, StatusConfig> = {
  pending: { variant: "secondary", labelKey: "roomPrep.status.pending" },
  accepted: { variant: "default", labelKey: "roomPrep.status.accepted" },
  in_preparation: { variant: "outline", labelKey: "roomPrep.status.in_preparation" },
  ready: { variant: "default", labelKey: "roomPrep.status.ready" },
  delivered: { variant: "default", labelKey: "roomPrep.status.delivered" },
  rejected: { variant: "destructive", labelKey: "roomPrep.status.rejected" },
};

interface RequestStatusBadgeProps {
  status: string;
  showIcon?: boolean;
  "data-testid"?: string;
}

export function RequestStatusBadge({ status, showIcon = false, "data-testid": testId }: RequestStatusBadgeProps) {
  const { t } = useTranslation();
  const config = requestStatusConfig[status] || { variant: "secondary" as BadgeVariant, labelKey: status, icon: AlertCircle };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`text-xs ${showIcon ? "gap-1" : ""}`} data-testid={testId}>
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {t(config.labelKey, status)}
    </Badge>
  );
}

interface PrepStatusBadgeProps {
  status: string;
  "data-testid"?: string;
}

export function PrepStatusBadge({ status, "data-testid": testId }: PrepStatusBadgeProps) {
  const { t } = useTranslation();
  const config = prepStatusConfig[status] || { variant: "secondary" as BadgeVariant, labelKey: status };

  return (
    <Badge variant={config.variant} className="text-xs" data-testid={testId}>
      {t(config.labelKey, status)}
    </Badge>
  );
}
