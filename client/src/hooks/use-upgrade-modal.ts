import { useState, useCallback } from "react";

interface UpgradeModalState {
  open: boolean;
  featureName: string;
  currentPlan: string;
}

export function useUpgradeModal() {
  const [state, setState] = useState<UpgradeModalState>({
    open: false,
    featureName: "",
    currentPlan: "starter",
  });

  const showUpgrade = useCallback((featureName: string, currentPlan?: string) => {
    setState({ open: true, featureName, currentPlan: currentPlan || "starter" });
  }, []);

  const closeUpgrade = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    upgradeModalOpen: state.open,
    upgradeFeatureName: state.featureName,
    upgradeCurrentPlan: state.currentPlan,
    showUpgrade,
    closeUpgrade,
  };
}
