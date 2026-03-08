import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, ArrowUpRight } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
  currentPlan?: string;
}

export function UpgradeModal({ open, onClose, featureName, currentPlan }: UpgradeModalProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onClose();
    setLocation("/owner/billing");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="upgrade-modal">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-lg">
              {t("upgrade.title", "Feature Not Available")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            {featureName
              ? t("upgrade.featureMessage", "{{feature}} is not included in your current {{plan}} plan. Please upgrade to access this feature.", {
                  feature: featureName,
                  plan: currentPlan || "starter",
                })
              : t("upgrade.genericMessage", "This feature is not included in your current subscription plan. Please upgrade to access it.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} data-testid="button-upgrade-cancel">
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleUpgrade} data-testid="button-upgrade-now">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            {t("upgrade.upgradeNow", "Upgrade Plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
