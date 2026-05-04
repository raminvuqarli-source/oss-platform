import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/error-handler";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, BedDouble, Users, CheckCircle,
  ChevronRight, ChevronLeft, Plus, Trash2, Loader2,
  MapPin, Globe, Clock, Sparkles, UserPlus, Mail,
  DollarSign, Percent, Zap, Brush, Receipt, Crown, Rocket, Star,
} from "lucide-react";
import type { OnboardingProgress, Property } from "@shared/schema";

const STEPS = [
  { id: 1, icon: Building2, labelKey: "onboarding.steps.property" },
  { id: 2, icon: BedDouble, labelKey: "onboarding.steps.rooms" },
  { id: 3, icon: DollarSign, labelKey: "onboarding.steps.finance" },
  { id: 4, icon: Users, labelKey: "onboarding.steps.staff" },
  { id: 5, icon: CheckCircle, labelKey: "onboarding.steps.review" },
];

const PROPERTY_TYPES = ["hotel", "resort", "tiny_house", "apartment", "glamping"];
const ROOM_TYPES = ["standard", "deluxe", "suite", "studio", "villa", "bungalow", "penthouse", "dormitory"];
const PRICING_MODELS = ["nightly", "monthly"];
const STAFF_ROLES = ["manager", "front_desk", "cleaner"] as const;
const TIMEZONES = [
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Baku", "Asia/Istanbul", "Asia/Dubai", "Asia/Tehran", "Asia/Tokyo",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Australia/Sydney", "Pacific/Auckland",
];

interface RoomConfig {
  type: string;
  count: number;
  pricePerNight: number;
}

interface StaffMember {
  email: string;
  role: typeof STAFF_ROLES[number];
}

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("hotel");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([
    { type: "standard", count: 5, pricePerNight: 100 },
  ]);
  const [pricingModel, setPricingModel] = useState("nightly");

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const [countryTaxRate, setCountryTaxRate] = useState("");
  const [utilityExpensePct, setUtilityExpensePct] = useState("");
  const [cleaningExpenseMonthly, setCleaningExpenseMonthly] = useState("");
  const [defaultEmployeeTaxRate, setDefaultEmployeeTaxRate] = useState("");
  const [additionalExpensesMonthly, setAdditionalExpensesMonthly] = useState("");

  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<"CORE_STARTER" | "CORE_GROWTH" | "CORE_PRO">("CORE_PRO");

  const { data: onboardingData, isLoading: loadingOnboarding } = useQuery<OnboardingProgress & {
    savedData?: {
      property?: { name: string; type: string; country: string; city: string; timezone: string };
      propertyId?: string;
    };
  }>({
    queryKey: ["/api/onboarding"],
  });

  const { data: existingProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  useEffect(() => {
    if (onboardingData) {
      if (onboardingData.currentStep > 1) {
        const step = Math.min(onboardingData.currentStep, 5);
        setCurrentStep(step);
      }
      if (onboardingData.savedData) {
        const { property, propertyId } = onboardingData.savedData;
        if (property) {
          setPropertyName(property.name || "");
          setPropertyType(property.type || "hotel");
          setCountry(property.country || "");
          setCity(property.city || "");
          setTimezone(property.timezone || "UTC");
        }
        if (propertyId) {
          setCreatedPropertyId(propertyId);
        }
      }
    }
  }, [onboardingData]);

  const updateProgressMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PUT", "/api/onboarding", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
    },
  });

  const totalRooms = roomConfigs.reduce((sum, r) => sum + r.count, 0);
  const activeStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progressPercent = STEPS.length > 1 ? (activeStepIndex / (STEPS.length - 1)) * 100 : 0;

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return propertyName.trim().length > 0 && country.trim().length > 0 && city.trim().length > 0;
      case 2:
        return roomConfigs.length > 0 && roomConfigs.every((r) => r.count > 0 && r.pricePerNight >= 0);
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }

  async function handleNext() {
    if (!canProceed()) return;
    setSaving(true);
    try {
      if (currentStep === 1) {
        const res = await apiRequest("POST", "/api/onboarding/property", {
          name: propertyName,
          type: propertyType,
          country,
          city,
          timezone,
          totalUnits: totalRooms,
        });
        const data = await res.json();
        if (data.propertyId) setCreatedPropertyId(data.propertyId);
        await apiRequest("POST", "/api/onboarding/plan", { planCode: selectedPlanCode });
        await updateProgressMutation.mutateAsync({
          currentStep: 2,
          propertyCompleted: true,
          completedSteps: [1],
        });
      } else if (currentStep === 2) {
        const propId = createdPropertyId || existingProperties?.[0]?.id;
        if (propId) {
          await apiRequest("POST", "/api/onboarding/rooms", {
            propertyId: propId,
            rooms: roomConfigs,
            pricingModel,
          });
        }
        await updateProgressMutation.mutateAsync({
          currentStep: 3,
          unitsCompleted: true,
          completedSteps: [1, 2],
        });
      } else if (currentStep === 3) {
        const taxRate = parseFloat(countryTaxRate) || 0;
        const utilityPct = parseFloat(utilityExpensePct) || 0;
        const cleaningMonthly = parseFloat(cleaningExpenseMonthly) || 0;
        const empTaxRate = parseFloat(defaultEmployeeTaxRate) || 0;
        const additionalMonthly = parseFloat(additionalExpensesMonthly) || 0;
        await apiRequest("POST", "/api/onboarding/financial", {
          countryTaxRate: Math.round(taxRate),
          utilityExpensePct: Math.round(utilityPct),
          cleaningExpenseMonthly: Math.round(cleaningMonthly * 100),
          defaultEmployeeTaxRate: Math.round(empTaxRate),
          additionalExpensesMonthly: Math.round(additionalMonthly * 100),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      } else if (currentStep === 4) {
        const propId = createdPropertyId || existingProperties?.[0]?.id;
        const validStaff = staffMembers.filter((s) => s.email.trim().length > 0);
        if (propId && validStaff.length > 0) {
          await apiRequest("POST", "/api/onboarding/staff", {
            propertyId: propId,
            staff: validStaff,
          });
        }
        await updateProgressMutation.mutateAsync({
          currentStep: 5,
          staffCompleted: true,
          smartSystemCompleted: true,
          subscriptionCompleted: true,
          completedSteps: [1, 2, 3, 4, 5],
        });
      }
      setCurrentStep((s) => Math.min(s + 1, 5));
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    setSaving(true);
    try {
      await apiRequest("POST", "/api/onboarding/activate", {});
      await updateProgressMutation.mutateAsync({
        isComplete: true,
        completedSteps: [1, 2, 3, 4],
      });
      toast({ title: t("onboarding.activated") });
      setLocation("/dashboard");
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function formatCurrency(val: string) {
    const n = parseFloat(val);
    return isNaN(n) ? "—" : `$${n.toLocaleString()}`;
  }
  function formatPct(val: string) {
    const n = parseFloat(val);
    return isNaN(n) || n === 0 ? "—" : `${n}%`;
  }

  function addRoom() {
    const usedTypes = roomConfigs.map((r) => r.type);
    const available = ROOM_TYPES.find((rt) => !usedTypes.includes(rt));
    if (available) {
      setRoomConfigs([...roomConfigs, { type: available, count: 1, pricePerNight: 100 }]);
    }
  }

  function removeRoom(index: number) {
    setRoomConfigs(roomConfigs.filter((_, i) => i !== index));
  }

  function updateRoom(index: number, field: keyof RoomConfig, value: string | number) {
    const updated = [...roomConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setRoomConfigs(updated);
  }

  function addStaff() {
    setStaffMembers([...staffMembers, { email: "", role: "front_desk" }]);
  }

  function removeStaff(index: number) {
    setStaffMembers(staffMembers.filter((_, i) => i !== index));
  }

  function updateStaff(index: number, field: keyof StaffMember, value: string) {
    const updated = [...staffMembers];
    updated[index] = { ...updated[index], [field]: value };
    setStaffMembers(updated);
  }

  if (loadingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={t("onboarding.title")} description="Set up your property on O.S.S Smart Hotel System" path="/dashboard" noindex />

      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold" data-testid="text-onboarding-title">{t("onboarding.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("onboarding.step")} {activeStepIndex + 1} / {STEPS.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" data-testid="progress-onboarding" />
            <div className="flex justify-between gap-1">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                      isActive ? "text-primary font-medium" : isCompleted ? "text-primary/60" : "text-muted-foreground"
                    }`}
                    data-testid={`step-indicator-${step.id}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:block">{t(step.labelKey)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        {currentStep === 1 && (
          <>
          <div className="mb-4 space-y-3" data-testid="plan-selection">
            <div>
              <h3 className="text-base font-semibold">{t("onboarding.plan.title", "Abunəlik Planı Seçin")}</h3>
              <p className="text-sm text-muted-foreground">{t("onboarding.plan.desc", "Trial müddətindən sonra ödənişli plana keçəcəksiniz")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { code: "CORE_STARTER", label: "Starter", price: "$79/ay", icon: Star, features: ["1 əmlak", "20 otaq", "5 işçi"], color: "border-border" },
                { code: "CORE_GROWTH", label: "Growth", price: "$129/ay", icon: Rocket, features: ["3 əmlak", "30 otaq/əmlak", "20 işçi", "Analitika"], color: "border-blue-500" },
                { code: "CORE_PRO", label: "Pro", price: "$199/ay", icon: Crown, features: ["Limitsiz əmlak", "Limitsiz otaq", "Limitsiz işçi", "Tam analitika"], color: "border-primary", badge: "Tövsiyə" },
              ] as const).map(({ code, label, price, icon: Icon, features, color, badge }) => (
                <button
                  key={code}
                  type="button"
                  data-testid={`plan-card-${code}`}
                  onClick={() => setSelectedPlanCode(code)}
                  className={`text-left rounded-lg border-2 p-3 transition-all ${selectedPlanCode === code ? `${color} bg-primary/5 shadow-sm` : "border-border hover:border-muted-foreground/50"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${selectedPlanCode === code ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-semibold text-sm">{label}</span>
                    </div>
                    {badge && <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">{badge}</Badge>}
                  </div>
                  <p className="text-xs font-medium text-primary mb-2">{price}</p>
                  <ul className="space-y-0.5">
                    {features.map(f => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {selectedPlanCode === code && <p className="mt-2 text-xs font-medium text-primary">{t("onboarding.plan.selected", "Seçildi")}</p>}
                </button>
              ))}
            </div>
          </div>
          <Card data-testid="step-property-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t("onboarding.property.title")}
              </CardTitle>
              <CardDescription>{t("onboarding.property.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyName">{t("onboarding.property.name")} *</Label>
                <Input
                  id="propertyName"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder={t("onboarding.property.namePlaceholder")}
                  data-testid="input-property-name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("onboarding.property.type")} *</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger data-testid="select-property-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((pt) => (
                      <SelectItem key={pt} value={pt}>{t(`onboarding.propertyTypes.${pt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {t("onboarding.property.country")} *
                  </Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t("onboarding.property.countryPlaceholder")}
                    data-testid="input-country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    <Globe className="inline h-4 w-4 mr-1" />
                    {t("onboarding.property.city")} *
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("onboarding.property.cityPlaceholder")}
                    data-testid="input-city"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t("onboarding.property.timezone")}
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {currentStep === 2 && (
          <Card data-testid="step-room-setup">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                {t("onboarding.rooms.title")}
              </CardTitle>
              <CardDescription>{t("onboarding.rooms.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("onboarding.rooms.pricingModel")}</Label>
                <Select value={pricingModel} onValueChange={setPricingModel}>
                  <SelectTrigger data-testid="select-pricing-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_MODELS.map((pm) => (
                      <SelectItem key={pm} value={pm}>{t(`onboarding.pricingModels.${pm}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label>{t("onboarding.rooms.roomTypes")}</Label>
                  <Button size="sm" variant="outline" onClick={addRoom} disabled={roomConfigs.length >= ROOM_TYPES.length} data-testid="button-add-room">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("onboarding.rooms.addType")}
                  </Button>
                </div>
                {roomConfigs.map((room, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-end" data-testid={`room-config-${idx}`}>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("onboarding.rooms.type")}</Label>
                      <Select value={room.type} onValueChange={(v) => updateRoom(idx, "type", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPES.map((rt) => (
                            <SelectItem key={rt} value={rt}>{t(`onboarding.roomTypes.${rt}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("onboarding.rooms.count")}</Label>
                      <Input type="number" min={1} value={room.count === 0 ? "" : room.count} onChange={(e) => updateRoom(idx, "count", e.target.value === "" ? 0 : parseInt(e.target.value) || 0)} onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 1) updateRoom(idx, "count", 1); }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("onboarding.rooms.price")}</Label>
                      <Input type="number" min={0} value={room.pricePerNight === 0 ? "" : room.pricePerNight} onChange={(e) => updateRoom(idx, "pricePerNight", e.target.value === "" ? 0 : parseInt(e.target.value) || 0)} />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeRoom(idx)} disabled={roomConfigs.length <= 1} className="mb-0.5">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.rooms.total")}: <span className="font-medium text-foreground">{totalRooms}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card data-testid="step-finance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t("onboarding.finance.title")}
              </CardTitle>
              <CardDescription>
                {t("onboarding.finance.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="countryTaxRate" className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    {t("onboarding.finance.taxRate")}
                  </Label>
                  <Input
                    id="countryTaxRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={countryTaxRate}
                    onChange={(e) => setCountryTaxRate(e.target.value)}
                    placeholder={t("onboarding.finance.taxRatePlaceholder")}
                    data-testid="input-country-tax-rate"
                  />
                  <p className="text-xs text-muted-foreground">{t("onboarding.finance.taxRateHint")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utilityExpensePct" className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    {t("onboarding.finance.utilityPct")}
                  </Label>
                  <Input
                    id="utilityExpensePct"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={utilityExpensePct}
                    onChange={(e) => setUtilityExpensePct(e.target.value)}
                    placeholder={t("onboarding.finance.utilityPctPlaceholder")}
                    data-testid="input-utility-expense-pct"
                  />
                  <p className="text-xs text-muted-foreground">{t("onboarding.finance.utilityPctHint")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleaningExpenseMonthly" className="flex items-center gap-1">
                    <Brush className="h-3.5 w-3.5" />
                    {t("onboarding.finance.cleaningMonthly")}
                  </Label>
                  <Input
                    id="cleaningExpenseMonthly"
                    type="number"
                    min={0}
                    step={1}
                    value={cleaningExpenseMonthly}
                    onChange={(e) => setCleaningExpenseMonthly(e.target.value)}
                    placeholder={t("onboarding.finance.cleaningMonthlyPlaceholder")}
                    data-testid="input-cleaning-expense"
                  />
                  <p className="text-xs text-muted-foreground">{t("onboarding.finance.cleaningMonthlyHint")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultEmployeeTaxRate" className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {t("onboarding.finance.employeeTaxRate")}
                  </Label>
                  <Input
                    id="defaultEmployeeTaxRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={defaultEmployeeTaxRate}
                    onChange={(e) => setDefaultEmployeeTaxRate(e.target.value)}
                    placeholder={t("onboarding.finance.employeeTaxRatePlaceholder")}
                    data-testid="input-employee-tax-rate"
                  />
                  <p className="text-xs text-muted-foreground">{t("onboarding.finance.employeeTaxRateHint")}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-orange-50/50 dark:bg-orange-950/20">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-orange-600" />
                  <p className="font-medium text-sm">{t("onboarding.finance.additionalExpenses")}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("onboarding.finance.additionalExpensesHint")}</p>
                <div className="space-y-2">
                  <Label htmlFor="additionalExpensesMonthly" className="flex items-center gap-1 text-sm">
                    {t("onboarding.finance.additionalExpensesLabel")}
                  </Label>
                  <Input
                    id="additionalExpensesMonthly"
                    type="number"
                    min={0}
                    step={1}
                    value={additionalExpensesMonthly}
                    onChange={(e) => setAdditionalExpensesMonthly(e.target.value)}
                    placeholder={t("onboarding.finance.additionalExpensesPlaceholder")}
                    data-testid="input-additional-expenses"
                  />
                  <p className="text-xs text-muted-foreground">{t("onboarding.finance.additionalExpensesExample")}</p>
                </div>
              </div>

              <div className="p-4 rounded-md bg-muted/30 text-sm space-y-1">
                <p className="font-medium text-foreground mb-2">{t("onboarding.finance.sampleCalc")}</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("onboarding.finance.utilityCost")} ({utilityExpensePct || 0}%)</span>
                  <span className="text-red-500">${((parseFloat(utilityExpensePct) || 0) * 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("onboarding.finance.taxCost")} ({countryTaxRate || 0}%)</span>
                  <span className="text-red-500">${((parseFloat(countryTaxRate) || 0) * 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("onboarding.finance.cleaningCost")}</span>
                  <span className="text-red-500">${parseFloat(cleaningExpenseMonthly) || 0}</span>
                </div>
                {(parseFloat(additionalExpensesMonthly) || 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("onboarding.finance.additionalCost")}</span>
                    <span className="text-red-500">${parseFloat(additionalExpensesMonthly) || 0}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-1 mt-1">
                  <span>{t("onboarding.finance.totalAutoCost")}</span>
                  <span className="text-red-600">
                    ${(
                      (parseFloat(utilityExpensePct) || 0) * 100 +
                      (parseFloat(countryTaxRate) || 0) * 100 +
                      (parseFloat(cleaningExpenseMonthly) || 0) +
                      (parseFloat(additionalExpensesMonthly) || 0)
                    ).toFixed(0)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">{t("onboarding.finance.skipNote")}</p>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card data-testid="step-staff">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("onboarding.staff.title")}
              </CardTitle>
              <CardDescription>{t("onboarding.staff.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={addStaff} data-testid="button-add-staff">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("onboarding.staff.add")}
              </Button>

              {staffMembers.length === 0 && (
                <p className="text-sm text-muted-foreground italic">{t("onboarding.staff.skipNote")}</p>
              )}

              {staffMembers.map((staff, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_140px_auto] gap-2 items-end" data-testid={`staff-row-${idx}`}>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      <Mail className="inline h-3 w-3 mr-1" />
                      {t("onboarding.staff.email")}
                    </Label>
                    <Input
                      type="email"
                      value={staff.email}
                      onChange={(e) => updateStaff(idx, "email", e.target.value)}
                      placeholder="staff@hotel.com"
                      data-testid={`input-staff-email-${idx}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("onboarding.staff.role")}</Label>
                    <Select value={staff.role} onValueChange={(v) => updateStaff(idx, "role", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((sr) => (
                          <SelectItem key={sr} value={sr}>{t(`onboarding.staffRoles.${sr}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeStaff(idx)} className="mb-0.5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card data-testid="step-review">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                {t("onboarding.review.title")}
              </CardTitle>
              <CardDescription>{t("onboarding.review.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-md bg-muted/30 space-y-2">
                  <h4 className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4" /> {t("onboarding.review.property")}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t("onboarding.property.name")}:</span>
                    <span data-testid="review-property-name">{propertyName}</span>
                    <span className="text-muted-foreground">{t("onboarding.property.type")}:</span>
                    <span>{t(`onboarding.propertyTypes.${propertyType}`)}</span>
                    <span className="text-muted-foreground">{t("onboarding.property.country")}:</span>
                    <span>{country}, {city}</span>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-muted/30 space-y-2">
                  <h4 className="font-medium flex items-center gap-2"><BedDouble className="h-4 w-4" /> {t("onboarding.review.rooms")}</h4>
                  <div className="text-sm space-y-1">
                    {roomConfigs.map((r, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{t(`onboarding.roomTypes.${r.type}`)} x{r.count}</span>
                        <span className="text-muted-foreground">${r.pricePerNight}/{pricingModel === "nightly" ? t("onboarding.pricingModels.nightly") : t("onboarding.pricingModels.monthly")}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t font-medium flex justify-between">
                      <span>{t("onboarding.rooms.total")}</span>
                      <span>{totalRooms}</span>
                    </div>
                  </div>
                </div>

                {(countryTaxRate || utilityExpensePct || cleaningExpenseMonthly || defaultEmployeeTaxRate) && (
                  <div className="p-4 rounded-md bg-muted/30 space-y-2">
                    <h4 className="font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" /> Maliyyə Ayarları</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {countryTaxRate && <><span className="text-muted-foreground">Ölkə vergisi:</span><span>{countryTaxRate}%</span></>}
                      {utilityExpensePct && <><span className="text-muted-foreground">Kommunal:</span><span>{utilityExpensePct}% gəlirdən</span></>}
                      {cleaningExpenseMonthly && <><span className="text-muted-foreground">Təmizlik:</span><span>${cleaningExpenseMonthly}/ay</span></>}
                      {defaultEmployeeTaxRate && <><span className="text-muted-foreground">İşçi vergisi:</span><span>{defaultEmployeeTaxRate}%</span></>}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-md bg-muted/30 space-y-2">
                  <h4 className="font-medium flex items-center gap-2"><Users className="h-4 w-4" /> {t("onboarding.review.staff")}</h4>
                  {staffMembers.length > 0 ? (
                    <div className="text-sm space-y-1">
                      {staffMembers.map((s, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{s.email}</span>
                          <Badge variant="secondary">{t(`onboarding.staffRoles.${s.role}`)}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("onboarding.review.noStaff")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || saving} data-testid="button-back">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("onboarding.back")}
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed() || saving} data-testid="button-next">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t("onboarding.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleActivate} disabled={saving} data-testid="button-activate">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Sparkles className="h-4 w-4 mr-1" />
              {t("onboarding.activate")}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
