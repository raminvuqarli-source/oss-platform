import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-provider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Palette,
  Smartphone,
  LogOut,
  Save,
  Loader2,
  CreditCard,
  Activity,
  FileText,
  Building2,
  BedDouble,
  Cpu,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Calculator,
  SunMedium,
  BrainCircuit,
  Gauge,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { Subscription, PlanCode } from "@shared/schema";
import type { FeatureAccess, BusinessFeature } from "@shared/planFeatures";
import { PLAN_CODE_FEATURES, SMART_PLAN_PRICING } from "@shared/planFeatures";
import { DynamicPricingSection } from "@/components/dynamic-pricing";

interface PlanFromAPI {
  code: PlanCode;
  displayName: string;
  priceMonthlyUSD: number;
  currency: string;
  features: Record<BusinessFeature, FeatureAccess>;
  limits: { maxProperties: number; maxUnitsPerProperty: number; maxStaff: number };
}

interface SmartPlanFromAPI {
  code: string;
  displayName: string;
  priceMonthlyUSD: number;
  currency: string;
  popular: boolean;
  features: string[];
  available?: boolean;
}

const SMART_CODE_ICONS: Record<string, typeof Cpu> = {
  smart_lite: SunMedium,
  smart_pro: Gauge,
  smart_ai: BrainCircuit,
};

const SMART_FEATURE_LABELS: Record<string, string> = {
  light_control: "pricing.smartFeatures.light",
  ac_control: "pricing.smartFeatures.ac",
  smart_lock: "pricing.smartFeatures.lock",
  pre_checkin: "pricing.smartFeatures.preCheckin",
  energy_monitoring: "pricing.smartFeatures.energy",
  smart_scenes: "pricing.smartFeatures.scenes",
  curtains: "pricing.smartFeatures.mobile",
  automation_rules: "pricing.smartFeatures.automation",
  ai_energy_optimization: "pricing.smartFeatures.aiEnergy",
  behavioral_analytics: "pricing.smartFeatures.behavioral",
  auto_temperature: "pricing.smartFeatures.autoTemp",
  advanced_iot: "pricing.smartFeatures.advancedIot",
};

const PLAN_CODE_TO_PLANTYPE: Record<string, string> = {
  CORE_STARTER: "starter",
  CORE_GROWTH: "growth",
  CORE_PRO: "pro",
};

const PLANTYPE_TO_PLAN_CODE: Record<string, string> = {
  starter: "CORE_STARTER",
  growth: "CORE_GROWTH",
  pro: "CORE_PRO",
};

const EPOINT_MAX_AZN = 800;

const FEATURE_LABEL_KEYS: Record<string, string> = {
  guest_management: "billing.features.guestManagement",
  staff_management: "billing.features.staffManagement",
  advanced_analytics: "billing.features.advancedAnalytics",
  multi_property: "billing.features.multiProperty",
  custom_integrations: "billing.features.customIntegrations",
  priority_support: "billing.features.prioritySupport",
};

const FEATURE_LABELS_FALLBACK: Record<string, string> = {
  guest_management: "Guest Management",
  staff_management: "Staff Management",
  advanced_analytics: "Advanced Analytics",
  multi_property: "Multi-Property",
  custom_integrations: "Custom Integrations",
  priority_support: "Priority Support",
};

export function BillingSection() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  interface SplitPendingState {
    splitGroupId: string;
    splitIndex: number;
    splitTotal: number;
    planCode: string;
    smartPlanCode: string;
    smartRoomCount: number;
    paidAZN: number;
    remainingAZN: number;
    totalAZN: number;
    planType: string;
    prevOrderId: string;
  }

  const [splitPending, setSplitPending] = useState<SplitPendingState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("payment");
    if (paymentResult) {
      window.history.replaceState({}, "", window.location.pathname);
      if (paymentResult === "success") {
        toast({ title: t('billing.paymentSuccess', 'Payment Successful'), description: t('billing.paymentSuccessDesc', 'Your subscription has been activated.') });
        queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
        queryClient.invalidateQueries({ queryKey: ["/api/billing/invoices"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      } else if (paymentResult === "split_pending") {
        const orderId = params.get("orderId");
        if (orderId) {
          fetch(`/api/epoint/split-status/${orderId}`, { credentials: "include" })
            .then(r => r.json())
            .then((data: any) => {
              if (data.splitGroupId) {
                setSplitPending({
                  splitGroupId: data.splitGroupId,
                  splitIndex: data.splitIndex,
                  splitTotal: data.splitTotal,
                  planCode: data.planCode,
                  smartPlanCode: data.smartPlanCode || "",
                  smartRoomCount: data.smartRoomCount || 0,
                  paidAZN: data.paidAZN,
                  remainingAZN: data.remainingAZN,
                  totalAZN: data.totalAmountAZN,
                  planType: data.planType || "",
                  prevOrderId: String(data.prevOrderId || orderId),
                });
              }
            })
            .catch(() => {/* ignore */});
        }
      } else if (paymentResult === "cancelled") {
        toast({ title: t('billing.paymentCancelled', 'Payment Cancelled'), description: t('billing.paymentCancelledDesc', 'You cancelled the payment.'), variant: "destructive" });
      } else if (paymentResult === "declined") {
        toast({ title: t('billing.paymentDeclined', 'Payment Declined'), description: t('billing.paymentDeclinedDesc', 'Your payment was declined by the bank.'), variant: "destructive" });
      } else if (paymentResult === "error") {
        toast({ title: t('billing.somethingWentWrong'), description: t('billing.paymentError', 'There was an error processing your payment.'), variant: "destructive" });
      }
    }
  }, []);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCorePlanCode, setSelectedCorePlanCode] = useState<string>("CORE_STARTER");
  const [smartEnabled, setSmartEnabled] = useState(false);
  const [selectedSmartIdx, setSelectedSmartIdx] = useState(1);
  const [roomCount, setRoomCount] = useState(10);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: billingData, isLoading: billingLoading } = useQuery<{ billing: any; subscription: any }>({
    queryKey: ["/api/billing"],
  });

  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/billing/invoices"],
  });

  const { data: epointStatus, isLoading: epointLoading, error: epointError } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/epoint/status"],
    staleTime: 0,
    retry: 2,
  });

  useEffect(() => {
    console.log("[Billing] epointStatus:", epointStatus, "loading:", epointLoading, "error:", epointError);
  }, [epointStatus, epointLoading, epointError]);

  const { data: contractStatus } = useQuery<{ accepted: boolean; planCode?: string; smartPlanType?: string }>({
    queryKey: ["/api/contracts/status"],
  });

  const contractMutation = useMutation({
    mutationFn: async ({ planCode, planType, smartPlanType, contractLanguage }: { planCode: string; planType: string; smartPlanType: string; contractLanguage: string }) => {
      const res = await apiRequest("POST", "/api/contracts/accept", { planCode, planType, smartPlanType, contractLanguage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/status"] });
    },
    onError: () => {
      toast({ title: t('billing.somethingWentWrong'), description: "Failed to save contract acceptance", variant: "destructive" });
    },
  });

  const { data: plans } = useQuery<PlanFromAPI[]>({
    queryKey: ["/api/plans"],
  });

  const { data: smartPlans } = useQuery<SmartPlanFromAPI[]>({
    queryKey: ["/api/smart-plans"],
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planType: string) => {
      const res = await apiRequest("POST", "/api/billing/change-plan", { planType });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('billing.planUpdated'), description: t('billing.planUpdatedDesc') });
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      setChangePlanOpen(false);
      setSelectedPlan(null);
    },
    onError: () => {
      toast({ title: t('billing.somethingWentWrong'), description: t('billing.changePlanError'), variant: "destructive" });
    },
  });

  const epointMutation = useMutation({
    mutationFn: async ({ planCode, smartPlanCode, smartRoomCount }: { planCode: string; smartPlanCode?: string; smartRoomCount?: number }) => {
      const res = await apiRequest("POST", "/api/epoint/create-order", { planCode, smartPlanCode, smartRoomCount });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      const message = error?.message || t('billing.epointError', 'Failed to initiate payment');
      toast({ title: t('billing.somethingWentWrong'), description: message, variant: "destructive" });
    },
  });

  const handlePayWithContract = useCallback(async (planCode: string) => {
    const planType = PLAN_CODE_TO_PLANTYPE[planCode] || planCode.toLowerCase();
    const smartPlanType = smartEnabled && smartPlans ? (smartPlans[selectedSmartIdx]?.code || "none") : "none";
    const contractLanguage = (i18n.language || "en").toUpperCase().slice(0, 2);

    if (!termsAccepted && !contractStatus?.accepted) {
      toast({ title: t('billing.agreementRequired'), description: t('billing.mustAcceptBeforeProceeding'), variant: "destructive" });
      return;
    }

    try {
      if (!contractStatus?.accepted || contractStatus.planCode !== planCode || contractStatus.smartPlanType !== smartPlanType) {
        await contractMutation.mutateAsync({ planCode, planType, smartPlanType, contractLanguage });
      }
      epointMutation.mutate({
        planCode,
        smartPlanCode: smartEnabled && smartPlans ? smartPlans[selectedSmartIdx]?.code : undefined,
        smartRoomCount: smartEnabled ? roomCount : undefined,
      });
    } catch {
      // contractMutation.onError handles the toast
    }
  }, [termsAccepted, contractStatus, smartEnabled, smartPlans, selectedSmartIdx, roomCount, contractMutation, epointMutation, toast]);

  const nextSplitMutation = useMutation({
    mutationFn: async (sp: NonNullable<typeof splitPending>) => {
      const res = await apiRequest("POST", "/api/epoint/next-split", {
        prevOrderId: sp.prevOrderId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      const message = error?.message || t('billing.epointError', 'Failed to initiate payment');
      toast({ title: t('billing.somethingWentWrong'), description: message, variant: "destructive" });
    },
  });

  const currentPlan = billingData?.subscription?.planType || "starter";

  useEffect(() => {
    if (billingData?.subscription?.planType) {
      const code = PLANTYPE_TO_PLAN_CODE[billingData.subscription.planType];
      if (code) setSelectedCorePlanCode(code);
    }
  }, [billingData?.subscription?.planType]);

  if (billingLoading || !plans) {
    return <p className="text-sm text-muted-foreground p-4">{t('billing.loading')}</p>;
  }

  return (
    <div className="space-y-4" data-testid="billing-section">

      {/* ===== SPLIT PAYMENT PROGRESS BANNER ===== */}
      {splitPending && (
        <Card className="border-amber-400/60 bg-amber-50 dark:bg-amber-950/30" data-testid="card-split-progress">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                  {t('billing.splitPaymentInProgress', 'Split Payment In Progress')}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {t('billing.splitPaymentDesc', `Payment ${splitPending.splitIndex} of ${splitPending.splitTotal} completed. Continue to pay the next instalment.`
                    .replace(`${splitPending.splitIndex}`, String(splitPending.splitIndex))
                    .replace(`${splitPending.splitTotal}`, String(splitPending.splitTotal)))}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-amber-600"
                onClick={() => setSplitPending(null)}
                data-testid="button-split-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                <span>{t('billing.splitPaid', 'Paid')}: {splitPending.paidAZN.toFixed(2)} AZN</span>
                <span>{t('billing.splitRemaining', 'Remaining')}: {splitPending.remainingAZN.toFixed(2)} AZN</span>
              </div>
              <Progress
                value={(splitPending.paidAZN / splitPending.totalAZN) * 100}
                className="h-2 bg-amber-200 dark:bg-amber-800"
              />
              <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                <span>{splitPending.splitIndex}/{splitPending.splitTotal} {t('billing.splitInstalment', 'instalments')}</span>
                <span>{t('billing.splitTotal', 'Total')}: {splitPending.totalAZN.toFixed(2)} AZN</span>
              </div>
            </div>

            <Button
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => nextSplitMutation.mutate(splitPending)}
              disabled={nextSplitMutation.isPending}
              data-testid="button-split-continue"
            >
              {nextSplitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('billing.loading', 'Processing...')}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  {t('billing.splitContinue', `Continue to payment ${splitPending.splitIndex + 1} of ${splitPending.splitTotal}`
                    .replace(String(splitPending.splitIndex + 1), String(splitPending.splitIndex + 1))
                    .replace(String(splitPending.splitTotal), String(splitPending.splitTotal)))} — {Math.min(EPOINT_MAX_AZN, splitPending.remainingAZN).toFixed(2)} AZN
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{t('billing.currentPlan')}</p>
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" data-testid="badge-current-plan">
          {currentPlan.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const planType = PLAN_CODE_TO_PLANTYPE[plan.code] || plan.code.toLowerCase();
          const isCurrent = currentPlan === planType;
          const isSelected = selectedCorePlanCode === plan.code;
          return (
            <Card
              key={plan.code}
              className={`cursor-pointer transition-all hover-elevate ${isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}
              onClick={() => setSelectedCorePlanCode(plan.code)}
              data-testid={`card-plan-${planType}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{plan.displayName}</span>
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-xs shrink-0">{t('billing.current')}</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">${plan.priceMonthlyUSD}<span className="text-sm font-normal text-muted-foreground">{t('landing.perMonth')}</span></p>
                <ul className="space-y-1.5">
                  {Object.entries(FEATURE_LABEL_KEYS).map(([key, i18nKey]) => {
                    const included = plan.features[key as BusinessFeature];
                    return (
                      <li key={key} className="flex items-center gap-2 text-xs">
                        {included ? (
                          <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400 shrink-0" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={included ? "" : "text-muted-foreground/60"}>{t(i18nKey, FEATURE_LABELS_FALLBACK[key])}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className={`w-full py-1.5 rounded-md text-center text-xs font-medium transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {isSelected ? t('pricing.selected', 'Selected') : t('pricing.selectPlan', 'Select')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!contractStatus?.accepted && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30" data-testid="contract-terms-checkbox">
          <Checkbox
            id="terms-agreement"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            data-testid="checkbox-terms-agreement"
          />
          <div className="space-y-1">
            <label htmlFor="terms-agreement" className="text-sm font-medium cursor-pointer leading-none">
              {t('billing.agreeToTerms')}{" "}
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                {t('billing.ossServiceAgreement')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </label>
            <p className="text-xs text-muted-foreground">
              {t('billing.mustAcceptAgreement')}
            </p>
          </div>
        </div>
      )}

      {contractStatus?.accepted && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400" data-testid="contract-accepted-status">
          <CheckCircle className="h-4 w-4" />
          <span>{t('billing.agreementAccepted')}</span>
        </div>
      )}

      <div className="space-y-4" data-testid="billing-smart-addon">
        <div className="flex items-center gap-3 flex-wrap">
          <Cpu className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">{t('pricing.smartRoomAddon')}</span>
          <Badge variant="secondary" className="text-xs">{t('pricing.optionalAddon')}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t('pricing.smartRoomAddonDesc')}</p>

        <div className="flex items-center gap-3">
          <Switch
            id="settings-smart-toggle"
            checked={smartEnabled}
            onCheckedChange={setSmartEnabled}
            data-testid="switch-settings-smart-toggle"
          />
          <label htmlFor="settings-smart-toggle" className="text-sm font-medium cursor-pointer">
            {t('pricing.enableSmartRooms')}
          </label>
        </div>

        {smartEnabled && smartPlans && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {smartPlans.map((sp, idx) => {
                const TierIcon = SMART_CODE_ICONS[sp.code] || Cpu;
                const isSelected = selectedSmartIdx === idx;
                const isComingSoon = sp.available === false;
                return (
                  <Card
                    key={sp.code}
                    className={`relative ${isComingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover-elevate"} ${isSelected && !isComingSoon ? "ring-2 ring-primary" : ""}`}
                    onClick={() => { if (!isComingSoon) setSelectedSmartIdx(idx); }}
                    data-testid={`card-settings-smart-${sp.code}`}
                  >
                    {isComingSoon && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 dark:border-amber-700" data-testid={`badge-settings-coming-soon-${sp.code}`}>
                          {t('pricing.comingSoon', 'Coming Soon')}
                        </Badge>
                      </div>
                    )}
                    {!isComingSoon && sp.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">{t('pricing.popular')}</Badge>
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isComingSoon ? "bg-muted" : "bg-primary/10"}`}>
                          <TierIcon className={`h-4 w-4 ${isComingSoon ? "text-muted-foreground" : "text-primary"}`} />
                        </div>
                        <span className="font-bold">{sp.displayName}</span>
                      </div>
                      <div>
                        <span className="text-2xl font-bold">${sp.priceMonthlyUSD}</span>
                        <span className="text-muted-foreground text-sm"> {t('pricing.perRoomMonth')}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {Object.entries(SMART_FEATURE_LABELS).map(([featureCode, labelKey]) => {
                          const included = sp.features.includes(featureCode);
                          return (
                            <li key={featureCode} className="flex items-center gap-2 text-xs">
                              {included ? (
                                <CheckCircle className="h-3 w-3 text-green-500 dark:text-green-400 shrink-0" />
                              ) : (
                                <X className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                              )}
                              <span className={included ? "" : "text-muted-foreground/60"}>{t(labelKey)}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <Button
                        className="w-full"
                        size="sm"
                        variant={isComingSoon ? "secondary" : isSelected ? "default" : "outline"}
                        disabled={isComingSoon}
                        onClick={(e) => { e.stopPropagation(); if (!isComingSoon) setSelectedSmartIdx(idx); }}
                        data-testid={`button-settings-select-smart-${sp.code}`}
                      >
                        {isComingSoon ? t('pricing.comingSoon', 'Coming Soon') : isSelected ? t('pricing.selected') : t('pricing.selectPlan')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{t('pricing.hardwareNotIncluded')}</p>

            <Card data-testid="billing-smart-calculator">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{t('pricing.calculator')}</span>
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <label className="text-sm font-medium">{t('pricing.smartRoomCount')}</label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setRoomCount((c) => Math.max(1, c - 1))}
                      data-testid="button-settings-room-minus"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={roomCount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 1 && v <= 999) setRoomCount(v);
                      }}
                      className="w-16 text-center text-lg font-semibold bg-transparent border border-border rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="input-settings-room-count"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setRoomCount((c) => Math.min(999, c + 1))}
                      data-testid="button-settings-room-plus"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {smartPlans[selectedSmartIdx]?.displayName} x {roomCount} {roomCount !== 1 ? t('pricing.rooms') : t('pricing.room')}
                    </span>
                    <span className="font-medium">${((smartPlans[selectedSmartIdx]?.priceMonthlyUSD || 0) * roomCount).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{t('pricing.exclVat')}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {(() => {
        const selectedPlanConfig = plans.find((p) => p.code === selectedCorePlanCode);
        const selectedSmartPlan = smartEnabled && smartPlans ? smartPlans[selectedSmartIdx] : null;
        const corePriceUSD = selectedPlanConfig?.priceMonthlyUSD || 0;
        const smartPriceUSD = selectedSmartPlan ? (selectedSmartPlan.priceMonthlyUSD || 0) * roomCount : 0;
        const totalUSD = corePriceUSD + smartPriceUSD;
        const isPaying = epointMutation.isPending || contractMutation.isPending;
        const canPay = termsAccepted || !!contractStatus?.accepted;

        // Calculate AZN total for split payment notice
        const corePriceAZN = PLAN_CODE_FEATURES[selectedCorePlanCode as PlanCode]?.priceMonthlyAZN || 0;
        const smartKey = smartEnabled && smartPlans[selectedSmartIdx]?.code !== "none"
          ? smartPlans[selectedSmartIdx]?.code as keyof typeof SMART_PLAN_PRICING
          : null;
        const smartPriceAZN = smartKey && SMART_PLAN_PRICING[smartKey]
          ? (SMART_PLAN_PRICING[smartKey].priceMonthlyAZN * roomCount)
          : 0;
        const totalAZN = corePriceAZN + smartPriceAZN;
        const splitCount = totalAZN > EPOINT_MAX_AZN ? Math.ceil(totalAZN / EPOINT_MAX_AZN) : 1;
        const isSplitNeeded = splitCount > 1;
        const firstInstalment = isSplitNeeded ? Math.min(EPOINT_MAX_AZN, totalAZN) : totalAZN;

        return (
          <Card className="border-primary/30 bg-primary/5" data-testid="card-payment-summary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                {t('billing.paymentSummary', 'Payment Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('billing.corePlan', 'Core Plan')} — {selectedPlanConfig?.displayName || selectedCorePlanCode}
                  </span>
                  <span className="font-semibold">${corePriceUSD}<span className="text-xs text-muted-foreground">{t('landing.perMonth')}</span></span>
                </div>

                {selectedSmartPlan && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('billing.smartRoomAddon', 'Smart Room')} — {selectedSmartPlan.displayName} × {roomCount} {roomCount !== 1 ? t('pricing.rooms', 'rooms') : t('pricing.room', 'room')}
                    </span>
                    <span className="font-semibold">${smartPriceUSD.toLocaleString()}<span className="text-xs text-muted-foreground">{t('landing.perMonth')}</span></span>
                  </div>
                )}

                <div className="border-t border-primary/20 pt-2 flex items-center justify-between">
                  <span className="font-semibold">{t('billing.totalMonthly', 'Total / month')}</span>
                  <span className="text-xl font-bold text-primary">${totalUSD.toLocaleString()}</span>
                </div>
              </div>

              {/* Split payment notice when total > 800 AZN */}
              {isSplitNeeded && (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1.5" data-testid="notice-split-payment">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      {t('billing.splitNoticeTitle', 'Payment will be split into instalments')}
                    </p>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    {t('billing.splitNoticeDesc',
                      `Total ${totalAZN.toFixed(2)} AZN exceeds the ${EPOINT_MAX_AZN} AZN limit per transaction. It will be charged in ${splitCount} instalments of up to ${EPOINT_MAX_AZN} AZN each.`
                        .replace('{{total}}', totalAZN.toFixed(2))
                        .replace('{{max}}', String(EPOINT_MAX_AZN))
                        .replace('{{count}}', String(splitCount))
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {Array.from({ length: splitCount }).map((_, i) => {
                      const amt = i < splitCount - 1 ? EPOINT_MAX_AZN : parseFloat((totalAZN - (splitCount - 1) * EPOINT_MAX_AZN).toFixed(2));
                      return (
                        <span key={i} className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                          {i + 1}: {amt.toFixed(0)} ₼
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {!canPay && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {t('billing.mustAcceptBeforeProceeding', 'Please accept the service agreement above before paying.')}
                </p>
              )}

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => handlePayWithContract(selectedCorePlanCode)}
                disabled={isPaying || !canPay}
                data-testid="button-payment-summary-pay"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('billing.loading', 'Processing...')}
                  </>
                ) : isSplitNeeded ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {t('billing.payFirstInstalment', 'Pay 1st instalment')} — {firstInstalment.toFixed(2)} ₼
                    <span className="ml-1 text-xs opacity-75">({splitCount} {t('billing.instalments', 'parts')})</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {t('billing.payWithCard', 'Pay with Card')} — ${totalUSD.toLocaleString()}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">{t('pricing.exclVat', 'Excl. VAT')}</p>
            </CardContent>
          </Card>
        );
      })()}

      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('billing.confirmPlanChange')}</DialogTitle>
            <DialogDescription>{t('billing.switchToPlan', { plan: selectedPlan?.toUpperCase() })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanOpen(false)} data-testid="button-cancel-plan-change">{t('common.cancel')}</Button>
            <Button onClick={() => selectedPlan && changePlanMutation.mutate(selectedPlan)} disabled={changePlanMutation.isPending} data-testid="button-confirm-plan-change">
              {changePlanMutation.isPending ? t('billing.updating') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionStatusCard />

      <InvoiceHistoryCard />
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  past_due: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

function SubscriptionStatusCard() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: subData, isLoading } = useQuery<{
    hasSubscription: boolean;
    id?: string;
    planType?: string;
    planCode?: string;
    status?: string;
    isActive?: boolean;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    autoRenew?: boolean;
    cancelAtPeriodEnd?: boolean;
    failedPaymentAttempts?: number;
    trialEndsAt?: string;
  }>({
    queryKey: ["/api/subscription/status"],
  });

  const autoRenewMutation = useMutation({
    mutationFn: async (autoRenew: boolean) => {
      const res = await apiRequest("PATCH", "/api/subscription/auto-renew", { autoRenew });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({ title: t('billing.autoRenewUpdated', 'Auto-renewal updated'), description: data.autoRenew ? t('billing.autoRenewOn', 'Auto-renewal is ON') : t('billing.autoRenewOff', 'Auto-renewal is OFF') });
    },
    onError: () => {
      toast({ title: t('billing.somethingWentWrong'), variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/cancel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({ title: t('billing.subscriptionCancelled', 'Cancellation scheduled'), description: t('billing.cancelledDesc', 'Your subscription will end at the current period.') });
    },
    onError: () => {
      toast({ title: t('billing.somethingWentWrong'), variant: "destructive" });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/reactivate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({ title: t('billing.reactivated', 'Subscription reactivated'), description: t('billing.reactivatedDesc', 'Auto-renewal is back on.') });
    },
    onError: () => {
      toast({ title: t('billing.somethingWentWrong'), variant: "destructive" });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/retry");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      toast({ title: t('billing.somethingWentWrong'), description: error?.message || "Failed to initiate payment", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="subscription-status-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">{t('billing.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subData?.hasSubscription) {
    return (
      <Card data-testid="subscription-status-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            {t('billing.subscriptionStatus', 'Subscription Status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('billing.noSubscription', 'No active subscription. Choose a plan above to get started.')}</p>
        </CardContent>
      </Card>
    );
  }

  const status = subData.status || "unknown";
  const showRetry = status === "past_due" || status === "suspended";
  const showCancel = (status === "active" || status === "trial") && !subData.cancelAtPeriodEnd;
  const showReactivate = subData.cancelAtPeriodEnd && status !== "expired" && status !== "suspended";

  return (
    <Card data-testid="subscription-status-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          {t('billing.subscriptionStatus', 'Subscription Status')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('billing.plan', 'Plan')}</p>
            <p className="text-sm font-medium" data-testid="text-plan-name">{(subData.planType || "starter").toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('billing.status', 'Status')}</p>
            <Badge className={STATUS_COLORS[status] || STATUS_COLORS.expired} data-testid="badge-subscription-status">
              {status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('billing.periodStart', 'Period Start')}</p>
            <p className="text-sm" data-testid="text-period-start">{subData.currentPeriodStart ? new Date(subData.currentPeriodStart).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('billing.periodEnd', 'Period End')}</p>
            <p className="text-sm" data-testid="text-period-end">{subData.currentPeriodEnd ? new Date(subData.currentPeriodEnd).toLocaleDateString() : "—"}</p>
          </div>
        </div>

        {subData.cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400" data-testid="text-cancel-notice">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('billing.cancelScheduled', 'Cancellation scheduled at period end')}</span>
          </div>
        )}

        {(subData.failedPaymentAttempts || 0) > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" data-testid="text-failed-attempts">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('billing.failedAttempts', 'Failed payment attempts')}: {subData.failedPaymentAttempts}</span>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-renew-toggle"
              checked={subData.autoRenew ?? true}
              onCheckedChange={(checked) => autoRenewMutation.mutate(checked)}
              disabled={autoRenewMutation.isPending || status === "expired" || status === "suspended"}
              data-testid="switch-auto-renew"
            />
            <label htmlFor="auto-renew-toggle" className="text-sm cursor-pointer">
              {t('billing.autoRenew', 'Auto-renew')}
            </label>
            {autoRenewMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>

          {showCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-subscription"
            >
              {cancelMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <X className="h-3 w-3 mr-1" />}
              {t('billing.cancelAtPeriodEnd', 'Cancel at period end')}
            </Button>
          )}

          {showReactivate && (
            <Button
              variant="default"
              size="sm"
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
              data-testid="button-reactivate-subscription"
            >
              {reactivateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
              {t('billing.reactivate', 'Reactivate')}
            </Button>
          )}

          {showRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              data-testid="button-retry-payment"
            >
              {retryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CreditCard className="h-3 w-3 mr-1" />}
              {t('billing.retryPayment', 'Retry Payment')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceHistoryCard() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: invoiceList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const regenerateMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await apiRequest("POST", `/api/invoices/${invoiceId}/regenerate-pdf`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('billing.pdfRegenerated', 'PDF regenerated successfully') });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: () => {
      toast({ title: t('billing.somethingWentWrong'), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="invoice-history-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">{t('billing.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoiceList || invoiceList.length === 0) {
    return (
      <Card data-testid="invoice-history-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {t('billing.invoiceHistory', 'Invoice History')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('billing.noInvoices', 'No invoices yet.')}</p>
        </CardContent>
      </Card>
    );
  }

  const invoiceStatusColor = (s: string) => {
    if (s === "paid") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (s === "refunded") return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  };

  return (
    <Card data-testid="invoice-history-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {t('billing.invoiceHistory', 'Invoice History')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-1 font-medium text-muted-foreground text-xs">{t('billing.invoice', 'Invoice')}</th>
                <th className="text-left py-2 px-1 font-medium text-muted-foreground text-xs">{t('billing.period', 'Period')}</th>
                <th className="text-right py-2 px-1 font-medium text-muted-foreground text-xs">{t('billing.amount', 'Amount')}</th>
                <th className="text-center py-2 px-1 font-medium text-muted-foreground text-xs">{t('billing.status', 'Status')}</th>
                <th className="text-right py-2 px-1 font-medium text-muted-foreground text-xs">{t('billing.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0" data-testid={`row-invoice-${inv.id}`}>
                  <td className="py-2 px-1">
                    <span className="font-medium" data-testid={`text-invoice-number-${inv.id}`}>{inv.invoiceNumber || inv.id?.slice(0, 8)}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</span>
                  </td>
                  <td className="py-2 px-1 text-xs text-muted-foreground">
                    {inv.periodStart ? new Date(inv.periodStart).toLocaleDateString() : "—"}
                    {" → "}
                    {inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 px-1 text-right font-medium" data-testid={`text-invoice-amount-${inv.id}`}>
                    {inv.amount != null ? `${(inv.amount / 100).toFixed(2)} ${(inv.currency || "AZN").toUpperCase()}` : "—"}
                  </td>
                  <td className="py-2 px-1 text-center">
                    <Badge className={invoiceStatusColor(inv.status)} data-testid={`badge-invoice-status-${inv.id}`}>
                      {(inv.status || "draft").toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2 px-1 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")}
                        title={t('billing.viewPdf', 'View PDF')}
                        data-testid={`button-view-pdf-${inv.id}`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => regenerateMutation.mutate(inv.id)}
                        disabled={regenerateMutation.isPending}
                        title={t('billing.regeneratePdf', 'Regenerate PDF')}
                        data-testid={`button-regenerate-pdf-${inv.id}`}
                      >
                        {regenerateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageSection() {
  const { t } = useTranslation();
  const { data: usageData, isLoading } = useQuery<{
    meters: Array<{ metricType: string; currentValue: number; maxAllowed: number }>;
    warnings: Array<{ metric: string; current: number; max: number; percentage: number; atLimit: boolean }>;
  }>({
    queryKey: ["/api/usage"],
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">{t('billing.loading')}</p>;

  const meters = usageData?.meters || [];
  const meterIcons: Record<string, typeof Building2> = { properties: Building2, units: BedDouble, devices: Cpu, users: Users };

  return (
    <div className="space-y-4" data-testid="usage-section">
      {meters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {meters.map((meter) => {
            const pct = meter.maxAllowed > 0 ? Math.min(Math.round((meter.currentValue / meter.maxAllowed) * 100), 100) : 0;
            const MeterIcon = meterIcons[meter.metricType] || Activity;
            return (
              <Card key={meter.metricType} data-testid={`card-usage-${meter.metricType}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MeterIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{t(`billing.meters.${meter.metricType}`, meter.metricType.replace(/_/g, " "))}</span>
                    {pct >= 100 && <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">{t('billing.atLimit')}</Badge>}
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{meter.currentValue} / {meter.maxAllowed}</span>
                    <span>{pct}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('billing.noUsageData')}</p>
      )}
    </div>
  );
}

function FeaturesSection() {
  const { t } = useTranslation();
  const { data: featuresData, isLoading } = useQuery<{
    features: Array<{ name: string; enabled: boolean; source: string }>;
    plan: string;
  }>({
    queryKey: ["/api/features"],
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">{t('billing.loading')}</p>;

  const features = featuresData?.features || [];

  return (
    <div className="space-y-3" data-testid="features-section">
      {features.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {features.map((f) => (
            <div key={f.name} className="flex items-center justify-between p-3 rounded-md border border-border" data-testid={`feature-${f.name}`}>
              <span className="text-sm capitalize truncate">{f.name.replace(/_/g, " ")}</span>
              <Badge className={f.enabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}>
                {f.enabled ? t('billing.on') : t('billing.off')}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('billing.noFeaturesConfigured')}</p>
      )}
    </div>
  );
}

function AuditLogSection() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const pageSize = 20;

  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(pageSize));
  queryParams.set("offset", String(page * pageSize));
  if (actionFilter !== "all") queryParams.set("action", actionFilter);
  if (entityTypeFilter !== "all") queryParams.set("entityType", entityTypeFilter);
  if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

  const { data, isLoading } = useQuery<{
    logs: Array<{
      id: string; action: string; entityType: string; entityId: string;
      description: string; userId: string; userRole: string;
      previousValues: any; newValues: any;
      ipAddress: string; userAgent: string; createdAt: string;
    }>;
    total: number;
    actions: string[];
    entityTypes: string[];
  }>({
    queryKey: ["/api/audit-logs", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const availableActions = data?.actions || [];
  const availableEntityTypes = data?.entityTypes || [];
  const totalPages = Math.ceil(total / pageSize);

  const actionIcons: Record<string, typeof Shield> = {
    user_login: LogOut, user_logout: LogOut,
    staff_invited: Users, staff_created: Users, staff_updated: Users, staff_deleted: Users,
    subscription_upgraded: CreditCard, subscription_downgraded: CreditCard,
    white_label_updated: Palette,
  };

  const actionColors: Record<string, string> = {
    user_login: "bg-green-500/10 text-green-600",
    user_logout: "bg-gray-500/10 text-gray-600",
    staff_invited: "bg-blue-500/10 text-blue-600",
    staff_created: "bg-blue-500/10 text-blue-600",
    staff_updated: "bg-yellow-500/10 text-yellow-600",
    staff_deleted: "bg-red-500/10 text-red-600",
    subscription_upgraded: "bg-purple-500/10 text-purple-600",
    subscription_downgraded: "bg-orange-500/10 text-orange-600",
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="audit-loading">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="audit-section">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            placeholder={t('billing.audit.searchPlaceholder', 'Search logs...')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="h-9"
            data-testid="input-audit-search"
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-audit-action">
            <SelectValue placeholder={t('billing.audit.allActions', 'All Actions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('billing.audit.allActions', 'All Actions')}</SelectItem>
            {availableActions.map((a) => (
              <SelectItem key={a} value={a} data-testid={`option-action-${a}`}>
                {a.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-audit-entity">
            <SelectValue placeholder={t('billing.audit.allTypes', 'All Types')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('billing.audit.allTypes', 'All Types')}</SelectItem>
            {availableEntityTypes.map((e) => (
              <SelectItem key={e} value={e} data-testid={`option-entity-${e}`}>
                {e.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-audit-count">{total} {t('billing.audit.entries', { count: total })}</span>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      {logs.length > 0 ? (
        <div className="space-y-1.5">
          {logs.map((log, idx) => {
            const Icon = actionIcons[log.action] || Shield;
            const colorClass = actionColors[log.action] || "bg-muted text-muted-foreground";
            const isExpanded = expandedLogId === log.id;
            const hasDetails = log.previousValues || log.newValues || log.ipAddress;

            return (
              <div
                key={log.id || idx}
                className={`rounded-lg border border-border transition-colors ${hasDetails ? "cursor-pointer hover:bg-muted/30" : ""}`}
                onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log.id)}
                data-testid={`row-audit-${idx}`}
              >
                <div className="flex items-start gap-3 p-3">
                  <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono" data-testid={`badge-action-${idx}`}>
                        {log.action}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize" data-testid={`badge-entity-${idx}`}>
                        {log.entityType}
                      </Badge>
                      {log.userRole && (
                        <span className="text-xs text-muted-foreground capitalize">
                          ({log.userRole.replace(/_/g, " ")})
                        </span>
                      )}
                      {hasDetails && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {isExpanded ? <ChevronDown className="h-3 w-3 inline" /> : <ChevronRight className="h-3 w-3 inline" />}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1" data-testid={`text-audit-desc-${idx}`}>
                      {log.description || "—"}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.userId && (
                        <span className="truncate max-w-[150px]" title={log.userId}>
                          ID: {log.userId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && hasDetails && (
                  <div className="px-3 pb-3 pt-0 border-t border-border mt-0 mx-3 space-y-2" data-testid={`details-audit-${idx}`}>
                    {log.ipAddress && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium">IP:</span> {log.ipAddress}
                      </div>
                    )}
                    {log.userAgent && (
                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-medium">User Agent:</span> {log.userAgent}
                      </div>
                    )}
                    {log.entityId && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Entity ID:</span>{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{log.entityId}</code>
                      </div>
                    )}
                    {log.previousValues && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Previous:</span>
                        <pre className="mt-1 bg-muted p-2 rounded text-[11px] overflow-x-auto max-h-32">
                          {JSON.stringify(log.previousValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.newValues && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">New:</span>
                        <pre className="mt-1 bg-muted p-2 rounded text-[11px] overflow-x-auto max-h-32">
                          {JSON.stringify(log.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {searchQuery || actionFilter !== "all" || entityTypeFilter !== "all"
              ? "No logs match your filters"
              : t('billing.noActivityRecorded')}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2" data-testid="audit-pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            data-testid="button-audit-prev"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground" data-testid="text-audit-page">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            data-testid="button-audit-next"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function DynamicPricingWrapper() {
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const { data: propertiesData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/properties"],
  });

  const properties = propertiesData || [];
  const activePropertyId = selectedPropertyId || properties[0]?.id || "";

  const { t } = useTranslation();

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('dynamicPricing.loadingProperties')}</p>;
  if (properties.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dynamicPricing.noProperties')}</p>;
  }

  return (
    <div className="space-y-4" data-testid="dynamic-pricing-wrapper">
      {properties.length > 1 && (
        <div>
          <Label>{t('dynamicPricing.property')}</Label>
          <Select value={activePropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger data-testid="select-pricing-property">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p: any) => (
                <SelectItem key={p.id} value={p.id} data-testid={`option-property-${p.id}`}>
                  {p.name || p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <DynamicPricingSection propertyId={activePropertyId} />
    </div>
  );
}

function OwnerSettingsSection({ title, icon: Icon, children, defaultOpen = false, testId }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; testId: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card data-testid={testId}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer" data-testid={`button-toggle-${testId}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-5 w-5 text-muted-foreground" />
                {title}
              </CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const isOwner = user?.role === "owner_admin";

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: t('toast.profileUpdated'),
        description: t('toast.profileUpdatedDesc'),
      });
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('toast.profileError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('toast.signedOut'),
        description: t('toast.signedOutDesc'),
      });
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('toast.signOutError'),
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      guest: { label: t('roles.guest'), variant: "secondary" },
      reception: { label: t('roles.reception'), variant: "outline" },
      admin: { label: t('roles.admin'), variant: "default" },
      owner_admin: { label: t('roles.owner_admin'), variant: "default" },
    };
    const config = roleConfig[user.role] || { label: user.role, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            {t('settings.profile')}
          </CardTitle>
          <CardDescription>{t('settings.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user?.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{user?.fullName}</h3>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
              {getRoleBadge()}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input id="fullName" defaultValue={user?.fullName} data-testid="input-fullname" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} placeholder="your@email.com" data-testid="input-email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t('auth.phone')}</Label>
              <Input id="phone" type="tel" defaultValue={user?.phone || ""} placeholder="+1 (555) 000-0000" data-testid="input-phone" />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isLoading} data-testid="button-save-profile">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('settings.saveChanges')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            {t('settings.appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-medium">{t('settings.darkMode')}</p>
                <p className="text-sm text-muted-foreground">{theme === "dark" ? t('settings.currentlyOn') : t('settings.currentlyOff')}</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} data-testid="switch-dark-mode" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {t('common.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('settings.pushNotifications')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.getNotifiedAbout')}</p>
              </div>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} data-testid="switch-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('settings.sound')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.playSoundForNotifications')}</p>
              </div>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} data-testid="switch-sound" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('settings.emailNotifications')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.receiveUpdatesViaEmail')}</p>
              </div>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} data-testid="switch-email-notifications" />
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <Separator />
          <h2 className="text-lg font-semibold text-muted-foreground">{t('billing.managerSettings')}</h2>

          <OwnerSettingsSection title={t('billing.title')} icon={CreditCard} testId="settings-billing">
            <BillingSection />
          </OwnerSettingsSection>

          <OwnerSettingsSection title={t('billing.usageAndLimits')} icon={Activity} testId="settings-usage">
            <UsageSection />
          </OwnerSettingsSection>

          <OwnerSettingsSection title={t('billing.featureAccess')} icon={Shield} testId="settings-features">
            <FeaturesSection />
          </OwnerSettingsSection>

          <OwnerSettingsSection title={t('billing.activityLog')} icon={FileText} testId="settings-audit">
            <AuditLogSection />
          </OwnerSettingsSection>

          <OwnerSettingsSection title={t('dynamicPricing.title')} icon={Calculator} testId="settings-dynamic-pricing">
            <DynamicPricingWrapper />
          </OwnerSettingsSection>
        </>
      )}

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            {t('common.signOut')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            {t('common.signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
