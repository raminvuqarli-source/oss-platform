export type ComplianceMode = "disabled" | "manual_export" | "api_integration";

export interface ComplianceConfig {
  mode: ComplianceMode;
  enabled: boolean;
}

export const COMPLIANCE_MODES: Record<ComplianceMode, { label: string; description: string; available: boolean }> = {
  disabled: {
    label: "Disabled",
    description: "No compliance data collection. Guest identity verification handled externally.",
    available: true,
  },
  manual_export: {
    label: "Manual Export",
    description: "Collect guest identity data and export reports manually. Coming soon.",
    available: false,
  },
  api_integration: {
    label: "API Integration",
    description: "Automatic submission to government registration systems. Coming soon.",
    available: false,
  },
};

export function getDefaultComplianceConfig(): ComplianceConfig {
  return {
    mode: "disabled",
    enabled: false,
  };
}

export function isComplianceEnabled(config: ComplianceConfig): boolean {
  return config.enabled && config.mode !== "disabled";
}
