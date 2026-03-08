import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  BarChart3,
  Clock,
  Sunrise,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
} from "lucide-react";

interface PricingRule {
  id: string;
  propertyId: string;
  tenantId: string | null;
  name: string;
  ruleType: string;
  priority: number;
  conditions: any;
  adjustment: { type: "percentage" | "fixed"; value: number };
  isActive: boolean;
  createdAt: string;
}

function getRuleTypeIcon(ruleType: string) {
  const map: Record<string, any> = {
    day_of_week: CalendarDays,
    occupancy: BarChart3,
    seasonal: Calendar,
    last_minute: Clock,
    early_bird: Sunrise,
  };
  return map[ruleType] || CalendarDays;
}

function formatAdjustment(adj: { type: string; value: number }): string {
  if (adj.type === "percentage") {
    return `${adj.value > 0 ? "+" : ""}${adj.value}%`;
  }
  const dollars = (adj.value / 100).toFixed(2);
  return `${adj.value > 0 ? "+" : ""}${dollars}`;
}

interface DynamicPricingSectionProps {
  propertyId: string;
}

export function DynamicPricingSection({ propertyId }: DynamicPricingSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const dayNames = [
    t('dynamicPricing.sun'), t('dynamicPricing.mon'), t('dynamicPricing.tue'),
    t('dynamicPricing.wed'), t('dynamicPricing.thu'), t('dynamicPricing.fri'), t('dynamicPricing.sat')
  ];

  const ruleTypeLabels: Record<string, string> = {
    day_of_week: t('dynamicPricing.dayOfWeek'),
    occupancy: t('dynamicPricing.occupancyBased'),
    seasonal: t('dynamicPricing.seasonal'),
    last_minute: t('dynamicPricing.lastMinute'),
    early_bird: t('dynamicPricing.earlyBird'),
  };

  function formatConditions(rule: PricingRule): string {
    const c = rule.conditions;
    switch (rule.ruleType) {
      case "day_of_week":
        return (c.days || []).map((d: number) => dayNames[d]).join(", ");
      case "occupancy":
        return `${c.direction === "below" ? t('dynamicPricing.below') : t('dynamicPricing.above')} ${c.threshold}%`;
      case "seasonal":
        return `${c.startDate} → ${c.endDate}`;
      case "last_minute":
        return `${t('dynamicPricing.within')} ${c.withinDays} ${t('dynamicPricing.rule')}`;
      case "early_bird":
        return `${c.daysAhead}+ ${t('dynamicPricing.daysAheadSuffix')}`;
      default:
        return JSON.stringify(c);
    }
  }

  const { data: rules = [], isLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/pricing/rules", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/pricing/rules/${propertyId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!propertyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pricing/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/rules", propertyId] });
      toast({ title: t('dynamicPricing.ruleDeleted') });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/pricing/rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/rules", propertyId] });
    },
  });

  function handleEdit(rule: PricingRule) {
    setEditingRule(rule);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingRule(null);
    setDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="pricing-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="dynamic-pricing-section">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{t('dynamicPricing.rulesTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('dynamicPricing.rulesDescription')}
          </p>
        </div>
        <Button size="sm" onClick={handleCreate} data-testid="button-add-pricing-rule">
          <Plus className="h-4 w-4 mr-1" />
          {t('dynamicPricing.addRule')}
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card data-testid="pricing-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {t('dynamicPricing.emptyState')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const Icon = getRuleTypeIcon(rule.ruleType);
            const isPositive = rule.adjustment.value > 0;
            return (
              <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""} data-testid={`pricing-rule-${rule.id}`}>
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate" data-testid={`text-rule-name-${rule.id}`}>{rule.name}</span>
                        <Badge variant="outline" className="text-xs shrink-0" data-testid={`badge-rule-type-${rule.id}`}>
                          {ruleTypeLabels[rule.ruleType] || rule.ruleType}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0">
                          P{rule.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-rule-conditions-${rule.id}`}>
                        {formatConditions(rule)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={isPositive ? "default" : "secondary"}
                      className={`text-sm font-mono ${isPositive ? "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" : "bg-green-500/10 text-green-600 hover:bg-green-500/20"}`}
                      data-testid={`badge-adjustment-${rule.id}`}
                    >
                      {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatAdjustment(rule.adjustment)}
                    </Badge>

                    <Switch
                      checked={rule.isActive ?? true}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                      data-testid={`switch-rule-active-${rule.id}`}
                    />

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)} data-testid={`button-edit-rule-${rule.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-rule-${rule.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PricePreviewPanel propertyId={propertyId} rulesCount={rules.length} />

      <PricingRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        editingRule={editingRule}
      />
    </div>
  );
}

interface UnitOption {
  id: string;
  unitNumber: string;
  name: string | null;
  pricePerNight: number | null;
}

interface DailyPrice {
  date: string;
  basePrice: number;
  finalPrice: number;
  appliedRules: Array<{
    ruleId: string;
    ruleName: string;
    ruleType: string;
    adjustmentType: string;
    adjustmentValue: number;
    priceImpact: number;
  }>;
}

interface PriceCalcResponse {
  nights: number;
  totalBasePrice: number;
  totalDynamicPrice: number;
  averageDynamicPrice: number;
  dailyBreakdown: DailyPrice[];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function PricePreviewPanel({ propertyId, rulesCount }: { propertyId: string; rulesCount: number }) {
  const { t } = useTranslation();
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const { data: units = [] } = useQuery<UnitOption[]>({
    queryKey: ["/api/properties", propertyId, "units"],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/units`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!propertyId,
  });

  const accommodationUnits = units.filter((u: any) => u.unitCategory === "accommodation" || !u.unitCategory);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = today.toISOString().split("T")[0];
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  const checkOut = endDate.toISOString().split("T")[0];

  const { data: preview, isLoading: previewLoading } = useQuery<PriceCalcResponse>({
    queryKey: ["/api/pricing/calculate", propertyId, selectedUnitId, checkIn, checkOut, rulesCount],
    queryFn: async () => {
      const params = new URLSearchParams({ propertyId, unitId: selectedUnitId, checkIn, checkOut });
      const res = await fetch(`/api/pricing/calculate?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to calculate");
      return res.json();
    },
    enabled: !!selectedUnitId && !!propertyId,
  });

  return (
    <Card data-testid="price-preview-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {t('dynamicPricing.pricePreview')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('dynamicPricing.selectRoom')}</Label>
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger className="h-8 text-sm" data-testid="select-preview-unit">
              <SelectValue placeholder={t('dynamicPricing.chooseRoom')} />
            </SelectTrigger>
            <SelectContent>
              {accommodationUnits.map((u) => (
                <SelectItem key={u.id} value={u.id} data-testid={`option-preview-unit-${u.id}`}>
                  {u.unitNumber}{u.name ? ` - ${u.name}` : ""} ({u.pricePerNight ?? 0} base)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedUnitId && (
          <p className="text-xs text-muted-foreground text-center py-4" data-testid="preview-empty">
            {t('dynamicPricing.selectRoomHint')}
          </p>
        )}

        {selectedUnitId && previewLoading && (
          <div className="flex items-center justify-center py-6" data-testid="preview-loading">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {selectedUnitId && preview && !previewLoading && (
          <div className="space-y-3" data-testid="preview-results">
            <div className="grid grid-cols-7 gap-1">
              {preview.dailyBreakdown.map((day) => {
                const hasRules = day.appliedRules.length > 0;
                const diff = day.finalPrice - day.basePrice;
                const isUp = diff > 0;
                const isDown = diff < 0;
                return (
                  <div
                    key={day.date}
                    className={`rounded-lg border p-2 text-center text-xs space-y-1 transition-colors ${
                      hasRules
                        ? isUp
                          ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
                          : "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                        : "border-border"
                    }`}
                    data-testid={`preview-day-${day.date}`}
                  >
                    <div className="font-medium text-[10px] text-muted-foreground truncate">
                      {formatDateShort(day.date)}
                    </div>
                    <div className={`font-bold text-sm ${isUp ? "text-orange-600 dark:text-orange-400" : isDown ? "text-green-600 dark:text-green-400" : ""}`}>
                      {day.finalPrice}
                    </div>
                    {hasRules && (
                      <div className={`text-[10px] ${isUp ? "text-orange-500" : "text-green-500"}`}>
                        {isUp ? "+" : ""}{diff}
                      </div>
                    )}
                    {hasRules && (
                      <div className="text-[9px] text-muted-foreground truncate" title={day.appliedRules.map(r => r.ruleName).join(", ")}>
                        {day.appliedRules.length} {day.appliedRules.length > 1 ? t('dynamicPricing.rules') : t('dynamicPricing.rule')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span data-testid="preview-base-total">{t('dynamicPricing.baseTotal')}: {preview.totalBasePrice}</span>
              <span data-testid="preview-dynamic-total" className="font-semibold text-foreground">
                {t('dynamicPricing.dynamicTotal')}: {preview.totalDynamicPrice}
              </span>
              <span data-testid="preview-avg-price">{t('dynamicPricing.avgPerNight')}: {preview.averageDynamicPrice}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PricingRuleDialog({
  open,
  onOpenChange,
  propertyId,
  editingRule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  editingRule: PricingRule | null;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isEditing = !!editingRule;

  const dayNames = [
    t('dynamicPricing.sun'), t('dynamicPricing.mon'), t('dynamicPricing.tue'),
    t('dynamicPricing.wed'), t('dynamicPricing.thu'), t('dynamicPricing.fri'), t('dynamicPricing.sat')
  ];

  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState("day_of_week");
  const [priority, setPriority] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">("percentage");
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  const [selectedDays, setSelectedDays] = useState<number[]>([5, 6]);
  const [occupancyThreshold, setOccupancyThreshold] = useState(80);
  const [occupancyDirection, setOccupancyDirection] = useState<"above" | "below">("above");
  const [seasonStart, setSeasonStart] = useState("06-01");
  const [seasonEnd, setSeasonEnd] = useState("08-31");
  const [withinDays, setWithinDays] = useState(3);
  const [daysAhead, setDaysAhead] = useState(30);

  const ruleTypes = [
    { value: "day_of_week", label: t('dynamicPricing.dayOfWeek'), icon: CalendarDays },
    { value: "occupancy", label: t('dynamicPricing.occupancyBased'), icon: BarChart3 },
    { value: "seasonal", label: t('dynamicPricing.seasonal'), icon: Calendar },
    { value: "last_minute", label: t('dynamicPricing.lastMinute'), icon: Clock },
    { value: "early_bird", label: t('dynamicPricing.earlyBird'), icon: Sunrise },
  ];

  useEffect(() => {
    if (!open) return;
    if (editingRule) {
      setName(editingRule.name);
      setRuleType(editingRule.ruleType);
      setPriority(editingRule.priority);
      setAdjustmentType(editingRule.adjustment.type);
      setAdjustmentValue(editingRule.adjustment.value);
      const c = editingRule.conditions;
      if (editingRule.ruleType === "day_of_week") setSelectedDays(c.days || [5, 6]);
      if (editingRule.ruleType === "occupancy") {
        setOccupancyThreshold(c.threshold || 80);
        setOccupancyDirection(c.direction || "above");
      }
      if (editingRule.ruleType === "seasonal") {
        setSeasonStart(c.startDate || "06-01");
        setSeasonEnd(c.endDate || "08-31");
      }
      if (editingRule.ruleType === "last_minute") setWithinDays(c.withinDays || 3);
      if (editingRule.ruleType === "early_bird") setDaysAhead(c.daysAhead || 30);
    } else {
      setName("");
      setRuleType("day_of_week");
      setPriority(0);
      setAdjustmentType("percentage");
      setAdjustmentValue(0);
      setSelectedDays([5, 6]);
      setOccupancyThreshold(80);
      setOccupancyDirection("above");
      setSeasonStart("06-01");
      setSeasonEnd("08-31");
      setWithinDays(3);
      setDaysAhead(30);
    }
  }, [editingRule, open]);

  function buildConditions() {
    switch (ruleType) {
      case "day_of_week":
        return { days: selectedDays };
      case "occupancy":
        return { threshold: occupancyThreshold, direction: occupancyDirection };
      case "seasonal":
        return { startDate: seasonStart, endDate: seasonEnd };
      case "last_minute":
        return { withinDays };
      case "early_bird":
        return { daysAhead };
      default:
        return {};
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        propertyId,
        name,
        ruleType,
        priority,
        conditions: buildConditions(),
        adjustment: { type: adjustmentType, value: adjustmentValue },
        isActive: true,
      };

      if (isEditing) {
        const { propertyId: _, ...updatePayload } = payload;
        await apiRequest("PATCH", `/api/pricing/rules/${editingRule!.id}`, updatePayload);
      } else {
        await apiRequest("POST", "/api/pricing/rules", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/rules", propertyId] });
      toast({ title: isEditing ? t('dynamicPricing.ruleUpdated') : t('dynamicPricing.ruleCreated') });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: t('dynamicPricing.saveFailed'), variant: "destructive" });
    },
  });

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="pricing-rule-dialog">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? t('dynamicPricing.editRule') : t('dynamicPricing.createRule')}
          </DialogTitle>
          <DialogDescription>
            {t('dynamicPricing.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3 px-4 sm:px-6 overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">{t('dynamicPricing.ruleName')}</Label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dynamicPricing.ruleNamePlaceholder')}
              data-testid="input-rule-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('dynamicPricing.ruleType')}</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger data-testid="select-rule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value} data-testid={`option-rule-type-${rt.value}`}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-1" />

          {ruleType === "day_of_week" && (
            <div className="space-y-2" data-testid="conditions-day-of-week">
              <Label>{t('dynamicPricing.selectDays')}</Label>
              <div className="flex gap-2 flex-wrap">
                {dayNames.map((dayName, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                      selectedDays.includes(idx)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                    data-testid={`checkbox-day-${idx}`}
                  >
                    <Checkbox
                      checked={selectedDays.includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                      className="sr-only"
                    />
                    {dayName}
                  </label>
                ))}
              </div>
            </div>
          )}

          {ruleType === "occupancy" && (
            <div className="space-y-4" data-testid="conditions-occupancy">
              <div className="space-y-1.5">
                <Label>{t('dynamicPricing.direction')}</Label>
                <Select value={occupancyDirection} onValueChange={(v) => setOccupancyDirection(v as "above" | "below")}>
                  <SelectTrigger data-testid="select-occupancy-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">{t('dynamicPricing.aboveThreshold')}</SelectItem>
                    <SelectItem value="below">{t('dynamicPricing.belowThreshold')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('dynamicPricing.occupancyThreshold')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={occupancyThreshold}
                  onChange={(e) => setOccupancyThreshold(Number(e.target.value))}
                  data-testid="input-occupancy-threshold"
                />
              </div>
            </div>
          )}

          {ruleType === "seasonal" && (
            <div className="grid grid-cols-2 gap-4" data-testid="conditions-seasonal">
              <div className="space-y-1.5">
                <Label>{t('dynamicPricing.startDate')}</Label>
                <Input
                  value={seasonStart}
                  onChange={(e) => setSeasonStart(e.target.value)}
                  placeholder="06-01"
                  data-testid="input-season-start"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('dynamicPricing.endDate')}</Label>
                <Input
                  value={seasonEnd}
                  onChange={(e) => setSeasonEnd(e.target.value)}
                  placeholder="08-31"
                  data-testid="input-season-end"
                />
              </div>
            </div>
          )}

          {ruleType === "last_minute" && (
            <div className="space-y-1.5" data-testid="conditions-last-minute">
              <Label>{t('dynamicPricing.withinDays')}</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={withinDays}
                onChange={(e) => setWithinDays(Number(e.target.value))}
                data-testid="input-within-days"
              />
            </div>
          )}

          {ruleType === "early_bird" && (
            <div className="space-y-1.5" data-testid="conditions-early-bird">
              <Label>{t('dynamicPricing.daysAhead')}</Label>
              <Input
                type="number"
                min={7}
                max={365}
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                data-testid="input-days-ahead"
              />
            </div>
          )}

          <Separator className="my-1" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('dynamicPricing.adjustmentType')}</Label>
              <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as "percentage" | "fixed")}>
                <SelectTrigger data-testid="select-adjustment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> {t('dynamicPricing.percentage')}</span>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {t('dynamicPricing.fixedAmount')}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{adjustmentType === "percentage" ? t('dynamicPricing.valuePct') : t('dynamicPricing.valueCents')}</Label>
              <Input
                type="number"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                placeholder={adjustmentType === "percentage" ? t('dynamicPricing.pctPlaceholder') : t('dynamicPricing.fixedPlaceholder')}
                data-testid="input-adjustment-value"
              />
              <p className="text-xs text-muted-foreground">
                {adjustmentValue > 0 ? t('dynamicPricing.priceIncrease') : adjustmentValue < 0 ? t('dynamicPricing.priceDecrease') : t('dynamicPricing.noChange')}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('dynamicPricing.priority')}</Label>
            <Input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              data-testid="input-priority"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-rule">
            {t('dynamicPricing.cancel')}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || saveMutation.isPending}
            data-testid="button-save-rule"
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEditing ? t('dynamicPricing.update') : t('dynamicPricing.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
