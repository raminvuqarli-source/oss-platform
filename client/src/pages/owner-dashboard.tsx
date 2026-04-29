import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearch } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UnitStatusBadge, getUnitStatusLabel, getUnitStatusColor } from "@/components/unit-status-badge";
import { PriorityBadge, getPriorityColor } from "@/components/priority-indicator";
import {
  Building2,
  Home,
  Cpu,
  Users,
  Plus,
  Pencil,
  MapPin,
  Globe,
  CreditCard,
  BarChart3,
  BedDouble,
  DoorOpen,
  Shield,
  Activity,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Crown,
  Star,
  Wifi,
  WifiOff,
  Utensils,
  ParkingCircle,
  Package,
  Dumbbell,
  CalendarDays,
  Presentation,
  TreePine,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  UserPlus,
  Mail,
  Trash2,
  Link,
  KeyRound,
  DollarSign,
  TrendingDown,
  Receipt,
  RefreshCw,
  Wallet,
  Send,
  Inbox,
  CircleDot,
  Lock,
  LockOpen,
  Camera,
  Upload,
  ImageIcon,
  X as XIcon,
  UtensilsCrossed,
  Network,
  ExternalLink,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SiWhatsapp } from "react-icons/si";
import { showErrorToast, isPlanLimitError } from "@/lib/error-handler";
import { formatTimeAgo } from "@/lib/formatters";
import { UpgradeModal } from "@/components/upgrade-modal";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useChannexRealtime } from "@/hooks/use-channex-realtime";
import type { ChannexBookingEvent } from "@/hooks/use-channex-realtime";
import type { Property, Unit, Device, Subscription, StaffInvitation, ServiceRequest, ChatMessage, Escalation, EscalationReply } from "@shared/schema";
import { unitCategoryTypes, unitCategoryLabels, staffRoleLabels, type UnitCategory, type StaffRole, expenseCategories, revenueCategories, type EscalationStatus } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import ApartmentLiteDashboard from "@/pages/apartment-lite-dashboard";
import { StaffPerformanceView } from "@/components/staff-performance-view";
interface OwnerAnalyticsProperty {
  id: number;
  name: string;
  type: string;
  city: string | null;
  country: string | null;
  totalUnits: number;
  isActive: boolean;
  imageUrl?: string | null;
}

interface OwnerAnalytics {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalDevices: number;
  onlineDevices: number;
  totalStaff: number;
  subscription: { planType: string; featureFlags: Record<string, boolean> } | null;
  properties: OwnerAnalyticsProperty[];
}

const propertyTypeIcons: Record<string, string> = {
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  resort: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop",
  villa_complex: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
  tiny_house_village: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=300&fit=crop",
  apartment_rental: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
  glamping: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop",
};

const categoryIcons: Record<string, any> = {
  accommodation: BedDouble,
  meeting: Presentation,
  event: CalendarDays,
  dining: Utensils,
  wellness: Dumbbell,
  parking: ParkingCircle,
  storage: Package,
  common_area: TreePine,
};

const unitGroupMapping: Record<string, string> = {
  accommodation: "accommodation",
  meeting: "facility",
  event: "experience",
  dining: "facility",
  wellness: "experience",
  parking: "facility",
  storage: "facility",
  common_area: "facility",
};

const unitGroupIcons: Record<string, any> = {
  accommodation: BedDouble,
  facility: Building2,
  experience: Sparkles,
};


function formatTypeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function AddPropertyDialog({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("hotel");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [totalUnits, setTotalUnits] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/properties", {
        name,
        type,
        city: city || null,
        country: country || null,
        address: address || null,
        totalUnits: totalUnits ? parseInt(totalUnits) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('owner.propertyCreated'), description: t('owner.propertyCreatedDesc') });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/analytics"] });
      setOpen(false);
      setName("");
      setType("hotel");
      setCity("");
      setCountry("");
      setAddress("");
      setTotalUnits("");
      onSuccess();
    },
    onError: (error: any) => {
      if (isPlanLimitError(error)) { setUpgradeOpen(true); return; }
      toast({ title: t('errors.somethingWentWrong'), description: error?.message || t('owner.failedToCreateProperty'), variant: "destructive" });
    },
  });

  const propertyTypes = ["hotel", "resort", "villa_complex", "tiny_house_village", "apartment_rental", "glamping"];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2" data-testid="button-add-property">
            <Plus className="h-5 w-5" />
            {t('owner.addProperty')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('owner.addPropertyDialog.title')}</DialogTitle>
            <DialogDescription>{t('owner.addPropertyDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('owner.addPropertyDialog.propertyName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('owner.addPropertyDialog.propertyNamePlaceholder')} data-testid="input-property-name" />
            </div>
            <div className="space-y-2">
              <Label>{t('common.type')}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-property-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((value) => (
                    <SelectItem key={value} value={value}>{t(`owner.propertyTypes.${value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('owner.addPropertyDialog.city')}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('owner.addPropertyDialog.cityPlaceholder')} data-testid="input-property-city" />
              </div>
              <div className="space-y-2">
                <Label>{t('owner.addPropertyDialog.country')}</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('owner.addPropertyDialog.countryPlaceholder')} data-testid="input-property-country" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('owner.addPropertyDialog.address')}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('owner.addPropertyDialog.addressPlaceholder')} data-testid="input-property-address" />
            </div>
            <div className="space-y-2">
              <Label>{t('owner.addPropertyDialog.numberOfSpaces')}</Label>
              <Input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder={t('owner.addPropertyDialog.numberOfSpacesPlaceholder')} data-testid="input-property-units" />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-submit-property"
            >
              {createMutation.isPending ? t('common.creating') : t('owner.addPropertyDialog.createProperty')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} featureName="Multi-Property" />
    </>
  );
}

function AddUnitDialog({ propertyId, onSuccess }: { propertyId: string; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState("");
  const [floor, setFloor] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  const resetForm = () => {
    setStep(1);
    setSelectedCategory(null);
    setUnitNumber("");
    setUnitType("");
    setFloor("");
    setName("");
    setCapacity("");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/properties/${propertyId}/units`, {
        unitNumber,
        unitCategory: selectedCategory,
        unitType,
        name: name || null,
        floor: floor ? parseInt(floor) : null,
        capacity: capacity ? parseInt(capacity) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('owner.spaceAdded'), description: t('owner.spaceAddedDesc', { unitNumber }) });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "units"] });
      setOpen(false);
      resetForm();
      onSuccess();
    },
    onError: () => {
      toast({ title: t('errors.somethingWentWrong'), description: t('owner.failedToCreateSpace'), variant: "destructive" });
    },
  });

  const handleCategorySelect = (cat: UnitCategory) => {
    setSelectedCategory(cat);
    const types = unitCategoryTypes[cat];
    setUnitType(types[0]);
    setStep(2);
  };

  const groupedCategories = {
    accommodation: (Object.keys(unitCategoryTypes) as UnitCategory[]).filter(c => unitGroupMapping[c] === "accommodation"),
    facility: (Object.keys(unitCategoryTypes) as UnitCategory[]).filter(c => unitGroupMapping[c] === "facility"),
    experience: (Object.keys(unitCategoryTypes) as UnitCategory[]).filter(c => unitGroupMapping[c] === "experience"),
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2" data-testid="button-add-unit">
          <Plus className="h-5 w-5" />
          {t('owner.addUnitDialog.addSpace')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? t('owner.addUnitDialog.whatTypeOfSpace') : t('owner.addUnitDialog.spaceDetails')}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? t('owner.addUnitDialog.chooseCategory')
              : `${unitCategoryLabels[selectedCategory!]} — ${t('owner.addUnitDialog.fillDetails')}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4" data-testid="category-grid">
            {Object.entries(groupedCategories).map(([group, categories]) => (
              <div key={group}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t(`owner.unitGroups.${group}`)}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const Icon = categoryIcons[cat] || Home;
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate active-elevate-2 text-left transition-colors"
                        data-testid={`button-category-${cat}`}
                      >
                        <div className="p-2 rounded-md bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="text-sm font-medium block">{unitCategoryLabels[cat]}</span>
                          <span className="text-xs text-muted-foreground">{t('owner.addUnitDialog.types', { count: unitCategoryTypes[cat].length })}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} data-testid="button-back-category">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('owner.addUnitDialog.spaceNumber')}</Label>
                <Input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder={t('owner.addUnitDialog.spaceNumberPlaceholder')} data-testid="input-unit-number" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.type')}</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger data-testid="select-unit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitCategoryTypes[selectedCategory!].map((type) => (
                      <SelectItem key={type} value={type}>{formatTypeLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('owner.addUnitDialog.nameOptional')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('owner.addUnitDialog.namePlaceholder')} data-testid="input-unit-name" />
              </div>
              <div className="space-y-2">
                <Label>{t('owner.floor')}</Label>
                <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} data-testid="input-unit-floor" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('owner.addUnitDialog.capacity')}</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="2" data-testid="input-unit-capacity" />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!unitNumber || !unitType || createMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-submit-unit"
            >
              {createMutation.isPending ? t('common.creating') : t('owner.addUnitDialog.addSpace')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeletePropertyDialog({ propertyId, propertyName, onSuccess }: { propertyId: string; propertyName: string; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/properties/${propertyId}`, {});
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 400) {
          throw new Error(data.message || t('owner.failedToDeleteProperty'));
        }
        throw new Error(data.message || t('owner.failedToDeleteProperty'));
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('owner.propertyDeleted'), description: `${propertyName} ${t('owner.propertyDeletedDesc')}` });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/analytics"] });
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: t('errors.somethingWentWrong'), description: error?.message || t('owner.failedToDeleteProperty'), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" data-testid={`button-delete-property-${propertyId}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('owner.deleteProperty')}</DialogTitle>
          <DialogDescription>{t('owner.deletePropertyConfirm', { name: propertyName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-delete">
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({
  property,
  isSelected,
  onClick,
  onOpen,
  onDelete,
}: {
  property: OwnerAnalytics["properties"][0];
  isSelected: boolean;
  onClick: () => void;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgSrc = property.imageUrl || propertyTypeIcons[property.type] || propertyTypeIcons.hotel;
  const location = [property.city, property.country].filter(Boolean).join(", ");

  const uploadImageMutation = useMutation({
    mutationFn: async (imageUrl: string | null) => {
      const res = await apiRequest("PATCH", `/api/properties/${property.id}`, { imageUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('common.success', 'Success'), description: t('owner.imageUpdated', 'Property image updated') });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/analytics"] });
    },
    onError: () => {
      toast({ title: t('errors.somethingWentWrong'), description: t('owner.imageUpdateFailed', 'Failed to update image'), variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('errors.somethingWentWrong'), description: t('owner.imageTooLarge', 'Image must be under 2MB'), variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      uploadImageMutation.mutate(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <Card
      className={`overflow-visible hover-elevate cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
      data-testid={`card-property-${property.id}`}
    >
      <div className="relative group">
        <img
          src={imgSrc}
          alt={property.name}
          className="w-full h-40 object-cover rounded-t-md"
          loading="lazy"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          data-testid={`input-property-image-${property.id}`}
        />
        <div className="absolute inset-0 rounded-t-md bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 invisible group-hover:visible">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/60"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={uploadImageMutation.isPending}
              data-testid={`button-upload-image-${property.id}`}
            >
              <Camera className="h-4 w-4" />
            </Button>
            {property.imageUrl && (
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-black/60"
                onClick={(e) => { e.stopPropagation(); uploadImageMutation.mutate(null); }}
                disabled={uploadImageMutation.isPending}
                data-testid={`button-delete-image-${property.id}`}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={property.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}>
            {property.isActive ? t('common.active') : t('common.inactive')}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="backdrop-blur-sm">
            {t(`owner.propertyTypes.${property.type}`, property.type)}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base" data-testid={`text-property-name-${property.id}`}>
            {property.name}
          </h3>
          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <DoorOpen className="h-4 w-4" />
            <span>{property.totalUnits || 0} {t('common.spaces')}</span>
          </div>
          <div className="flex items-center gap-2">
            <DeletePropertyDialog propertyId={String(property.id)} propertyName={property.name} onSuccess={onDelete || (() => {})} />
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              data-testid={`button-open-property-${property.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('common.open')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyUnitsPanel({ propertyId }: { propertyId: string }) {
  const { t } = useTranslation();
  const { isFeatureEnabled } = usePlanFeatures();
  const smartEnabled = isFeatureEnabled("smart_controls");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [editUnit, setEditUnit] = useState<{ id: string; name: string; price: string } | null>(null);
  const { toast } = useToast();

  const editUnitMutation = useMutation({
    mutationFn: async ({ unitId, name, pricePerNight }: { unitId: string; name: string; pricePerNight?: number }) => {
      const body: Record<string, unknown> = { name };
      if (pricePerNight !== undefined) body.pricePerNight = pricePerNight;
      const res = await apiRequest("PATCH", `/api/units/${unitId}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "units"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units/status"] });
      setEditUnit(null);
      toast({ title: t('common.saved', 'Saved') });
    },
    onError: (err: any) => {
      toast({ title: t('errors.somethingWentWrong'), description: err.message, variant: "destructive" });
    },
  });

  const { data: units, isLoading } = useQuery<Unit[]>({
    queryKey: ["/api/properties", propertyId, "units"],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/units`, { credentials: "include" });
      if (!res.ok) throw new Error(t('errors.somethingWentWrong'));
      return res.json();
    },
  });

  const { data: doorActivity } = useQuery<Record<string, { opensToday: number; closesToday: number; currentlyLocked: boolean }>>({
    queryKey: ["/api/door-activity", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/door-activity/${propertyId}`, { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: smartEnabled,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 space-y-3">
              <div className="h-12 w-12 rounded-md bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const grouped: Record<string, { category: string; units: Unit[] }[]> = {
    accommodation: [],
    facility: [],
    experience: [],
  };

  if (units) {
    const byCat: Record<string, Unit[]> = {};
    for (const unit of units) {
      const cat = (unit as any).unitCategory || "accommodation";
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(unit);
    }
    for (const [cat, catUnits] of Object.entries(byCat)) {
      const group = unitGroupMapping[cat] || "facility";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push({ category: cat, units: catUnits });
    }
  }

  const activeGroups = Object.entries(grouped).filter(([_, cats]) => cats.some(c => c.units.length > 0));
  const displayedGroups = filterGroup === "all"
    ? activeGroups
    : activeGroups.filter(([g]) => g === filterGroup);

  return (
    <div className="space-y-6">
      <Dialog open={!!editUnit} onOpenChange={(open) => { if (!open) setEditUnit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('owner.editUnit', 'Edit Space')}</DialogTitle>
          </DialogHeader>
          {editUnit && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit-unit-name">{t('common.name', 'Name')}</Label>
                <Input
                  id="edit-unit-name"
                  autoFocus
                  value={editUnit.name}
                  onChange={(e) => setEditUnit({ ...editUnit, name: e.target.value })}
                  placeholder={t('owner.unitNamePlaceholder', 'e.g. Ocean View Villa')}
                  data-testid="input-edit-unit-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit-price">{t('owner.pricePerNight', 'Price per night ($)')}</Label>
                <Input
                  id="edit-unit-price"
                  type="number"
                  min={0}
                  step={1}
                  value={editUnit.price}
                  onChange={(e) => setEditUnit({ ...editUnit, price: e.target.value })}
                  placeholder="e.g. 150"
                  data-testid="input-edit-unit-price"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUnit(null)}>{t('common.cancel')}</Button>
                <Button
                  disabled={!editUnit.name.trim() || editUnitMutation.isPending}
                  onClick={() => {
                    const priceVal = editUnit.price ? Math.round(parseFloat(editUnit.price) * 100) : undefined;
                    editUnitMutation.mutate({ unitId: editUnit.id, name: editUnit.name.trim(), pricePerNight: priceVal });
                  }}
                  data-testid="button-save-unit-edit"
                >
                  {editUnitMutation.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filterGroup === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGroup("all")}
            data-testid="button-filter-all"
          >
            {t('common.all')} ({units?.length || 0})
          </Button>
          {Object.keys({ accommodation: true, facility: true, experience: true }).map((group) => {
            const count = grouped[group]?.reduce((sum, c) => sum + c.units.length, 0) || 0;
            if (count === 0) return null;
            const Icon = unitGroupIcons[group];
            return (
              <Button
                key={group}
                variant={filterGroup === group ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterGroup(group)}
                data-testid={`button-filter-${group}`}
              >
                <Icon className="h-3.5 w-3.5 mr-1" />
                {t(`owner.unitGroups.${group}`)}
                <Badge variant="secondary" className="ml-1.5">{count}</Badge>
              </Button>
            );
          })}
        </div>
        <AddUnitDialog propertyId={propertyId} onSuccess={() => {}} />
      </div>

      {displayedGroups.length > 0 ? (
        <div className="space-y-8">
          {displayedGroups.map(([group, categories]) => {
            const GroupIcon = unitGroupIcons[group];
            const totalInGroup = categories.reduce((s, c) => s + c.units.length, 0);
            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-md bg-muted">
                    <GroupIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-base">{t(`owner.unitGroups.${group}`)}</h3>
                  <span className="text-sm text-muted-foreground">({totalInGroup})</span>
                </div>
                {categories.filter(c => c.units.length > 0).map(({ category, units: catUnits }) => {
                  const CatIcon = categoryIcons[category] || Home;
                  return (
                    <div key={category} className="mb-4" data-testid={`category-section-${category}`}>
                      <div className="flex items-center gap-2 mb-3 ml-1">
                        <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="text-sm font-medium text-muted-foreground">{unitCategoryLabels[category as UnitCategory] || category}</h4>
                        <span className="text-xs text-muted-foreground">({catUnits.length})</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {catUnits.map((unit) => (
                          <Card key={unit.id} className="hover-elevate" data-testid={`card-unit-${unit.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-md bg-muted shrink-0">
                                  <CatIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm truncate" data-testid={`text-unit-number-${unit.id}`}>
                                    {unit.unitNumber}
                                  </p>
                                  {unit.name && (
                                    <p className="text-xs text-muted-foreground truncate">{unit.name}</p>
                                  )}
                                </div>
                                <button
                                  className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                                  title={t('common.rename', 'Rename')}
                                  data-testid={`button-rename-unit-${unit.id}`}
                                  onClick={() => setEditUnit({
                                    id: unit.id,
                                    name: unit.name || unit.unitNumber,
                                    price: unit.pricePerNight ? String(unit.pricePerNight / 100) : "",
                                  })}
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <UnitStatusBadge status={unit.status} />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {formatTypeLabel(unit.unitType)}
                                </span>
                              </div>
                              {unit.capacity && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {unit.capacity} {t('owner.performance.guests').toLowerCase()}
                                </p>
                              )}
                              {(unit as any).pricePerNight > 0 && (
                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1" data-testid={`text-unit-price-${unit.id}`}>
                                  ${((unit as any).pricePerNight / 100).toFixed(0)}/{t('owner.night', 'night')}
                                </p>
                              )}
                              {smartEnabled && doorActivity && doorActivity[unit.unitNumber] && (
                                <div className="mt-3 pt-3 border-t space-y-1.5" data-testid={`door-activity-${unit.id}`}>
                                  <div className="flex items-center justify-between gap-2">
                                    {doorActivity[unit.unitNumber].currentlyLocked ? (
                                      <div className="flex items-center gap-1.5">
                                        <Lock className="h-3.5 w-3.5 text-green-500" />
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">{t('doorActivity.locked', 'Locked')}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <LockOpen className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400">{t('doorActivity.unlocked', 'Unlocked')}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span>{t('doorActivity.opened', 'Opened')}: {doorActivity[unit.unitNumber].opensToday}</span>
                                    <span>{t('doorActivity.closed', 'Closed')}: {doorActivity[unit.unitNumber].closesToday}</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium">{t('owner.noUnits')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('owner.addFirstProperty')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StaffMember {
  id: string;
  fullName: string;
  username?: string;
  email: string | null;
  phone?: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: Date | null;
  type: "member";
}

interface PendingInvitation {
  id: string;
  email: string;
  staffRole: string;
  status: string;
  createdAt: Date | null;
  type: "invitation";
}

const systemRoleToStaffRole: Record<string, string> = {
  reception: "front_desk",
  admin: "manager",
  staff: "cleaner",
  restaurant_manager: "restaurant_manager",
  waiter: "waiter",
  kitchen_staff: "kitchen_staff",
};

function AddStaffDialog({ propertyId, onSuccess }: { propertyId: string; onSuccess: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [mode, setMode] = useState<"invite" | "create">("invite");
  const [email, setEmail] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("front_desk");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [employeeTaxRate, setEmployeeTaxRate] = useState("");
  const [additionalExpensesMonthly, setAdditionalExpensesMonthly] = useState("");

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/properties/${propertyId}/staff/invite`, {
        email,
        staffRole,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const link = `${window.location.origin}/join-team?token=${data.inviteToken}`;
      setInviteLink(link);
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "staff"] });
      onSuccess();
    },
    onError: (error: any) => {
      if (isPlanLimitError(error)) { setUpgradeOpen(true); return; }
      toast({ title: t('owner.staffManagement.failedToResendInvitation'), description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/properties/${propertyId}/staff/create`, {
        fullName,
        username,
        password,
        staffRole,
        baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
        employeeTaxRate: employeeTaxRate ? parseFloat(employeeTaxRate) : undefined,
        additionalExpensesMonthly: additionalExpensesMonthly ? parseFloat(additionalExpensesMonthly) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      setCreated(true);
      setCreatedUsername(username);
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "staff"] });
      onSuccess();
    },
    onError: (error: any) => {
      if (isPlanLimitError(error)) { setUpgradeOpen(true); return; }
      toast({ title: t('owner.staffManagement.failedToUpdateStaff'), description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setStaffRole("front_desk");
    setInviteLink(null);
    setFullName("");
    setUsername("");
    setPassword("");
    setCreated(false);
    setCreatedUsername("");
    setMode("invite");
    setBaseSalary("");
    setEmployeeTaxRate("");
    setAdditionalExpensesMonthly("");
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast({ title: t('owner.staffManagement.invitationResent') });
    }
  };

  const roleDescription = (role: StaffRole) => {
    if (role === "front_desk") return t('owner.staffRoleDescriptions.front_desk', 'Can manage guests, calendar, and tasks');
    if (role === "manager") return t('owner.staffRoleDescriptions.manager', 'Full access except billing and property deletion');
    return t('owner.staffRoleDescriptions.cleaner', 'Can view and manage assigned tasks');
  };

  const roleSelector = (
    <div className="space-y-2">
      <Label>{t('common.role')}</Label>
      <Select value={staffRole} onValueChange={(v) => setStaffRole(v as StaffRole)}>
        <SelectTrigger data-testid="select-staff-role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="front_desk">{t('owner.staffRoles.front_desk')}</SelectItem>
          <SelectItem value="manager">{t('owner.staffRoles.manager')}</SelectItem>
          <SelectItem value="cleaner">{t('owner.staffRoles.cleaner')}</SelectItem>
          <SelectItem value="restaurant_manager">Restaurant Manager</SelectItem>
          <SelectItem value="waiter">Waiter</SelectItem>
          <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{roleDescription(staffRole)}</p>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-staff">
          <UserPlus className="h-4 w-4 mr-1.5" />
          {t('owner.staffManagement.invite')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {inviteLink ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('owner.invitationCreated', 'Invitation Created')}</DialogTitle>
              <DialogDescription>{t('owner.shareInviteLink', 'Share this link with your team member to join')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-sm" data-testid="input-invite-link" />
                <Button variant="outline" size="sm" onClick={copyLink} data-testid="button-copy-link">
                  {t('owner.copyLink', 'Copy')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('owner.inviteLinkDescription', 'The team member can use this link to create their account and join your property.')}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} data-testid="button-done-invite">{t('common.done')}</Button>
            </DialogFooter>
          </>
        ) : created ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('owner.staffAccountCreated', 'Staff Account Created')}</DialogTitle>
              <DialogDescription>{t('owner.accountReadyToUse', 'The account is ready to use')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 px-4 sm:px-6">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">{t('common.username')}</span>
                    <span className="text-sm font-medium" data-testid="text-created-username">{createdUsername}</span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">{t('common.role')}</span>
                    <Badge variant="secondary" data-testid="text-created-role">{staffRoleLabels[staffRole]}</Badge>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">
                {t('owner.staffSignInInfo', 'This team member can now sign in with their username and password.')}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} data-testid="button-done-create">{t('common.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('owner.addTeamMember', 'Add Team Member')}</DialogTitle>
              <DialogDescription>{t('owner.addTeamMemberDesc', 'Invite via email or create an account directly')}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-1 px-4 sm:px-6">
              <Button
                variant={mode === "invite" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("invite")}
                className="flex-1"
                data-testid="button-mode-invite"
              >
                <Link className="h-4 w-4 mr-1.5" />
                {t('owner.inviteViaEmail', 'Invite via Email')}
              </Button>
              <Button
                variant={mode === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("create")}
                className="flex-1"
                data-testid="button-mode-create"
              >
                <KeyRound className="h-4 w-4 mr-1.5" />
                {t('owner.createAccount', 'Create Account')}
              </Button>
            </div>
            {mode === "invite" ? (
              <div className="space-y-4 py-2 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">{t('owner.addStaffDialog.emailAddress')}</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    className="w-full"
                    placeholder={t('owner.addStaffDialog.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-staff-email"
                  />
                </div>
                {roleSelector}
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
                  <Button
                    onClick={() => inviteMutation.mutate()}
                    disabled={!email || inviteMutation.isPending}
                    data-testid="button-send-invite"
                  >
                    {inviteMutation.isPending ? t('owner.addStaffDialog.sending') : t('owner.addStaffDialog.sendInvitation')}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-2 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="staff-fullname">{t('auth.fullName')}</Label>
                  <Input
                    id="staff-fullname"
                    placeholder={t('placeholders.fullName')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    data-testid="input-staff-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-username">{t('common.username')}</Label>
                  <Input
                    id="staff-username"
                    placeholder={t('placeholders.username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    data-testid="input-staff-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">{t('common.password')}</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder={t('placeholders.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-staff-password"
                  />
                </div>
                {roleSelector}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Əmək Haqqı (İsteğe bağlı)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="staff-salary" className="text-xs">Aylıq maaş ($)</Label>
                      <Input
                        id="staff-salary"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Məs: 800"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(e.target.value)}
                        data-testid="input-staff-salary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="staff-tax-rate" className="text-xs">Vergi faizi (%)</Label>
                      <Input
                        id="staff-tax-rate"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        placeholder="Məs: 22"
                        value={employeeTaxRate}
                        onChange={(e) => setEmployeeTaxRate(e.target.value)}
                        data-testid="input-staff-tax-rate"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="staff-addl-expenses" className="text-xs">Əlavə aylıq xərclər (qida, nəqliyyat) ($)</Label>
                    <Input
                      id="staff-addl-expenses"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Məs: 150"
                      value={additionalExpensesMonthly}
                      onChange={(e) => setAdditionalExpensesMonthly(e.target.value)}
                      data-testid="input-staff-additional-expenses"
                    />
                  </div>
                  {baseSalary && (
                    <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                      <span className="font-medium">Aylıq ümumi xərc: </span>
                      <span className="text-foreground font-semibold">
                        ${(
                          (parseFloat(baseSalary) || 0) +
                          Math.round((parseFloat(baseSalary) || 0) * (parseFloat(employeeTaxRate) || 0) / 100) +
                          (parseFloat(additionalExpensesMonthly) || 0)
                        ).toFixed(0)}
                      </span>
                      <span className="ml-1">(maaş + vergi + əlavə)</span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!fullName || !username || !password || createMutation.isPending}
                    data-testid="button-create-staff"
                  >
                    {createMutation.isPending ? t('common.creating') : t('owner.createAccount', 'Create Account')}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
    <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} featureName="Staff Management" />
    </>
  );
}

function StaffDetailDialog({ member, propertyId, open, onOpenChange }: {
  member: StaffMember;
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(member.fullName);
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [role, setRole] = useState(systemRoleToStaffRole[member.role] || "front_desk");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const staffRoleToSystem: Record<string, string> = { front_desk: "reception", manager: "admin", cleaner: "staff", restaurant_manager: "restaurant_manager", waiter: "waiter", kitchen_staff: "kitchen_staff" };
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/staff/${member.id}`, {
        fullName,
        email: email || null,
        phone: phone || null,
        role: staffRoleToSystem[role] || "staff",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t('owner.staffManagement.staffUpdated') });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "staff"] });
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({ title: t('owner.staffManagement.failedToUpdateStaff'), description: error?.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/properties/${propertyId}/staff/${member.id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: t('owner.staffManagement.passwordReset') });
      setNewPassword("");
      setShowPasswordReset(false);
    },
    onError: (error: any) => {
      toast({ title: t('owner.staffManagement.failedToResetPassword'), description: error?.message, variant: "destructive" });
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/properties/${propertyId}/staff/${member.id}`);
    },
    onSuccess: () => {
      toast({ title: t('owner.staffManagement.staffRemoved') });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "staff"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: t('owner.staffManagement.failedToRemoveStaff'), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-staff-detail-title">
            {editMode ? t('owner.editStaffMember', 'Edit Staff Member') : t('owner.staffDetails', 'Staff Details')}
          </DialogTitle>
          <DialogDescription>
            {editMode ? t('owner.updateStaffInfo', 'Update staff member information') : t('owner.viewManageTeamMember', 'View and manage this team member')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {member.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold" data-testid="text-staff-detail-name">{member.fullName}</p>
              <Badge variant="secondary" className="text-xs">
                {t(`owner.staffRoles.${member.role}`, member.role)}
              </Badge>
            </div>
          </div>

          {!editMode ? (
            <div className="space-y-3">
              {member.username && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('common.username')}</span>
                  <span className="text-sm font-medium" data-testid="text-staff-detail-username">@{member.username}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('common.email')}</span>
                <span className="text-sm font-medium" data-testid="text-staff-detail-email">{member.email || t('owner.staffManagement.notSet')}</span>
              </div>
              {member.phone && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('common.phone')}</span>
                  <span className="text-sm font-medium">{member.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('common.role')}</span>
                <span className="text-sm font-medium">{t(`owner.staffRoles.${member.role}`, member.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('common.status')}</span>
                <Badge variant="default" className="text-xs">{t('common.active')}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('owner.staffManagement.joined')}</span>
                <span className="text-sm font-medium">
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : t('common.unknown')}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-fullName">{t('auth.fullName')}</Label>
                <Input id="edit-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} data-testid="input-edit-staff-name" />
              </div>
              <div>
                <Label htmlFor="edit-email">{t('common.email')}</Label>
                <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-edit-staff-email" />
              </div>
              <div>
                <Label htmlFor="edit-phone">{t('common.phone')}</Label>
                <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-edit-staff-phone" />
              </div>
              <div>
                <Label htmlFor="edit-role">{t('common.role')}</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger data-testid="select-edit-staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front_desk">{t('owner.staffRoles.front_desk')}</SelectItem>
                    <SelectItem value="manager">{t('owner.staffRoles.manager')}</SelectItem>
                    <SelectItem value="cleaner">{t('owner.staffRoles.cleaner')}</SelectItem>
                    <SelectItem value="restaurant_manager">Restaurant Manager</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {showPasswordReset && (
            <div className="space-y-2 border-t pt-3">
              <Label htmlFor="new-password">{t('owner.staffManagement.newPassword')}</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('owner.staffManagement.minCharacters')}
                  data-testid="input-staff-new-password"
                />
                <Button
                  onClick={() => resetPasswordMutation.mutate()}
                  disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending}
                  data-testid="button-confirm-password-reset"
                >
                  {resetPasswordMutation.isPending ? t('owner.staffManagement.resetting') : t('owner.staffManagement.reset')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">{t('common.cancel')}</Button>
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-staff">
                {updateMutation.isPending ? t('common.saving') : t('owner.staffManagement.saveChanges')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)} data-testid="button-edit-staff">
                <Pencil className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordReset(!showPasswordReset)} data-testid="button-reset-password">
                <KeyRound className="h-4 w-4 mr-2" />
                {t('owner.staffManagement.resetPassword')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => removeStaffMutation.mutate()}
                disabled={removeStaffMutation.isPending}
                data-testid="button-remove-staff-detail"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.remove')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyTeamPanel({ propertyId, onMessageStaff }: { propertyId: string; onMessageStaff?: (staffId: string) => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const { data, isLoading } = useQuery<{ staff: StaffMember[]; invitations: PendingInvitation[] }>({
    queryKey: ["/api/properties", propertyId, "staff"],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/staff`, { credentials: "include" });
      if (!res.ok) throw new Error(t('errors.somethingWentWrong'));
      return res.json();
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("DELETE", `/api/properties/${propertyId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast({ title: t('owner.staffManagement.invitationCancelled') });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "staff"] });
    },
    onError: () => {
      toast({ title: t('owner.staffManagement.failedToCancelInvitation'), variant: "destructive" });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("POST", `/api/properties/${propertyId}/invitations/${invitationId}/resend`);
    },
    onSuccess: () => {
      toast({ title: t('owner.staffManagement.invitationResent') });
    },
    onError: (error: any) => {
      toast({ title: t('owner.staffManagement.failedToResendInvitation'), description: error?.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const staff = data?.staff || [];
  const invitations = data?.invitations || [];
  const hasTeam = staff.length > 0 || invitations.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-base">{t('owner.staffManagement.teamMembers')}</h3>
          <p className="text-sm text-muted-foreground">{t('owner.staffManagement.activePending', { active: staff.length, pending: invitations.length })}</p>
        </div>
        <AddStaffDialog propertyId={propertyId} onSuccess={() => {}} />
      </div>

      {!hasTeam ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium">{t('owner.staffManagement.noTeamMembers')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('owner.staffManagement.inviteFirstMember')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <Card key={member.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedStaff(member)}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {member.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate" data-testid={`text-staff-name-${member.id}`}>{member.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {t(`owner.staffRoles.${member.role}`, member.role)}
                  </Badge>
                  {onMessageStaff && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); onMessageStaff(member.id); }}
                      data-testid={`button-message-staff-${member.id}`}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setSelectedStaff(member); }}
                    data-testid={`button-manage-staff-${member.id}`}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {invitations.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t('owner.staffManagement.pendingInvitations')}</span>
              </div>
              {invitations.map((invite) => (
                <Card key={invite.id} className="border-dashed">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          <Mail className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`text-invite-email-${invite.id}`}>{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {invite.createdAt
                            ? `${t('owner.sent', 'Sent')} ${new Date(invite.createdAt).toLocaleDateString()}`
                            : t('owner.staffManagement.invitationPending')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {t(`owner.staffRoles.${invite.staffRole}`, staffRoleLabels[invite.staffRole as StaffRole] || invite.staffRole)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendInviteMutation.mutate(invite.id)}
                        disabled={resendInviteMutation.isPending}
                        data-testid={`button-resend-invite-${invite.id}`}
                        title={t('owner.resendInvitation', 'Resend invitation')}
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelInviteMutation.mutate(invite.id)}
                        disabled={cancelInviteMutation.isPending}
                        data-testid={`button-cancel-invite-${invite.id}`}
                        title={t('owner.cancelInvitation', 'Cancel invitation')}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {selectedStaff && (
        <StaffDetailDialog
          key={selectedStaff.id}
          member={selectedStaff}
          propertyId={propertyId}
          open={!!selectedStaff}
          onOpenChange={(open) => { if (!open) setSelectedStaff(null); }}
        />
      )}
    </div>
  );
}

function PropertiesView({
  analytics,
  analyticsLoading,
  allProperties,
  selectedProperty,
  setSelectedPropertyId,
  showPropertyDetail,
  setShowPropertyDetail,
}: {
  analytics: OwnerAnalytics | undefined;
  analyticsLoading: boolean;
  allProperties: Property[] | undefined;
  selectedProperty: Property | undefined;
  setSelectedPropertyId: (id: string | null) => void;
  showPropertyDetail: boolean;
  setShowPropertyDetail: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const { isFeatureEnabled } = usePlanFeatures();
  const multiPropertyEnabled = isFeatureEnabled("multi_property");
  const hasProperties = (analytics?.totalProperties || 0) >= 1;
  const showPropertyLimitWarning = hasProperties && !multiPropertyEnabled;

  if (showPropertyDetail && selectedProperty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowPropertyDetail(false)} data-testid="button-back-properties">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('owner.allProperties')}
          </Button>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold" data-testid="text-property-detail-name">{selectedProperty.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{[selectedProperty.city, selectedProperty.country].filter(Boolean).join(", ") || t('owner.noLocationSet')}</span>
            </div>
          </div>
          {allProperties && allProperties.length > 1 && (
            <Select
              value={selectedProperty.id}
              onValueChange={(val) => setSelectedPropertyId(val)}
            >
              <SelectTrigger className="w-[200px]" data-testid="select-property-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allProperties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Tabs defaultValue="spaces" className="w-full">
          <TabsList data-testid="tabs-property-detail">
            <TabsTrigger value="spaces" data-testid="tab-spaces">
              <Home className="h-4 w-4 mr-1.5" />
              {t('owner.spaces')}
            </TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="h-4 w-4 mr-1.5" />
              {t('owner.team')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="spaces" className="mt-4">
            <PropertyUnitsPanel propertyId={selectedProperty.id} />
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            <PropertyTeamPanel
              propertyId={selectedProperty.id}
              onMessageStaff={(staffId) => {
                navigate(`/owner?view=messages&staffId=${staffId}`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-properties-value">{analytics?.totalProperties || 0}</p>
                <p className="text-xs text-muted-foreground">{t('owner.totalProperties')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-500/10">
                <DoorOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-units-value">{analytics?.totalUnits || 0}</p>
                <p className="text-xs text-muted-foreground">{analytics?.occupiedUnits || 0} {t('owner.occupied')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-occupancy-value">{analytics?.occupancyRate || 0}%</p>
                <p className="text-xs text-muted-foreground">{t('owner.occupancyRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-purple-500/10">
                <Cpu className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-devices-value">{analytics?.totalDevices || 0}</p>
                <p className="text-xs text-muted-foreground">{analytics?.onlineDevices || 0} {t('owner.online')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">{t('owner.yourProperties')}</h2>
        <AddPropertyDialog onSuccess={() => {}} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {analytics?.properties?.map((prop) => (
          <PropertyCard
            key={prop.id}
            property={prop}
            isSelected={selectedProperty?.id === String(prop.id)}
            onClick={() => setSelectedPropertyId(String(prop.id))}
            onOpen={() => {
              setSelectedPropertyId(String(prop.id));
              setShowPropertyDetail(true);
            }}
          />
        ))}
        {(!analytics?.properties || analytics.properties.length === 0) && !analyticsLoading && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="font-semibold text-lg">{t('owner.noPropertiesYet')}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{t('owner.addFirstPropertyToStart')}</p>
              <AddPropertyDialog onSuccess={() => {}} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function GuestsOverviewView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: guests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/users/guests"],
  });

  const { data: bookings } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
  });

  const filteredGuests = guests?.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.fullName?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.phone?.toLowerCase().includes(q) ||
      g.username?.toLowerCase().includes(q)
    );
  }) || [];

  const getGuestBooking = (guestId: string) => {
    return bookings?.find(b => b.guestId === guestId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-guests">{guests?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t("nav.guests", "Guests")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-active-bookings">
                  {bookings?.filter(b => b.status === "checked_in").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t("owner.checkedIn", "Checked In")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-500/10">
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-bookings">{bookings?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t("owner.totalBookings", "Total Bookings")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder={t("common.search", "Search") + "..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
          data-testid="input-search-guests"
        />
      </div>

      {filteredGuests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-semibold text-lg">{t("owner.noGuestsYet", "No guests yet")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("owner.guestsWillAppear", "Guests will appear here once bookings are created")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredGuests.map((guest) => {
            const booking = getGuestBooking(guest.id);
            return (
              <Card key={guest.id} data-testid={`card-guest-${guest.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={guest.avatarUrl} />
                        <AvatarFallback>{guest.fullName?.charAt(0) || "G"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`text-guest-name-${guest.id}`}>{guest.fullName || guest.username}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          {guest.email && <span>{guest.email}</span>}
                          {guest.phone && <span>{guest.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {booking ? (
                        <>
                          <Badge variant="outline" data-testid={`badge-room-${guest.id}`}>
                            <BedDouble className="h-3 w-3 mr-1" />
                            {booking.roomNumber || booking.unitNumber}
                          </Badge>
                          <Badge
                            variant={booking.status === "checked_in" ? "default" : "secondary"}
                            data-testid={`badge-status-${guest.id}`}
                          >
                            {booking.status === "checked_in" ? t("booking.checkedIn", "Checked In") :
                             booking.status === "confirmed" ? t("booking.confirmed", "Confirmed") :
                             booking.status === "checked_out" ? t("booking.checkedOut", "Checked Out") :
                             booking.status}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary">{t("owner.noBooking", "No Active Booking")}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StaffMessageDialog({ staffId, staffName, open, onOpenChange }: { staffId: string; staffName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/staff-dm", staffId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/staff-dm/${staffId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
    refetchInterval: open ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/chat/staff-dm/${staffId}`, { message: message.trim() });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", staffId] });
    },
    onError: () => {
      toast({ title: t("errors.somethingWentWrong", "Something went wrong"), variant: "destructive" });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {staffName}
          </DialogTitle>
          <DialogDescription>{t("owner.staffMessage.description", "Send a direct message to this staff member")}</DialogDescription>
        </DialogHeader>
        <div ref={scrollRef} className="h-64 overflow-y-auto border rounded-md p-3 space-y-2 bg-muted/30">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.senderId === staffId ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.senderId === staffId ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                  <p>{msg.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {t("owner.staffMessage.noMessages", "No messages yet. Start the conversation!")}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder={t("owner.staffMessage.placeholder", "Type your message...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[60px] resize-none"
            data-testid="input-staff-message"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) sendMutation.mutate();
              }
            }}
          />
          <Button
            size="icon"
            onClick={() => sendMutation.mutate()}
            disabled={!message.trim() || sendMutation.isPending}
            data-testid="button-send-staff-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BroadcastMessageDialog({ open, onOpenChange, staffCount }: { open: boolean; onOpenChange: (open: boolean) => void; staffCount: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/staff-broadcast", { message: message.trim() });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: t("owner.broadcast.success", "Message sent"), description: t("owner.broadcast.sentTo", `Sent to ${data.staffCount} staff members`) });
      setMessage("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: t("errors.somethingWentWrong", "Something went wrong"), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("owner.broadcast.title", "Message All Staff")}
          </DialogTitle>
          <DialogDescription>{t("owner.broadcast.description", `This message will be sent to all ${staffCount} staff members`)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
            <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t("owner.broadcast.recipientInfo", `${staffCount} staff members will receive this message`)}
            </p>
          </div>
          <Textarea
            placeholder={t("owner.broadcast.placeholder", "Type your broadcast message...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            data-testid="input-broadcast-message"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-broadcast">
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={() => broadcastMutation.mutate()}
            disabled={!message.trim() || broadcastMutation.isPending}
            data-testid="button-send-broadcast"
          >
            {broadcastMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {t("owner.broadcast.sendAll", "Send to All")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineStaffChat({ staffId, staffName }: { staffId: string; staffName: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/staff-dm", staffId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/staff-dm/${staffId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/chat/staff-dm/${staffId}`, { message: message.trim() });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", staffId] });
    },
    onError: () => {
      toast({ title: t("errors.somethingWentWrong", "Something went wrong"), variant: "destructive" });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-2 bg-muted/30">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{staffName}</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.senderId === staffId ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.senderId === staffId ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                <p>{msg.message}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {t("owner.staffMessage.noMessages", "No messages yet. Start the conversation!")}
          </div>
        )}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder={t("owner.staffMessage.placeholder", "Type a message...")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          data-testid="input-inline-staff-message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (message.trim()) sendMutation.mutate();
            }
          }}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => sendMutation.mutate()}
          disabled={!message.trim() || sendMutation.isPending}
          data-testid="button-send-inline-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StaffManagementView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [addStaffPropertyId, setAddStaffPropertyId] = useState<string | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [activeChatStaffId, setActiveChatStaffId] = useState<string | null>(null);
  const [activeChatStaffName, setActiveChatStaffName] = useState("");

  const { data: staff, isLoading } = useQuery<any[]>({
    queryKey: ["/api/users/staff"],
  });

  const { data: allProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const filteredStaff = staff?.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q)
    );
  }) || [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "reception": return "secondary";
      case "property_manager": return "outline";
      default: return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: t("roles.admin", "Admin"),
      reception: t("roles.reception", "Reception"),
      staff: t("roles.staff", "Staff"),
      property_manager: t("roles.propertyManager", "Property Manager"),
      restaurant_manager: "Restaurant Manager",
      waiter: "Waiter",
      kitchen_staff: "Kitchen Staff",
    };
    return labels[role] || role;
  };

  const activePropertyId = addStaffPropertyId || allProperties?.[0]?.id || "";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t("nav.staff", "Staff")}</h2>
          <p className="text-sm text-muted-foreground">{staff?.length || 0} {t("owner.staffManagement.teamMemberCount", "team members")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {staff && staff.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBroadcastOpen(true)}
              data-testid="button-message-all-staff"
            >
              <Send className="h-4 w-4 mr-1.5" />
              {t("owner.broadcast.button", "Message All")}
            </Button>
          )}
          {allProperties && allProperties.length > 1 && (
            <Select
              value={activePropertyId}
              onValueChange={(val) => setAddStaffPropertyId(val)}
            >
              <SelectTrigger className="w-[160px]" data-testid="select-staff-property">
                <SelectValue placeholder={t("owner.selectProperty", "Select property")} />
              </SelectTrigger>
              <SelectContent>
                {allProperties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {activePropertyId ? (
            <AddStaffDialog
              propertyId={activePropertyId}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] });
              }}
            />
          ) : (
            <Button size="sm" disabled variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              {t("owner.addStaff", "Add Staff")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-staff">{staff?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t("nav.staff", "Total Staff")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-admin-count">
                  {staff?.filter(s => s.role === "admin").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t("roles.admin", "Admins")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-green-500/10">
                <KeyRound className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-reception-count">
                  {staff?.filter(s => s.role === "reception").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t("roles.reception", "Reception")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder={t("common.search", "Search staff") + "..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
        data-testid="input-search-staff"
      />

      {/* Staff list */}
      {filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
            <div>
              <p className="font-semibold text-lg">{t("owner.noStaffYet", "No staff members yet")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("owner.addStaffToStart", "Add your first team member to get started")}</p>
            </div>
            {activePropertyId && (
              <div className="flex justify-center">
                <AddStaffDialog
                  propertyId={activePropertyId}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] });
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredStaff.map((member) => (
            <Card key={member.id} data-testid={`card-staff-${member.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{member.fullName?.charAt(0) || "S"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid={`text-staff-name-${member.id}`}>{member.fullName || member.username}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        {member.email && <span>{member.email}</span>}
                        {member.phone && <span>{member.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getRoleBadgeVariant(member.role)} data-testid={`badge-role-${member.id}`}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    {member.isOnline && (
                      <Badge variant="outline" className="text-green-500 border-green-500/30">
                        <Activity className="h-3 w-3 mr-1" />
                        {t("common.online", "Online")}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={activeChatStaffId === member.id ? "default" : "outline"}
                      className="ml-1"
                      data-testid={`button-message-staff-${member.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeChatStaffId === member.id) {
                          setActiveChatStaffId(null);
                          setActiveChatStaffName("");
                        } else {
                          setActiveChatStaffId(member.id);
                          setActiveChatStaffName(member.fullName || member.username || "Staff");
                        }
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      {activeChatStaffId === member.id
                        ? t("owner.staffMessage.chatOpen", "Chat Open")
                        : t("owner.staffMessage.button", "Message")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Messaging Panel */}
      <Card data-testid="card-staff-messaging">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{t("owner.staffMessaging.title", "Staff Messaging")}</CardTitle>
            </div>
            {staff && staff.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBroadcastOpen(true)}
                data-testid="button-broadcast-message"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {t("owner.broadcast.button", "Broadcast")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!staff || staff.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("owner.staffMessaging.noStaff", "Add staff members to start messaging")}</p>
            </div>
          ) : (
            <div className="flex border-t" style={{ height: "420px" }}>
              {/* Left: staff list */}
              <div className="w-56 border-r flex-shrink-0 overflow-y-auto">
                {staff.map((member: any) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setActiveChatStaffId(member.id);
                      setActiveChatStaffName(member.fullName || member.username || "Staff");
                    }}
                    data-testid={`button-chat-staff-${member.id}`}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 border-b last:border-b-0 ${activeChatStaffId === member.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback className="text-xs">{member.fullName?.charAt(0) || "S"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{member.fullName || member.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{getRoleLabel(member.role)}</p>
                    </div>
                    {member.isOnline && (
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              {/* Right: chat */}
              <div className="flex-1 min-w-0">
                {activeChatStaffId ? (
                  <InlineStaffChat staffId={activeChatStaffId} staffName={activeChatStaffName} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-6">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">{t("owner.staffMessaging.selectStaff", "Select a staff member to start a conversation")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BroadcastMessageDialog
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        staffCount={staff?.length || 0}
      />
    </div>
  );
}

function TasksView() {
  const { t } = useTranslation();

  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/housekeeping/orders"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5 space-y-3">
              <div className="h-10 w-10 rounded-md bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const todayTasks = tasks?.filter((task: any) => {
    if (!task.scheduledDate) return true;
    const taskDate = new Date(task.scheduledDate);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('owner.tasks.todaysTasks')}</h2>
          <p className="text-sm text-muted-foreground">{t('owner.tasks.tasksScheduled', { count: todayTasks.length })}</p>
        </div>
      </div>

      {todayTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayTasks.map((task: any, idx: number) => (
            <Card key={task.id || idx} data-testid={`card-task-${task.id || idx}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-md bg-muted">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <PriorityBadge priority={task.priority || "normal"} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {String(t(`owner.taskTypes.${task.taskType}`, task.taskType || 'Task'))}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">
                    {task.unitNumber ? `${t('owner.spaces')} ${task.unitNumber}` : `${t('owner.spaces')} #${task.unitId?.slice(0, 6) || "—"}`}
                  </p>
                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {task.scheduledDate
                        ? new Date(task.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : t('owner.anytime', 'Anytime')}
                    </span>
                  </div>
                  <UnitStatusBadge status={task.status || "available"} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
            <p className="font-medium">{t('owner.tasks.noTasks')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('owner.tasks.noTasksDesc')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
interface CalendarBooking {
  id: string;
  guestName: string;
  roomLabel: string;
  checkIn: Date;
  checkOut: Date;
  price: number | null;
  currency?: string;
  source: "local" | "channex" | string;
  status: string;
  roomNumber?: string;
  bookingSource?: string | null;
  externalId?: string;
}

interface BookingDetailModalProps {
  booking: CalendarBooking | null;
  onClose: () => void;
}

function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  const { t } = useTranslation();
  if (!booking) return null;
  const isChannex = booking.source === "channex";
  const nights = Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / 86400000);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 relative"
        onClick={e => e.stopPropagation()}
        data-testid="booking-detail-modal"
      >
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          data-testid="close-booking-modal"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          {isChannex ? (
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <Network className="h-5 w-5 text-orange-500" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </div>
          )}
          <div>
            <p className="font-semibold text-base">{booking.guestName}</p>
            <p className="text-xs text-muted-foreground">
              {isChannex ? t("channex.bookingSource", "Channex / OTA") : (booking.bookingSource || t("calView.directBooking", "Direct"))}
            </p>
          </div>
          {isChannex && (
            <span className="ml-auto px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
              {t("channex.label", "Channex")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t("calView.checkIn", "Check-in")}</p>
            <p className="font-medium">{booking.checkIn.toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t("calView.checkOut", "Check-out")}</p>
            <p className="font-medium">{booking.checkOut.toLocaleDateString()}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t("calView.room", "Room")}</p>
            <p className="font-medium">{booking.roomLabel}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t("calView.nights", "Nights")}</p>
            <p className="font-medium">{nights}</p>
          </div>
          {booking.price != null && (
            <div className="col-span-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("calView.totalPrice", "Total Price")}</p>
              <p className="font-semibold text-base">
                {booking.currency || "USD"} {Number(booking.price).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            booking.status === "confirmed" || booking.status === "booked"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : booking.status === "cancelled"
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
          }`}>
            {t(`calView.status.${booking.status}`, booking.status)}
          </span>
          {isChannex && (
            <p className="text-xs text-muted-foreground">{t("channex.readOnly", "Read-only (Channex)")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);

  const monthKeys = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const dayKeys = ["sun","mon","tue","wed","thu","fri","sat"];

  // ── Navigate month ────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // ── Fetch local bookings ──────────────────────────────────────────────────
  const { data: localBookingsRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    staleTime: 60_000,
  });

  // ── Fetch channex / external bookings ─────────────────────────────────────
  const { data: channexBookingsRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/calendar/bookings"],
    staleTime: 30_000,
  });

  // ── Real-time hook ────────────────────────────────────────────────────────
  useChannexRealtime({
    onNewBooking: (ev: ChannexBookingEvent) => {
      toast({
        title: t("channex.newBookingReceived", "New Booking Received"),
        description: `${ev.guestName} — ${ev.roomName || t("channex.unknownRoom", "Unknown Room")}`,
        duration: 6000,
      });
    },
  });

  // ── Normalise to CalendarBooking ──────────────────────────────────────────
  const allBookings = useMemo<CalendarBooking[]>(() => {
    const local: CalendarBooking[] = (localBookingsRaw as any[]).map((b: any) => ({
      id: b.id,
      guestName: b.guestName || b.guestId || t("calView.guest", "Guest"),
      roomLabel: b.roomNumber || b.roomType || t("calView.room", "Room"),
      checkIn: new Date(b.checkInDate),
      checkOut: new Date(b.checkOutDate),
      price: b.totalPrice ?? null,
      currency: b.currency || "USD",
      source: "local",
      status: b.status,
      roomNumber: b.roomNumber,
      bookingSource: b.bookingSource,
    }));

    const channex: CalendarBooking[] = (channexBookingsRaw as any[]).map((b: any) => ({
      id: b.id,
      guestName: b.guestName || t("channex.label", "Channex"),
      roomLabel: b.roomName || t("calView.room", "Room"),
      checkIn: new Date(b.checkinDate),
      checkOut: new Date(b.checkoutDate),
      price: b.price ?? null,
      currency: "USD",
      source: "channex",
      status: b.status || "confirmed",
      externalId: b.externalId,
    }));

    return [...local, ...channex].filter(bk =>
      !isNaN(bk.checkIn.getTime()) && !isNaN(bk.checkOut.getTime())
    );
  }, [localBookingsRaw, channexBookingsRaw, t]);

  // ── Build calendar grid ───────────────────────────────────────────────────
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const getBookingsForDay = (day: number): CalendarBooking[] => {
    const date = new Date(currentYear, currentMonth, day);
    return allBookings.filter(bk => {
      const ci = new Date(bk.checkIn);
      const co = new Date(bk.checkOut);
      ci.setHours(0,0,0,0);
      co.setHours(0,0,0,0);
      date.setHours(0,0,0,0);
      return ci <= date && date < co;
    });
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const channexCount = allBookings.filter(b => b.source === "channex").length;
  const localCount = allBookings.filter(b => b.source === "local").length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("owner.calendar.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(`owner.months.${monthKeys[currentMonth]}`, monthKeys[currentMonth])} {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">{t("calView.local","Local")} ({localCount})</span>
            <span className="inline-block w-3 h-3 rounded-full bg-orange-500 ml-2" />
            <span className="text-xs text-muted-foreground">{t("calView.channex","Channex")} ({channexCount})</span>
          </div>
          <Button variant="outline" size="sm" onClick={prevMonth} data-testid="calendar-prev-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
            data-testid="calendar-today"
          >
            {t("owner.calendar.today", "Today")}
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} data-testid="calendar-next-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {dayKeys.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t(`calView.days.${d}`, d.toUpperCase())}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[80px] border-b border-r bg-muted/10 last:border-r-0"
                />
              );
              const dayBookings = getBookingsForDay(day);
              const todayHighlight = isToday(day);
              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[80px] p-1.5 border-b border-r last:border-r-0 flex flex-col gap-1 ${
                    todayHighlight ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-muted/30"
                  } transition-colors`}
                  data-testid={`calendar-day-${day}`}
                >
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    todayHighlight
                      ? "bg-blue-500 text-white"
                      : "text-muted-foreground"
                  }`}>
                    {day}
                  </span>
                  {dayBookings.slice(0, 3).map(bk => (
                    <button
                      key={bk.id}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate cursor-pointer ${
                        bk.source === "channex"
                          ? "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/60"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/60"
                      }`}
                      onClick={() => setSelectedBooking(bk)}
                      title={`${bk.guestName} — ${bk.roomLabel}`}
                      data-testid={`booking-chip-${bk.id}`}
                    >
                      {bk.source === "channex" && <span className="mr-0.5">⬡</span>}
                      {bk.guestName}
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <span className="text-xs text-muted-foreground pl-1">
                      +{dayBookings.length - 3} {t("calView.more", "more")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("calView.totalBookings","Total Bookings")}</p>
            <p className="text-2xl font-bold mt-1">{allBookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("calView.directBookings","Direct Bookings")}</p>
            <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{localCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("calView.channexBookings","Channex Bookings")}</p>
            <p className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">{channexCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("calView.thisMonth","This Month")}</p>
            <p className="text-2xl font-bold mt-1">
              {allBookings.filter(b => {
                const d = b.checkIn;
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Booking detail modal ───────────────────────────────────────────── */}
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}

interface ChatGuest {
  guestId: string;
  guestName: string;
  roomNumber: string | null;
  lastMessage: string;
  lastMessageAt: string;
}

interface StaffDmConversation {
  conversationKey: string;
  peerId: string;
  peerName: string;
  peerRole: string;
  lastMessage: string;
  lastMessageAt: Date | null;
}

function MessagesView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const urlStaffId = urlParams.get("staffId");

  const [activeTab, setActiveTab] = useState(urlStaffId ? "staff-dm" : "requests");
  const [selectedChatGuestId, setSelectedChatGuestId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedDmStaffId, setSelectedDmStaffId] = useState<string | null>(urlStaffId);
  const [dmMessage, setDmMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const dmScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const dmInputRef = useRef<HTMLInputElement>(null);

  const { data: serviceRequests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests/all"],
  });

  const { data: chatGuests, isLoading: chatGuestsLoading } = useQuery<ChatGuest[]>({
    queryKey: ["/api/chat/guests"],
    refetchInterval: 10000,
  });

  const { data: chatMessages, isLoading: chatMessagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", selectedChatGuestId],
    enabled: !!selectedChatGuestId,
    refetchInterval: 10000,
  });

  const { data: dmConversations } = useQuery<StaffDmConversation[]>({
    queryKey: ["/api/chat/staff-dm/conversations"],
    refetchInterval: 10000,
  });

  const { data: staffUsers } = useQuery<Array<Omit<import("@shared/schema").User, "password">>>({
    queryKey: ["/api/users/staff"],
  });

  const { data: dmMessages, isLoading: dmMessagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/staff-dm", selectedDmStaffId],
    enabled: !!selectedDmStaffId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  useEffect(() => {
    if (dmScrollRef.current) {
      const viewport = dmScrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [dmMessages]);

  const sendDmMutation = useMutation({
    mutationFn: async ({ staffId, message }: { staffId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/chat/staff-dm/${staffId}`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", selectedDmStaffId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm/conversations"] });
      setDmMessage("");
      setTimeout(() => dmInputRef.current?.focus(), 0);
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleSendDm = () => {
    if (!selectedDmStaffId || !dmMessage.trim()) return;
    sendDmMutation.mutate({ staffId: selectedDmStaffId, message: dmMessage.trim() });
  };

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/service-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/all"] });
      toast({ title: t('owner.messages.requestUpdated', 'Request updated') });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ guestId, message }: { guestId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/chat/messages/${guestId}`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedChatGuestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/guests"] });
      setChatMessage("");
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleSendMessage = () => {
    if (!selectedChatGuestId || !chatMessage.trim()) return;
    sendChatMutation.mutate({ guestId: selectedChatGuestId, message: chatMessage.trim() });
  };

  const pendingRequests = serviceRequests?.filter(r => r.status === "pending") || [];
  const activeRequests = serviceRequests?.filter(r => r.status === "in_progress") || [];
  const completedRequests = serviceRequests?.filter(r => r.status === "completed" || r.status === "rejected") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">{t('owner.messages.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('owner.messagesSubtitle', 'Stay connected with your team and guests')}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/service-requests/all"] });
            queryClient.invalidateQueries({ queryKey: ["/api/chat/guests"] });
          }}
          data-testid="button-messages-refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3" data-testid="tab-messages-requests">
            <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{t('owner.messages.serviceRequests', 'Service Requests')}</span>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-0.5 text-[10px] px-1.5">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3" data-testid="tab-messages-chat">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{t('chat.title', 'Chat')}</span>
            {chatGuests && chatGuests.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5">{chatGuests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="staff-dm" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3" data-testid="tab-staff-dm">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{t('staffChat.title', 'Staff Messages')}</span>
            {dmConversations && dmConversations.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5">{dmConversations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-4">
          {requestsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : serviceRequests && serviceRequests.length > 0 ? (
            <>
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-orange-500" />
                    {t('owner.messages.pendingApproval', 'Pending Approval')} ({pendingRequests.length})
                  </h3>
                  {pendingRequests.map((request) => (
                    <Card key={request.id} data-testid={`request-card-${request.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline">{String(t(`dashboard.admin.transactionCategories.${request.requestType}`, request.requestType?.replace("_", " ")))}</Badge>
                              <Badge variant="secondary">{t('owner.messages.room', 'Room')} {request.roomNumber}</Badge>
                            </div>
                            <p className="text-sm mt-1">{request.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {request.createdAt ? formatTimeAgo(request.createdAt) : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateRequestMutation.mutate({ id: request.id, status: "in_progress" })}
                              disabled={updateRequestMutation.isPending}
                              data-testid={`button-approve-${request.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('owner.messages.approve', 'Approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRequestMutation.mutate({ id: request.id, status: "rejected" })}
                              disabled={updateRequestMutation.isPending}
                              data-testid={`button-reject-${request.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('owner.messages.reject', 'Reject')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {t('owner.messages.inProgress', 'In Progress')} ({activeRequests.length})
                  </h3>
                  {activeRequests.map((request) => (
                    <Card key={request.id} data-testid={`request-active-${request.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline">{String(t(`dashboard.admin.transactionCategories.${request.requestType}`, request.requestType?.replace("_", " ")))}</Badge>
                              <Badge variant="secondary">{t('owner.messages.room', 'Room')} {request.roomNumber}</Badge>
                              <Badge variant="secondary">{t('common.inProgress', 'In Progress')}</Badge>
                            </div>
                            <p className="text-sm mt-1">{request.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestMutation.mutate({ id: request.id, status: "completed" })}
                            disabled={updateRequestMutation.isPending}
                            data-testid={`button-complete-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('owner.messages.markComplete', 'Complete')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {completedRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {t('owner.messages.resolved', 'Resolved')} ({completedRequests.length})
                  </h3>
                  {completedRequests.slice(0, 5).map((request) => (
                    <Card key={request.id} className="opacity-70" data-testid={`request-resolved-${request.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline">{String(t(`dashboard.admin.transactionCategories.${request.requestType}`, request.requestType?.replace("_", " ")))}</Badge>
                              <Badge variant={request.status === "completed" ? "default" : "destructive"}>
                                {request.status === "completed" ? t('common.completed') : t('owner.messages.rejected', 'Rejected')}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{request.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">{t('owner.messages.noRequests', 'No service requests')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('owner.messages.noRequestsDesc', 'Service requests from guests will appear here')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('owner.messages.guestConversations', 'Guest Conversations')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {chatGuestsLoading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : chatGuests && chatGuests.length > 0 ? (
                    <div className="divide-y">
                      {chatGuests.map((chat) => (
                        <div
                          key={chat.guestId}
                          className={`p-3 cursor-pointer hover-elevate ${
                            selectedChatGuestId === chat.guestId ? "bg-muted" : ""
                          }`}
                          onClick={() => {
                            setSelectedChatGuestId(chat.guestId);
                            queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", chat.guestId] });
                          }}
                          data-testid={`chat-guest-${chat.guestId}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{chat.guestName}</span>
                                {chat.roomNumber && (
                                  <Badge variant="outline" className="text-xs">{t('owner.messages.room', 'Room')} {chat.roomNumber}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.lastMessageAt && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(chat.lastMessageAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">{t('owner.messages.noConversations', 'No conversations yet')}</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {selectedChatGuestId
                      ? chatGuests?.find(g => g.guestId === selectedChatGuestId)?.guestName || t('chat.title', 'Chat')
                      : t('chat.selectConversation', 'Select a conversation')}
                  </CardTitle>
                  {selectedChatGuestId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedChatGuestId] })}
                      data-testid="button-refresh-chat"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {selectedChatGuestId ? (
                  <>
                    <ScrollArea className="h-[300px] mb-4 border rounded-md p-3">
                      {chatMessagesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-3/4" />
                          <Skeleton className="h-10 w-2/3 ml-auto" />
                          <Skeleton className="h-10 w-3/4" />
                        </div>
                      ) : chatMessages && chatMessages.length > 0 ? (
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderRole === "guest" ? "justify-start" : "justify-end"}`}
                              data-testid={`chat-msg-${msg.id}`}
                            >
                              <div className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                                msg.senderRole === "guest"
                                  ? "bg-muted"
                                  : "bg-primary text-primary-foreground"
                              }`}>
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${msg.senderRole === "guest" ? "text-muted-foreground" : "opacity-70"}`}>
                                  {msg.createdAt ? formatTimeAgo(msg.createdAt) : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatScrollRef} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">{t('owner.messages.noMessagesInThread', 'No messages yet')}</p>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        ref={chatInputRef}
                        placeholder={t('chat.typeMessage', 'Type a message...')}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={sendChatMutation.isPending}
                        data-testid="input-owner-chat"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim() || sendChatMutation.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">{t('chat.selectConversation', 'Select a conversation to start chatting')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff-dm" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('staffChat.conversations', 'Staff')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {staffUsers && staffUsers.length > 0 ? (
                    <div className="divide-y">
                      {staffUsers
                        .filter(s => currentUser && s.id !== currentUser.id)
                        .map((staff) => {
                          const conv = dmConversations?.find(c => c.peerId === staff.id);
                          return (
                            <div
                              key={staff.id}
                              className={`p-3 cursor-pointer hover-elevate ${
                                selectedDmStaffId === staff.id ? "bg-muted" : ""
                              }`}
                              onClick={() => {
                                setSelectedDmStaffId(staff.id);
                                queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", staff.id] });
                              }}
                              data-testid={`dm-staff-${staff.id}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {staff.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <span className="font-medium text-sm truncate block">{staff.fullName}</span>
                                    {conv ? (
                                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{conv.lastMessage}</p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {t(`staffList.roles.${staff.role}`, { defaultValue: staff.role })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {conv?.lastMessageAt && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatTimeAgo(conv.lastMessageAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">{t('staffChat.noStaff', 'No staff members')}</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {selectedDmStaffId
                      ? staffUsers?.find(s => s.id === selectedDmStaffId)?.fullName || t('staffChat.title', 'Staff Messages')
                      : t('staffChat.selectStaff', 'Select a staff member')}
                  </CardTitle>
                  {selectedDmStaffId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", selectedDmStaffId] })}
                      data-testid="button-refresh-dm"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {selectedDmStaffId ? (
                  <>
                    <ScrollArea className="h-[300px] mb-4 border rounded-md p-3">
                      {dmMessagesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-3/4" />
                          <Skeleton className="h-10 w-2/3 ml-auto" />
                          <Skeleton className="h-10 w-3/4" />
                        </div>
                      ) : dmMessages && dmMessages.length > 0 ? (
                        <div className="space-y-3">
                          {dmMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                              data-testid={`dm-msg-${msg.id}`}
                            >
                              <div className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                                msg.senderId === currentUser?.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}>
                                <p>{msg.message}</p>
                                <p className={`text-xs mt-1 ${msg.senderId === currentUser?.id ? "opacity-70" : "text-muted-foreground"}`}>
                                  {msg.createdAt ? formatTimeAgo(msg.createdAt) : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={dmScrollRef} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">{t('staffChat.startConversation', 'Start a conversation')}</p>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        ref={dmInputRef}
                        placeholder={t('chat.typeMessage', 'Type a message...')}
                        value={dmMessage}
                        onChange={(e) => setDmMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendDm();
                          }
                        }}
                        disabled={sendDmMutation.isPending}
                        data-testid="input-staff-dm"
                      />
                      <Button
                        onClick={handleSendDm}
                        disabled={!dmMessage.trim() || sendDmMutation.isPending}
                        data-testid="button-send-dm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">{t('staffChat.selectStaff', 'Select a staff member to start chatting')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PerformanceView({ selectedPropertyId }: { selectedPropertyId: string | null }) {
  const { t } = useTranslation();

  const { data: revenueData, isLoading: revenueLoading } = useQuery<{
    totalRevenue: number;
    revenueByProperty: Array<{ propertyId: string; propertyName: string; revenue: number; transactionCount: number }>;
  }>({
    queryKey: ["/api/analytics/revenue"],
  });

  const { data: occupancyData, isLoading: occupancyLoading } = useQuery<{
    occupancyRate: number;
    totalUnits: number;
    occupiedUnits: number;
    byProperty: Array<{ propertyId: string; propertyName: string; totalUnits: number; occupiedUnits: number; rate: number }>;
  }>({
    queryKey: ["/api/analytics/occupancy"],
  });

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery<any[]>({
    queryKey: ["/api/properties"],
  });

  const { data: financeSummary } = useQuery<any>({
    queryKey: ["/api/finance-center/summary"],
  });

  const formatCurrencyValue = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRevenue = selectedPropertyId
    ? revenueData?.revenueByProperty?.filter(p => String(p.propertyId) === selectedPropertyId) ?? []
    : revenueData?.revenueByProperty ?? [];

  const filteredOccupancy = selectedPropertyId
    ? occupancyData?.byProperty?.filter(p => String(p.propertyId) === selectedPropertyId) ?? []
    : occupancyData?.byProperty ?? [];

  const displayRevenue = filteredRevenue.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const displayOccupancy = filteredOccupancy.length > 0
    ? Math.round(filteredOccupancy.reduce((sum, p) => sum + p.rate, 0) / filteredOccupancy.length)
    : (selectedPropertyId ? 0 : (occupancyData?.occupancyRate || 0));
  const displayTotalUnits = filteredOccupancy.reduce((sum, p) => sum + p.totalUnits, 0) || (selectedPropertyId ? 0 : (occupancyData?.totalUnits || 0));
  const displayOccupiedUnits = filteredOccupancy.reduce((sum, p) => sum + p.occupiedUnits, 0) || (selectedPropertyId ? 0 : (occupancyData?.occupiedUnits || 0));
  const totalTransactions = filteredRevenue.reduce((sum, p) => sum + (p.transactionCount || 0), 0);
  const propertiesCount = selectedPropertyId ? 1 : (propertiesData?.length || 0);

  return (
    <div className="space-y-6" data-testid="performance-view">
      <div>
        <h2 className="text-lg font-semibold">{t('owner.performance.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('owner.performanceSubtitle', 'Track how your properties are doing')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-kpi-revenue">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">{t('owner.performance.revenue', 'Total Revenue')}</p>
            </div>
            {revenueLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-total-revenue">
                {formatCurrencyValue(displayRevenue)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-occupancy">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">{t('owner.performance.occupancy', 'Avg Occupancy')}</p>
            </div>
            {occupancyLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold" data-testid="text-occupancy-rate">
                  {displayOccupancy}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {displayOccupiedUnits} / {displayTotalUnits} {t('common.spaces')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-properties">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-orange-500/10">
                <Building2 className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-sm text-muted-foreground">{t('owner.performance.properties', 'Properties')}</p>
            </div>
            {propertiesLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-properties-count">
                {propertiesCount}
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-transactions">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-md bg-purple-500/10">
                <Receipt className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">{t('owner.performance.transactions', 'Transactions')}</p>
            </div>
            {revenueLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-transactions-count">
                {totalTransactions}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <RestaurantRevenueCard />

      {financeSummary && (
        <Card data-testid="card-finance-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('owner.financialOverview', 'Financial Overview (This Month)')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.revenue')}</p>
                <p className="text-lg font-bold text-green-600" data-testid="text-monthly-revenue">
                  {formatCurrencyValue((financeSummary.monthlyRevenue || 0) / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.expenses')}</p>
                <p className="text-lg font-bold text-red-600" data-testid="text-monthly-expenses">
                  {formatCurrencyValue((financeSummary.monthlyExpenses || 0) / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.payroll')}</p>
                <p className="text-lg font-bold text-blue-600" data-testid="text-monthly-payroll">
                  {formatCurrencyValue((financeSummary.monthlyPayroll || 0) / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.netProfit')}</p>
                <p className={`text-lg font-bold ${(financeSummary.monthlyNetProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-monthly-net-profit">
                  {formatCurrencyValue((financeSummary.monthlyNetProfit || 0) / 100)}
                </p>
              </div>
            </div>
            {financeSummary.autoBreakdown && (financeSummary.autoBreakdown.utilityExpense > 0 || financeSummary.autoBreakdown.cleaningExpense > 0 || financeSummary.autoBreakdown.taxExpense > 0) && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('owner.financeCenter.autoExpensesBreakdown', 'Avtomatik hesablanmış xərclər:')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  {financeSummary.autoBreakdown.utilityExpense > 0 && (
                    <div><span>{t('owner.financeCenter.utility', 'Kommunal')} ({financeSummary.autoBreakdown.utilityExpensePct}%): </span><span className="text-red-500 font-medium">{formatCurrencyValue(financeSummary.autoBreakdown.utilityExpense / 100)}</span></div>
                  )}
                  {financeSummary.autoBreakdown.taxExpense > 0 && (
                    <div><span>{t('owner.financeCenter.tax', 'Vergi')} ({financeSummary.autoBreakdown.countryTaxRate}%): </span><span className="text-red-500 font-medium">{formatCurrencyValue(financeSummary.autoBreakdown.taxExpense / 100)}</span></div>
                  )}
                  {financeSummary.autoBreakdown.cleaningExpense > 0 && (
                    <div><span>{t('owner.financeCenter.cleaning', 'Təmizlik')}: </span><span className="text-red-500 font-medium">{formatCurrencyValue(financeSummary.autoBreakdown.cleaningExpense / 100)}</span></div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card data-testid="card-revenue-breakdown">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{selectedPropertyId ? t('owner.revenueThisProperty', 'Bu Mülkün Gəliri') : t('owner.revenueByProperty', 'Revenue by Property')}</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredRevenue.length > 0 ? (
              <div className="space-y-3">
                {filteredRevenue.map((item, idx) => (
                  <div key={item.propertyId || idx} className="flex items-center justify-between pb-3 border-b last:border-0" data-testid={`row-revenue-property-${item.propertyId || idx}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-revenue-property-name-${item.propertyId || idx}`}>
                        {item.propertyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.transactionCount} {t('owner.transactions', 'transactions')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-600 whitespace-nowrap ml-4" data-testid={`text-revenue-amount-${item.propertyId || idx}`}>
                      {formatCurrencyValue(item.revenue || 0)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" data-testid="empty-revenue-data">
                <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">{t('owner.noRevenueData', 'No revenue data yet')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-occupancy-breakdown">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{selectedPropertyId ? t('owner.occupancyThisProperty', 'Bu Mülkün Tutumu') : t('owner.occupancyByProperty', 'Occupancy by Property')}</CardTitle>
          </CardHeader>
          <CardContent>
            {occupancyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredOccupancy.length > 0 ? (
              <div className="space-y-4">
                {filteredOccupancy.map((item, idx) => (
                  <div key={item.propertyId || idx} data-testid={`row-occupancy-property-${item.propertyId || idx}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate" data-testid={`text-occupancy-property-name-${item.propertyId || idx}`}>
                        {item.propertyName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-600">{item.rate}%</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.occupiedUnits}/{item.totalUnits}
                        </span>
                      </div>
                    </div>
                    <Progress value={item.rate} className="h-2" data-testid={`progress-occupancy-${item.propertyId || idx}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" data-testid="empty-occupancy-data">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">{t('owner.noOccupancyData', 'No occupancy data yet')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinanceCenterView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("revenue");
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);

  const [revDescription, setRevDescription] = useState("");
  const [revCategory, setRevCategory] = useState("");
  const [revAmount, setRevAmount] = useState("");
  const [revPaymentMethod, setRevPaymentMethod] = useState("cash");
  const [revPaymentStatus, setRevPaymentStatus] = useState("paid");

  const [expDescription, setExpDescription] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expVendor, setExpVendor] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const [payrollStaffId, setPayrollStaffId] = useState("");
  const [payrollBaseSalary, setPayrollBaseSalary] = useState("");
  const [payrollFrequency, setPayrollFrequency] = useState("monthly");

  const [recDescription, setRecDescription] = useState("");
  const [recCategory, setRecCategory] = useState("");
  const [recVendor, setRecVendor] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recFrequency, setRecFrequency] = useState("monthly");

  const formatCurrency = (amount: number) =>
    (amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalRevenue: number;
    monthlyRevenue: number;
    totalExpenses: number;
    monthlyExpenses: number;
    monthlyPayroll: number;
    totalCashBalance: number;
    netProfit: number;
    monthlyNetProfit: number;
    revenueCount: number;
    expenseCount: number;
    payrollCount: number;
    accountCount: number;
  }>({
    queryKey: ["/api/finance-center/summary"],
  });

  const { data: revenues, isLoading: revenuesLoading } = useQuery<any[]>({
    queryKey: ["/api/finance-center/revenues"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ["/api/finance-center/expenses"],
  });

  const { data: payrollConfigs, isLoading: payrollLoading } = useQuery<any[]>({
    queryKey: ["/api/finance-center/payroll-configs"],
  });

  const { data: recurringExpenses, isLoading: recurringLoading } = useQuery<any[]>({
    queryKey: ["/api/finance-center/recurring-expenses"],
  });

  const { data: staffUsers } = useQuery<any[]>({
    queryKey: ["/api/finance-center/staff-users"],
  });

  const addRevenueMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(revAmount);
      if (isNaN(parsed) || parsed <= 0) throw new Error(t('validation.amountRequired'));
      await apiRequest("POST", "/api/finance-center/revenues", {
        description: revDescription,
        category: revCategory,
        amount: Math.round(parsed * 100),
        paymentMethod: revPaymentMethod,
        paymentStatus: revPaymentStatus,
      });
    },
    onSuccess: () => {
      toast({ title: t('owner.revenueAdded') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/revenues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/summary"] });
      setRevenueDialogOpen(false);
      setRevDescription("");
      setRevCategory("");
      setRevAmount("");
      setRevPaymentMethod("cash");
      setRevPaymentStatus("paid");
    },
    onError: (error: any) => {
      toast({ title: t('owner.failedToAddRevenue'), description: error?.message, variant: "destructive" });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(expAmount);
      if (isNaN(parsed) || parsed <= 0) throw new Error(t('validation.amountRequired'));
      await apiRequest("POST", "/api/finance-center/expenses", {
        description: expDescription,
        category: expCategory,
        vendor: expVendor || null,
        amount: Math.round(parsed * 100),
      });
    },
    onSuccess: () => {
      toast({ title: t('owner.expenseAdded') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/summary"] });
      setExpenseDialogOpen(false);
      setExpDescription("");
      setExpCategory("");
      setExpVendor("");
      setExpAmount("");
    },
    onError: (error: any) => {
      toast({ title: t('owner.failedToAddExpense'), description: error?.message, variant: "destructive" });
    },
  });

  const addPayrollMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(payrollBaseSalary);
      if (isNaN(parsed) || parsed <= 0) throw new Error(t('validation.amountRequired'));
      const selectedStaff = (staffUsers || []).find((s: any) => s.id === payrollStaffId);
      await apiRequest("POST", "/api/finance-center/payroll-configs", {
        staffId: payrollStaffId,
        staffName: selectedStaff?.fullName || t('common.unknown'),
        staffRole: selectedStaff?.role || "staff",
        baseSalary: Math.round(parsed * 100),
        frequency: payrollFrequency,
      });
    },
    onSuccess: () => {
      toast({ title: t('owner.payrollConfigAdded') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/payroll-configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/summary"] });
      setPayrollDialogOpen(false);
      setPayrollStaffId("");
      setPayrollBaseSalary("");
      setPayrollFrequency("monthly");
    },
    onError: (error: any) => {
      toast({ title: t('owner.failedToAddPayrollConfig'), description: error?.message, variant: "destructive" });
    },
  });

  const addRecurringMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(recAmount);
      if (isNaN(parsed) || parsed <= 0) throw new Error(t('validation.amountRequired'));
      await apiRequest("POST", "/api/finance-center/recurring-expenses", {
        description: recDescription,
        category: recCategory,
        vendor: recVendor || null,
        amount: Math.round(parsed * 100),
        frequency: recFrequency,
        nextRunAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: t('owner.recurringExpenseAdded') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/recurring-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-center/summary"] });
      setRecurringDialogOpen(false);
      setRecDescription("");
      setRecCategory("");
      setRecVendor("");
      setRecAmount("");
      setRecFrequency("monthly");
    },
    onError: (error: any) => {
      toast({ title: t('owner.failedToAddRecurringExpense'), description: error?.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6" data-testid="finance-center-view">
      <div>
        <h2 className="text-lg font-semibold">{t('owner.financeCenter.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('owner.financeCenter.description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                {summaryLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="stat-monthly-revenue">
                    {formatCurrency(summary?.monthlyRevenue || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.monthlyRevenue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                {summaryLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="stat-monthly-expenses">
                    {formatCurrency(summary?.monthlyExpenses || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.monthlyExpenses')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                {summaryLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="stat-monthly-payroll">
                    {formatCurrency(summary?.monthlyPayroll || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.monthlyPayroll')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                {summaryLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold" data-testid="stat-net-profit">
                    {formatCurrency(summary?.monthlyNetProfit || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.financeCenter.netProfit')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList data-testid="tabs-finance" className="w-full sm:w-auto">
            <TabsTrigger value="revenue" data-testid="tab-revenue">
              <DollarSign className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="truncate">{t('owner.financeCenter.revenue')}</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">
              <Receipt className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="truncate">{t('owner.financeCenter.expenses')}</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" data-testid="tab-payroll">
              <Users className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="truncate">{t('owner.financeCenter.payroll')}</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" data-testid="tab-recurring">
              <RefreshCw className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="truncate">{t('owner.financeCenter.recurringExpenses')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">{t('owner.financeCenter.revenueRecords', { count: revenues?.length || 0 })}</p>
            <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-revenue">
                  <Plus className="h-4 w-4" />
                  {t('owner.financeCenter.addRevenue')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('owner.financeCenter.addRevenue')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('common.description')}</Label>
                    <Input value={revDescription} onChange={(e) => setRevDescription(e.target.value)} placeholder={t('owner.revenuePlaceholder', 'e.g. Room booking payment')} data-testid="input-rev-description" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.category')}</Label>
                    <Select value={revCategory} onValueChange={setRevCategory}>
                      <SelectTrigger data-testid="select-rev-category">
                        <SelectValue placeholder={t('common.selectOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        {revenueCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.amount')} ($)</Label>
                    <Input type="number" step="0.01" value={revAmount} onChange={(e) => setRevAmount(e.target.value)} placeholder="0.00" data-testid="input-rev-amount" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('finance.paymentMethod')}</Label>
                      <Select value={revPaymentMethod} onValueChange={setRevPaymentMethod}>
                        <SelectTrigger data-testid="select-rev-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">{t('finance.cash')}</SelectItem>
                          <SelectItem value="card">{t('finance.card')}</SelectItem>
                          <SelectItem value="online">{t('finance.online')}</SelectItem>
                          <SelectItem value="room_charge">{t('finance.roomCharge')}</SelectItem>
                          <SelectItem value="other">{t('finance.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('finance.paymentStatus')}</Label>
                      <Select value={revPaymentStatus} onValueChange={setRevPaymentStatus}>
                        <SelectTrigger data-testid="select-rev-payment-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">{t('finance.paid')}</SelectItem>
                          <SelectItem value="pending">{t('finance.pending')}</SelectItem>
                          <SelectItem value="unpaid">{t('finance.unpaid')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => addRevenueMutation.mutate()}
                    disabled={!revDescription || !revCategory || !revAmount || addRevenueMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-revenue"
                  >
                    {addRevenueMutation.isPending ? t('common.adding') : t('owner.financeCenter.addRevenue')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {revenuesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : revenues && revenues.length > 0 ? (
            <div className="space-y-2">
              {revenues.map((rev: any, idx: number) => (
                <Card key={rev.id || idx} data-testid={`card-revenue-${rev.id || idx}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-md bg-green-500/10 shrink-0">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-rev-desc-${rev.id || idx}`}>{rev.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">{rev.date ? new Date(rev.date).toLocaleDateString() : rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ""}</span>
                          {rev.category && <Badge variant="secondary" className="text-xs">{rev.category}</Badge>}
                          {rev.source && <span className="text-xs text-muted-foreground">{rev.source}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rev.paymentStatus && (
                        <Badge variant={rev.paymentStatus === "paid" ? "default" : "outline"} className="text-xs">
                          {rev.paymentStatus}
                        </Badge>
                      )}
                      <span className="font-semibold text-sm text-green-600 dark:text-green-400" data-testid={`text-rev-amount-${rev.id || idx}`}>
                        {formatCurrency(rev.amount || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">{t('owner.financeCenter.noRevenueRecords')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('owner.financeCenter.addFirstRevenue')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">{t('owner.financeCenter.expenseRecords', { count: expenses?.length || 0 })}</p>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-expense">
                  <Plus className="h-4 w-4" />
                  {t('owner.financeCenter.addExpense')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('owner.financeCenter.addExpense')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('common.description')}</Label>
                    <Input value={expDescription} onChange={(e) => setExpDescription(e.target.value)} placeholder={t('owner.expensePlaceholder', 'e.g. Cleaning supplies')} data-testid="input-exp-description" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.category')}</Label>
                    <Select value={expCategory} onValueChange={setExpCategory}>
                      <SelectTrigger data-testid="select-exp-category">
                        <SelectValue placeholder={t('common.selectOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.vendor')}</Label>
                    <Input value={expVendor} onChange={(e) => setExpVendor(e.target.value)} placeholder={t('owner.vendorPlaceholder', 'e.g. Amazon')} data-testid="input-exp-vendor" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.amount')} ($)</Label>
                    <Input type="number" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0.00" data-testid="input-exp-amount" />
                  </div>
                  <Button
                    onClick={() => addExpenseMutation.mutate()}
                    disabled={!expDescription || !expCategory || !expAmount || addExpenseMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-expense"
                  >
                    {addExpenseMutation.isPending ? t('common.adding') : t('owner.financeCenter.addExpense')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {expensesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((exp: any, idx: number) => (
                <Card key={exp.id || idx} data-testid={`card-expense-${exp.id || idx}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-md bg-red-500/10 shrink-0">
                        <Receipt className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-exp-desc-${exp.id || idx}`}>{exp.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">{exp.date ? new Date(exp.date).toLocaleDateString() : exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : ""}</span>
                          {exp.category && <Badge variant="secondary" className="text-xs">{exp.category}</Badge>}
                          {exp.vendor && <span className="text-xs text-muted-foreground">{exp.vendor}</span>}
                          {exp.source && <span className="text-xs text-muted-foreground">{exp.source}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-red-600 dark:text-red-400 shrink-0" data-testid={`text-exp-amount-${exp.id || idx}`}>
                      {formatCurrency(exp.amount || 0)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">{t('owner.financeCenter.noExpenseRecords')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('owner.financeCenter.addFirstExpense')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">{t('owner.financeCenter.payrollConfigurations', { count: payrollConfigs?.length || 0 })}</p>
            <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-payroll">
                  <Plus className="h-4 w-4" />
                  {t('owner.financeCenter.addPayrollConfig')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('owner.financeCenter.addPayrollConfiguration')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('owner.financeCenter.staffMember')}</Label>
                    <Select value={payrollStaffId} onValueChange={setPayrollStaffId}>
                      <SelectTrigger data-testid="select-payroll-staff">
                        <SelectValue placeholder={t('owner.financeCenter.selectStaffMember')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(staffUsers || []).map((staff: any) => (
                          <SelectItem key={staff.id} value={staff.id}>{staff.fullName} ({staff.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('owner.financeCenter.baseSalary')} ($)</Label>
                    <Input type="number" step="0.01" value={payrollBaseSalary} onChange={(e) => setPayrollBaseSalary(e.target.value)} placeholder="0.00" data-testid="input-payroll-salary" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.frequency')}</Label>
                    <Select value={payrollFrequency} onValueChange={setPayrollFrequency}>
                      <SelectTrigger data-testid="select-payroll-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t('owner.financeCenter.weekly')}</SelectItem>
                        <SelectItem value="biweekly">{t('owner.financeCenter.biweekly')}</SelectItem>
                        <SelectItem value="monthly">{t('owner.financeCenter.monthly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => addPayrollMutation.mutate()}
                    disabled={!payrollStaffId || !payrollBaseSalary || addPayrollMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-payroll"
                  >
                    {addPayrollMutation.isPending ? t('common.adding') : t('owner.financeCenter.addPayrollConfig')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {payrollLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : payrollConfigs && payrollConfigs.length > 0 ? (
            <div className="space-y-2">
              {payrollConfigs.map((pc: any, idx: number) => (
                <Card key={pc.id || idx} data-testid={`card-payroll-${pc.id || idx}`}>
                  <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-md bg-blue-500/10 shrink-0">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-payroll-name-${pc.id || idx}`}>{pc.staffName || pc.staffId}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {pc.role && <Badge variant="secondary" className="text-xs">{pc.role}</Badge>}
                          <span className="text-xs text-muted-foreground capitalize">{pc.frequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={pc.isActive !== false ? "default" : "outline"} className="text-xs">
                        {pc.isActive !== false ? t('common.active') : t('common.inactive')}
                      </Badge>
                      <span className="font-semibold text-sm text-blue-600 dark:text-blue-400" data-testid={`text-payroll-salary-${pc.id || idx}`}>
                        {formatCurrency(pc.baseSalary || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">{t('owner.financeCenter.noPayrollConfigs')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('owner.financeCenter.addFirstPayroll')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recurring" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">{t('owner.financeCenter.recurringExpenseRecords', { count: recurringExpenses?.length || 0 })}</p>
            <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-recurring">
                  <Plus className="h-4 w-4" />
                  {t('owner.financeCenter.addRecurringExpense')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('owner.financeCenter.addRecurringExpense')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('common.description')}</Label>
                    <Input value={recDescription} onChange={(e) => setRecDescription(e.target.value)} placeholder={t('owner.recurringPlaceholder', 'e.g. Monthly electricity bill')} data-testid="input-rec-description" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.category')}</Label>
                    <Select value={recCategory} onValueChange={setRecCategory}>
                      <SelectTrigger data-testid="select-rec-category">
                        <SelectValue placeholder={t('common.selectOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.vendor')}</Label>
                    <Input value={recVendor} onChange={(e) => setRecVendor(e.target.value)} placeholder={t('owner.recurringVendorPlaceholder', 'e.g. Utility Company')} data-testid="input-rec-vendor" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('common.amount')} ($)</Label>
                      <Input type="number" step="0.01" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="0.00" data-testid="input-rec-amount" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('common.frequency')}</Label>
                      <Select value={recFrequency} onValueChange={setRecFrequency}>
                        <SelectTrigger data-testid="select-rec-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('owner.financeCenter.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('owner.financeCenter.weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('owner.financeCenter.monthly')}</SelectItem>
                          <SelectItem value="quarterly">{t('owner.quarterly', 'Quarterly')}</SelectItem>
                          <SelectItem value="yearly">{t('owner.yearly', 'Yearly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => addRecurringMutation.mutate()}
                    disabled={!recDescription || !recCategory || !recAmount || addRecurringMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-recurring"
                  >
                    {addRecurringMutation.isPending ? t('common.adding') : t('owner.financeCenter.addRecurringExpense')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {recurringLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : recurringExpenses && recurringExpenses.length > 0 ? (
            <div className="space-y-2">
              {recurringExpenses.map((rec: any, idx: number) => (
                <Card key={rec.id || idx} data-testid={`card-recurring-${rec.id || idx}`}>
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-md bg-orange-500/10 shrink-0">
                        <RefreshCw className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate" data-testid={`text-rec-desc-${rec.id || idx}`}>{rec.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {rec.category && <Badge variant="secondary" className="text-xs">{rec.category}</Badge>}
                          {rec.vendor && <span className="text-xs text-muted-foreground truncate">{rec.vendor}</span>}
                          <span className="text-xs text-muted-foreground capitalize">{rec.frequency}</span>
                          {rec.nextRunDate && <span className="text-xs text-muted-foreground whitespace-nowrap">{t('owner.next', 'Next')}: {new Date(rec.nextRunDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Badge variant={rec.isActive !== false ? "default" : "outline"} className="text-xs">
                        {rec.isActive !== false ? t('common.active') : t('common.inactive')}
                      </Badge>
                      <span className="font-semibold text-sm whitespace-nowrap" data-testid={`text-rec-amount-${rec.id || idx}`}>
                        {formatCurrency(rec.amount || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-medium">{t('owner.financeCenter.noRecurringExpenses')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('owner.financeCenter.addFirstRecurring')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EscalationsView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: escalations, isLoading, refetch: refetchEscalations } = useQuery<any[]>({
    queryKey: ["/api/chat/escalations"],
  });

  const { data: staffUsers } = useQuery<any[]>({
    queryKey: ["/api/staff/users"],
  });

  const { data: replies, isLoading: repliesLoading, refetch: refetchReplies } = useQuery<EscalationReply[]>({
    queryKey: ["/api/escalations", selectedEscalationId, "replies"],
    enabled: !!selectedEscalationId,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ escalationId, message }: { escalationId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/escalations/${escalationId}/reply`, { message });
      return response.json();
    },
    onSuccess: () => {
      setReplyText("");
      refetchReplies();
      refetchEscalations();
      toast({ title: t('owner.escalations.replySent', 'Reply sent successfully') });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ escalationId, status, assignedTo }: { escalationId: string; status: EscalationStatus; assignedTo?: string | null }) => {
      const response = await apiRequest("PATCH", `/api/escalations/${escalationId}/status`, { status, assignedTo });
      return response.json();
    },
    onSuccess: () => {
      refetchEscalations();
      toast({ title: t('owner.escalations.statusUpdated', 'Status updated successfully') });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleSendReply = () => {
    if (!selectedEscalationId || !replyText.trim()) return;
    replyMutation.mutate({ escalationId: selectedEscalationId, message: replyText.trim() });
  };

  const getStatusColor = (status: EscalationStatus) => {
    switch (status) {
      case "open":
        return "text-destructive";
      case "in_progress":
        return "text-orange-500";
      case "resolved":
        return "text-blue-500";
      case "closed":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const selectedEscalation = selectedEscalationId ? escalations?.find((e: any) => e.id === selectedEscalationId) : null;

  return (
    <div className="space-y-6" data-testid="escalations-view">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className="text-lg font-semibold">{t('nav.escalations', 'Escalated Issues')}</h2>
      </div>

      {!escalations || escalations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium">{t('owner.noEscalations', 'No escalated issues')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('owner.noEscalationsDesc', 'Staff can escalate guest issues that need your attention')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('owner.escalations.list', 'Escalations')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {escalations.map((escalation: any) => (
                    <div
                      key={escalation.id}
                      className={`p-3 cursor-pointer hover-elevate ${
                        selectedEscalationId === escalation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => {
                        setSelectedEscalationId(escalation.id);
                        setReplyText("");
                      }}
                      data-testid={`escalation-item-${escalation.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{escalation.senderName || t('common.unknown')}</span>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(escalation.status)}`}>
                            {escalation.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{escalation.message}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(escalation.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {selectedEscalation ? `${t('owner.escalations.details', 'Details')}` : t('owner.escalations.selectEscalation', 'Select an escalation')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEscalation ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">{t('owner.escalations.from', 'From')}</Label>
                      <p className="text-sm">{selectedEscalation.senderName || t('common.unknown')}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">{t('owner.escalations.status', 'Status')}</Label>
                      <Select
                        value={selectedEscalation.status}
                        onValueChange={(status) => {
                          statusMutation.mutate({ escalationId: selectedEscalation.id, status: status as EscalationStatus });
                        }}
                        disabled={statusMutation.isPending}
                      >
                        <SelectTrigger className="w-full" data-testid="select-escalation-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">{t('owner.escalations.status.open', 'Open')}</SelectItem>
                          <SelectItem value="in_progress">{t('owner.escalations.status.inProgress', 'In Progress')}</SelectItem>
                          <SelectItem value="resolved">{t('owner.escalations.status.resolved', 'Resolved')}</SelectItem>
                          <SelectItem value="closed">{t('owner.escalations.status.closed', 'Closed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">{t('owner.escalations.assignTo', 'Assign To')}</Label>
                      <Select
                        value={selectedEscalation.assignedTo || ""}
                        onValueChange={(assignedTo) => {
                          statusMutation.mutate({ escalationId: selectedEscalation.id, status: selectedEscalation.status as EscalationStatus, assignedTo });
                        }}
                        disabled={statusMutation.isPending}
                      >
                        <SelectTrigger className="w-full" data-testid="select-escalation-assignee">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">{t('owner.escalations.unassigned', 'Unassigned')}</SelectItem>
                          {staffUsers?.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">{t('owner.escalations.message', 'Message')}</Label>
                      <p className="text-sm mt-1">{selectedEscalation.message}</p>
                      {selectedEscalation.escalationNote && (
                        <>
                          <Label className="text-xs font-semibold text-muted-foreground mt-2">{t('owner.escalations.note', 'Note')}</Label>
                          <p className="text-sm mt-1">{selectedEscalation.escalationNote}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground">{t('owner.escalations.replies', 'Replies')}</Label>
                    <ScrollArea className="h-[150px] border rounded-md p-3">
                      {repliesLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : replies && replies.length > 0 ? (
                        <div className="space-y-2">
                          {replies.map((reply: any) => (
                            <div key={reply.id} className="text-xs bg-muted p-2 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{reply.userName || reply.userId}</p>
                                <p className="text-muted-foreground text-xs">{formatTimeAgo(reply.createdAt)}</p>
                              </div>
                              <p className="text-muted-foreground">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('owner.escalations.noReplies', 'No replies yet')}</p>
                      )}
                    </ScrollArea>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <Label htmlFor="reply-input" className="text-xs font-semibold text-muted-foreground">{t('owner.escalations.addReply', 'Add Reply')}</Label>
                    <Textarea
                      id="reply-input"
                      placeholder={t('owner.escalations.replyPlaceholder', 'Type your reply...')}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-20"
                      disabled={replyMutation.isPending}
                      data-testid="textarea-escalation-reply"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="w-full gap-2"
                      data-testid="button-send-escalation-reply"
                    >
                      <Send className="h-4 w-4" />
                      {replyMutation.isPending ? t('common.sending') : t('owner.escalations.sendReply', 'Send Reply')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">{t('owner.escalations.selectEscalation', 'Select an escalation to view details')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RestaurantRevenueCard() {
  const { t } = useTranslation();
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/restaurant/analytics"],
    retry: false,
  });

  if (!analytics) return null;

  const fmt = (cents: number) => `₼${(cents / 100).toFixed(2)}`;

  return (
    <Card data-testid="card-restaurant-revenue">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-orange-500" />
          {t("restaurant.revenue.title", "Restaurant Revenue")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("restaurant.revenue.today", "Today")}</p>
            <p className="text-lg font-bold text-emerald-600" data-testid="text-restaurant-today">{fmt(analytics.today?.revenueCents ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{analytics.today?.orderCount ?? 0} {t("restaurant.revenue.orders", "orders")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("restaurant.revenue.thisMonth", "This Month")}</p>
            <p className="text-lg font-bold text-blue-600" data-testid="text-restaurant-month">{fmt(analytics.month?.revenueCents ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{analytics.month?.orderCount ?? 0} {t("restaurant.revenue.orders", "orders")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("restaurant.revenue.cashPayment", "Cash Payment")}</p>
            <p className="text-lg font-bold" data-testid="text-restaurant-cash">{fmt(analytics.byPaymentType?.cashCents ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("restaurant.revenue.roomCharge", "Room Charge")}</p>
            <p className="text-lg font-bold text-purple-600" data-testid="text-restaurant-room">{fmt(analytics.byPaymentType?.roomChargeCents ?? 0)}</p>
          </div>
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("restaurant.revenue.totalAllTime", "Total restaurant revenue (all time)")}</span>
            <span className="font-bold text-emerald-600" data-testid="text-restaurant-total">{fmt(analytics.totalAllTime ?? 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceAgreementCard() {
  const { t } = useTranslation();
  const { data: contractStatus, isLoading } = useQuery<{
    accepted: boolean;
    planCode?: string;
    smartPlanType?: string;
    date?: string;
    ip?: string;
    propertyName?: string;
    price?: number;
    currency?: string;
    contractVersion?: string;
  }>({
    queryKey: ["/api/contracts/status"],
  });

  if (isLoading) return null;

  return (
    <Card data-testid="card-service-agreement">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{t('billing.serviceAgreement')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {contractStatus?.accepted ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid="badge-agreement-status">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('billing.accepted')}
              </Badge>
              {contractStatus.contractVersion && (
                <Badge variant="secondary" className="text-xs">{contractStatus.contractVersion}</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {contractStatus.planCode && (
                <div>
                  <span className="font-medium text-foreground">{t('billing.plan')}: </span>
                  {contractStatus.planCode}
                </div>
              )}
              {contractStatus.smartPlanType && contractStatus.smartPlanType !== "none" && (
                <div>
                  <span className="font-medium text-foreground">{t('billing.smart')}: </span>
                  {contractStatus.smartPlanType}
                </div>
              )}
              {contractStatus.date && (
                <div>
                  <span className="font-medium text-foreground">{t('billing.date')}: </span>
                  {new Date(contractStatus.date).toLocaleDateString()}
                </div>
              )}
              {contractStatus.ip && (
                <div>
                  <span className="font-medium text-foreground">{t('billing.ip')}: </span>
                  {contractStatus.ip}
                </div>
              )}
              {contractStatus.propertyName && (
                <div>
                  <span className="font-medium text-foreground">{t('billing.property')}: </span>
                  {contractStatus.propertyName}
                </div>
              )}
              {contractStatus.price !== undefined && (
                <div>
                  <span className="font-medium text-foreground">{t('billing.monthly')}: </span>
                  ${contractStatus.price} {contractStatus.currency || "USD"}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" data-testid="badge-agreement-status">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t('billing.notAccepted')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('billing.agreementNotAcceptedDesc')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OwnerOverview({ analytics, analyticsLoading, allProperties }: {
  analytics?: OwnerAnalytics;
  analyticsLoading: boolean;
  allProperties?: Property[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="owner-overview">
      <ServiceAgreementCard />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                {analyticsLoading ? <Skeleton className="h-6 w-8" /> : (
                  <p className="text-xl font-bold">{analytics?.totalProperties || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.properties', 'Properties')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10">
                <BedDouble className="h-4 w-4 text-primary" />
              </div>
              <div>
                {analyticsLoading ? <Skeleton className="h-6 w-8" /> : (
                  <p className="text-xl font-bold">{analytics?.totalUnits || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.totalSpaces', 'Total Spaces')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                {analyticsLoading ? <Skeleton className="h-6 w-8" /> : (
                  <p className="text-xl font-bold">{analytics?.totalStaff || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.totalStaff', 'Staff')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10">
                <Cpu className="h-4 w-4 text-primary" />
              </div>
              <div>
                {analyticsLoading ? <Skeleton className="h-6 w-8" /> : (
                  <p className="text-xl font-bold">{analytics?.totalDevices || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('owner.devices', 'Devices')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {allProperties && allProperties.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{t('owner.yourProperties', 'Your Properties')}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allProperties.map((property) => (
              <Card key={property.id} className="hover-elevate cursor-pointer" onClick={() => {
                navigate(`/dashboard?view=properties`);
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{property.address}</p>
                    </div>
                    <Badge variant="secondary">{property.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const searchString = useSearch();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showPropertyDetail, setShowPropertyDetail] = useState(false);

  const params = new URLSearchParams(searchString);
  const currentView = params.get("view");

  const { data: planData } = useQuery<{ planType: string }>({
    queryKey: ["/api/plan-type"],
    enabled: !!user,
  });

  const { data: trialStatus } = useQuery<{
    planType: string;
    planCode: string;
    status: string;
    isTrial: boolean;
    trialEndsAt: string | null;
    remainingDays: number;
    isExpired: boolean;
    isActive: boolean;
    daysUntilRenewal: number | null;
    nextBillingDate: string | null;
    autoRenew: boolean;
  }>({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<OwnerAnalytics>({
    queryKey: ["/api/owner/analytics"],
    enabled: planData?.planType !== "apartment_lite",
  });

  const { data: allProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const selectedProperty = selectedPropertyId
    ? allProperties?.find((p) => p.id === selectedPropertyId)
    : allProperties?.[0];

  const renderView = () => {
    switch (currentView) {
      case "properties":
        return (
          <PropertiesView
            analytics={analytics}
            analyticsLoading={analyticsLoading}
            allProperties={allProperties}
            selectedProperty={selectedProperty}
            setSelectedPropertyId={setSelectedPropertyId}
            showPropertyDetail={showPropertyDetail}
            setShowPropertyDetail={setShowPropertyDetail}
          />
        );
      case "calendar":
        return <CalendarView />;
      case "tasks":
        return <TasksView />;
      case "messages":
      case "staff-chat":
        return <MessagesView />;
      case "escalations":
        return <EscalationsView />;
      case "performance":
        return <PerformanceView selectedPropertyId={selectedPropertyId} />;
      case "finance":
        return <FinanceCenterView />;
      case "staff-performance":
        return <StaffPerformanceView />;
      case "guests-overview":
        return <GuestsOverviewView />;
      case "staff-management":
        return <StaffManagementView />;
      default:
        return (
          <OwnerOverview
            analytics={analytics}
            analyticsLoading={analyticsLoading}
            allProperties={allProperties}
          />
        );
    }
  };

  const contactOssTeam = () => {
    const propertyName = allProperties?.[0]?.name || "";
    const ownerName = user?.fullName || "";
    const ownerEmail = user?.email || "";
    const ownerPhone = user?.phone || "";
    const message = `Hello O.S.S Team,\nProperty Name: ${propertyName}\nOwner Name: ${ownerName}\nOwner Email: ${ownerEmail}\nOwner Phone: ${ownerPhone}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/994504449292?text=${encoded}`, "_blank");
  };

  if (planData?.planType === "apartment_lite") {
    return <ApartmentLiteDashboard />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-testid="owner-dashboard">
      {/* Trial countdown banner */}
      {trialStatus?.isTrial && (
        <Card
          className={trialStatus.isExpired
            ? "border-destructive bg-destructive/5"
            : trialStatus.remainingDays <= 5
              ? "border-yellow-500 bg-yellow-500/5"
              : "border-blue-500 bg-blue-500/5"
          }
          data-testid="trial-banner"
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              {trialStatus.isExpired ? (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              ) : trialStatus.remainingDays <= 5 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-blue-500 shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {trialStatus.isExpired
                    ? t("trial.expired")
                    : trialStatus.remainingDays <= 5
                      ? t("trial.endingSoon", { days: trialStatus.remainingDays, defaultValue: `⚠️ ${trialStatus.remainingDays} gün sınaq qalıb — hesabınız silinəcək!` })
                      : t("trial.banner")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trialStatus.isExpired
                    ? t("trial.upgradePrompt")
                    : trialStatus.remainingDays <= 1
                      ? t("trial.lastDay")
                      : trialStatus.remainingDays <= 5
                        ? t("trial.deletionWarning", { defaultValue: "14 gün bitdikdən sonra ödəniş olmazsa hesabınız tam silinəcək." })
                        : t("trial.daysRemaining", { days: trialStatus.remainingDays })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={trialStatus.remainingDays <= 5 ? "destructive" : "default"}
              onClick={() => navigate("/owner/billing")}
              data-testid="button-trial-upgrade"
            >
              {t("trial.upgradeNow")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paid plan renewal countdown (shown when ≤5 days to renewal) */}
      {trialStatus && !trialStatus.isTrial && trialStatus.daysUntilRenewal !== null && trialStatus.daysUntilRenewal <= 5 && !trialStatus.isExpired && (
        <Card className="border-orange-500 bg-orange-500/5" data-testid="renewal-banner">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  {t("trial.renewalSoon", { days: trialStatus.daysUntilRenewal, defaultValue: `🔔 Abunəliyiniz ${trialStatus.daysUntilRenewal} gündən sonra yenilənəcək` })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trialStatus.nextBillingDate
                    ? t("trial.nextBilling", { date: new Date(trialStatus.nextBillingDate).toLocaleDateString(), defaultValue: `Növbəti ödəniş: ${new Date(trialStatus.nextBillingDate).toLocaleDateString()}` })
                    : t("trial.renewalAutomatic", { defaultValue: "Avtomatik yenilənmə aktiv." })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/owner/billing")}
              data-testid="button-billing-details"
            >
              {t("trial.billingDetails", { defaultValue: "Ödəniş məlumatı" })}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={contactOssTeam}
          className="gap-2"
          data-testid="button-contact-oss"
        >
          <SiWhatsapp className="h-4 w-4 text-green-600" />
          {t("owner.contactOssTeam", "Contact O.S.S Team")}
        </Button>
      </div>
      {/* Property context switcher — only shown for multi-property owners on data views */}
      {allProperties && allProperties.length > 1 && !["properties", "calendar", "tasks", "messages", "staff-chat", "escalations"].includes(currentView ?? "") && (
        <Card className="border-dashed" data-testid="card-property-context-switcher">
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Building2 className="h-4 w-4" />
              <span>{t("owner.viewingDataFor", "Məlumatlar:")}</span>
            </div>
            <Select
              value={selectedPropertyId ?? "all"}
              onValueChange={(val) => setSelectedPropertyId(val === "all" ? null : val)}
              data-testid="select-property-context"
            >
              <SelectTrigger className="w-auto min-w-[180px] h-8 text-sm font-medium" data-testid="trigger-property-context">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  🏢 {t("owner.allProperties", "Bütün Mülklər")}
                </SelectItem>
                {allProperties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} data-testid={`option-property-${p.id}`}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPropertyId && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-filtered-property">
                {t("owner.filteredView", "Filtrlənmiş görünüş")}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        {trialStatus?.isTrial && trialStatus.isExpired && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg" data-testid="trial-expired-overlay">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Lock className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t("trial.expired")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t("trial.upgradePrompt")}</p>
                </div>
                <Button
                  onClick={() => navigate("/owner/billing")}
                  data-testid="button-trial-upgrade-overlay"
                >
                  {t("trial.upgradeNow")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {renderView()}
      </div>
    </div>
  );
}
