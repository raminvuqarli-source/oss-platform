import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ApartmentLiteGuest from "@/pages/apartment-lite-guest";
import {
  Thermometer,
  Lightbulb,
  Blinds,
  Waves,
  PartyPopper,
  Coffee,
  Car,
  UtensilsCrossed,
  SprayCan,
  Wrench,
  HelpCircle,
  Send,
  Mic,
  Calendar,
  DoorOpen,
  Clock,
  Loader2,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Headphones,
  AlarmClock,
  Bot,
  Volume2,
  Play,
  Pause,
  MonitorSmartphone,
  Palette,
  Lock,
  LockOpen,
  LightbulbOff,
  XCircle,
  Bell,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RequestStatusBadge, PrepStatusBadge } from "@/components/request-status-badge";
import type { Booking, RoomSettings, ServiceRequest, ChatMessage, RoomPreparationOrder } from "@shared/schema";
import { hasSmartFeature } from "@shared/planFeatures";
import type { SmartPlanType } from "@shared/planFeatures";
import type { PlanType } from "@shared/schema";

const getServiceTypes = (t: any) => [
  { value: "coffee", label: t('services.coffee', 'Coffee/Tea'), icon: Coffee, description: t('serviceDescriptions.coffee', 'Hot beverages') },
  { value: "taxi", label: t('services.taxi', 'Taxi/Transport'), icon: Car, description: t('serviceDescriptions.taxi', 'Book a ride') },
  { value: "room_service", label: t('services.roomService', 'Room Service'), icon: UtensilsCrossed, description: t('serviceDescriptions.roomService', 'Food & drinks') },
  { value: "housekeeping", label: t('services.housekeeping', 'Housekeeping'), icon: SprayCan, description: t('serviceDescriptions.housekeeping', 'Cleaning service') },
  { value: "maintenance", label: t('services.maintenance', 'Maintenance'), icon: Wrench, description: t('serviceDescriptions.maintenance', 'Technical issues') },
  { value: "concierge", label: t('services.guestExperienceServices', 'Guest Experience Services'), icon: HelpCircle, description: t('serviceDescriptions.concierge', 'Expert guest assistance') },
];

function RoomControlCard({
  title,
  description,
  icon: Icon,
  children,
  iconColor = "text-primary",
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md bg-muted ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const smartExtras = [
  {
    id: "immersive-audio",
    titleKey: "smartExtras.immersiveAudio",
    descKey: "smartExtras.immersiveAudioDesc",
    icon: Headphones,
    iconColor: "text-pink-500",
    optionKeys: ["smartExtras.relaxing", "smartExtras.jazz", "smartExtras.nature", "smartExtras.focus"],
  },
  {
    id: "ai-wakeup",
    titleKey: "smartExtras.aiWakeup",
    descKey: "smartExtras.aiWakeupDesc",
    icon: AlarmClock,
    iconColor: "text-amber-500",
    optionKeys: ["smartExtras.gentle", "smartExtras.energizing", "smartExtras.naturalLight", "smartExtras.music"],
  },
  {
    id: "guest-experience-ai",
    titleKey: "smartExtras.guestExperienceAi",
    descKey: "smartExtras.guestExperienceAiDesc",
    icon: Bot,
    iconColor: "text-violet-500",
    optionKeys: ["smartExtras.recommendations", "smartExtras.bookings", "smartExtras.inquiries", "smartExtras.localTips"],
  },
  {
    id: "smart-mirror",
    titleKey: "smartExtras.smartMirror",
    descKey: "smartExtras.smartMirrorDesc",
    icon: MonitorSmartphone,
    iconColor: "text-sky-500",
    optionKeys: ["smartExtras.weather", "smartExtras.news", "smartExtras.calendar", "smartExtras.fitness"],
  },
  {
    id: "mood-lighting",
    titleKey: "smartExtras.moodLighting",
    descKey: "smartExtras.moodLightingDesc",
    icon: Palette,
    iconColor: "text-rose-500",
    optionKeys: ["smartExtras.relax", "smartExtras.focusMode", "smartExtras.romantic", "smartExtras.party"],
  },
];

function SmartExtraCard({
  extra,
  onActivate,
  t,
}: {
  extra: typeof smartExtras[0];
  onActivate: (id: string, option: string) => void;
  t: any;
}) {
  const [isActive, setIsActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState(extra.optionKeys[0]);
  const Icon = extra.icon;

  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md bg-muted ${extra.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{t(extra.titleKey)}</CardTitle>
              <CardDescription className="text-xs">{t(extra.descKey)}</CardDescription>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => {
              setIsActive(checked);
              if (checked) onActivate(extra.id, t(selectedOption));
            }}
            data-testid={`switch-${extra.id}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Select value={selectedOption} onValueChange={setSelectedOption} disabled={!isActive}>
            <SelectTrigger className="w-full" data-testid={`select-${extra.id}-option`}>
              <SelectValue>{t(selectedOption)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {extra.optionKeys.map((optionKey) => (
                <SelectItem key={optionKey} value={optionKey}>
                  {t(optionKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isActive && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>{t('common.active', 'Active')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


export default function GuestDashboard() {
  const { t } = useTranslation();
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();

  const servicesRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const roomControlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const view = params.get("view");
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      services: servicesRef,
      messages: messagesRef,
      "room-controls": roomControlsRef,
    };
    const ref = view ? refMap[view] : null;
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchString]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [requestDescription, setRequestDescription] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [prepDialogOpen, setPrepDialogOpen] = useState(false);
  const [prepOccasion, setPrepOccasion] = useState("");
  const [prepDecoration, setPrepDecoration] = useState("");
  const [prepBudget, setPrepBudget] = useState("medium");
  const [prepNotes, setPrepNotes] = useState("");
  const [prepDatetime, setPrepDatetime] = useState("");
  const [prepAddOns, setPrepAddOns] = useState<string[]>([]);
  const [prepRefImage, setPrepRefImage] = useState("");
  const [prepCustomBudget, setPrepCustomBudget] = useState("");

  const [preCheckDialogOpen, setPreCheckDialogOpen] = useState(false);
  const [preCheckForm, setPreCheckForm] = useState({
    arrivalTime: "",
    preCheckNotes: "",
  });

  const [onlineCheckinOpen, setOnlineCheckinOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    passportNumber: "",
    nationality: "",
    dateOfBirth: "",
    guestAddress: "",
    numberOfGuests: "",
    specialRequests: "",
  });
  const [idDocumentBase64, setIdDocumentBase64] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [orderFoodOpen, setOrderFoodOpen] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Record<string, number>>({});
  const [orderType, setOrderType] = useState<"dine_in" | "room_delivery">("dine_in");
  const [tableNumber, setTableNumber] = useState("");

  const [localTemperature, setLocalTemperature] = useState<number>(22);
  const [localBrightness, setLocalBrightness] = useState<number>(50);
  const [localBathroomBrightness, setLocalBathroomBrightness] = useState<number>(50);
  const [localHallBrightness, setLocalHallBrightness] = useState<number>(50);
  const [localCurtainsPosition, setLocalCurtainsPosition] = useState<number>(0);
  const [localJacuzziTemp, setLocalJacuzziTemp] = useState<number>(38);

  // AI Wake-Up alarm state
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmHour, setAlarmHour] = useState("07");
  const [alarmMinute, setAlarmMinute] = useState("00");

  const serviceTypes = getServiceTypes(t);

  const { data: planData } = useQuery<{ planType: string; smartPlanType: string }>({
    queryKey: ["/api/plan-type"],
    enabled: !!user,
  });

  const smartPlan = (planData?.smartPlanType || "none") as SmartPlanType;
  const isGuest = user?.role === "guest";
  const hotelHasSmart = smartPlan !== "none";
  const smartControlsEnabled = hotelHasSmart;

  const canLight = hasSmartFeature(smartPlan, "light_control");
  const canAC = hasSmartFeature(smartPlan, "ac_control");
  const canLock = hasSmartFeature(smartPlan, "smart_lock");
  const canPreCheckin = hasSmartFeature(smartPlan, "pre_checkin");
  const canCurtains = hasSmartFeature(smartPlan, "curtains");
  const canJacuzzi = hasSmartFeature(smartPlan, "jacuzzi");
  const canWelcome = hasSmartFeature(smartPlan, "welcome_mode");
  const canMoodLighting = hasSmartFeature(smartPlan, "mood_lighting");
  const canImmersiveAudio = hasSmartFeature(smartPlan, "immersive_audio");
  const canSmartMirror = hasSmartFeature(smartPlan, "smart_mirror");
  const canAiWakeup = hasSmartFeature(smartPlan, "ai_wakeup");
  const canGuestAi = hasSmartFeature(smartPlan, "guest_ai");

  const { data: booking, isLoading: bookingLoading } = useQuery<Booking>({
    queryKey: ["/api/bookings/current"],
  });

  const { data: roomSettings, isLoading: settingsLoading } = useQuery<RoomSettings>({
    queryKey: ["/api/room-settings", booking?.id],
    enabled: !!booking?.id,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/service-requests"],
  });

  const { data: chatMessages, isLoading: chatLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (chatEndRef.current) {
      const viewport = chatEndRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  const { data: prepOrders, isLoading: prepOrdersLoading } = useQuery<RoomPreparationOrder[]>({
    queryKey: ["/api/room-prep-orders/my"],
  });

  const createPrepOrderMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await apiRequest("POST", "/api/room-prep-orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-prep-orders/my"] });
      setPrepDialogOpen(false);
      setPrepOccasion("");
      setPrepDecoration("");
      setPrepBudget("medium");
      setPrepNotes("");
      setPrepDatetime("");
      setPrepAddOns([]);
      setPrepRefImage("");
      setPrepCustomBudget("");
      toast({ title: t('roomPrep.orderCreated') });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const { data: restaurantMenu } = useQuery<{ categories: Array<{ id: string; name: string }>; items: Array<{ id: string; name: string; description: string | null; priceCents: number; categoryId: string | null; isAvailable: boolean }> }>({
    queryKey: ["/api/restaurant/menu"],
  });

  const callWaiterMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/restaurant/waiter-call", {
      roomNumber: booking?.unitId || undefined,
      bookingId: booking?.id || undefined,
    }),
    onSuccess: () => toast({ title: "Waiter notified", description: "A waiter will be with you shortly." }),
    onError: () => toast({ title: "Could not call waiter", variant: "destructive" }),
  });

  const placeOrderMutation = useMutation({
    mutationFn: (items: Array<{ menuItemId: string; itemName: string; quantity: number; unitPriceCents: number }>) =>
      apiRequest("POST", "/api/restaurant/orders", {
        bookingId: booking?.id,
        guestName: user?.fullName,
        orderType,
        tableNumber: orderType === "dine_in" && tableNumber ? tableNumber : null,
        roomNumber: orderType === "room_delivery" ? (booking?.roomNumber || null) : null,
        items,
      }),
    onSuccess: () => {
      setSelectedMenuItems({});
      setOrderFoodOpen(false);
      setTableNumber("");
      toast({ title: t('restaurant.orderPlaced'), description: t('restaurant.orderPlacedDesc') });
    },
    onError: () => toast({ title: t('restaurant.orderFailed'), variant: "destructive" }),
  });

  const handlePlaceOrder = () => {
    if (!restaurantMenu) return;
    const items = Object.entries(selectedMenuItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = restaurantMenu.items.find(i => i.id === id)!;
        return { menuItemId: id, itemName: item.name, quantity: qty, unitPriceCents: item.priceCents };
      });
    if (items.length === 0) return;
    placeOrderMutation.mutate(items);
  };

  const handleCreatePrepOrder = () => {
    if (!prepOccasion) return;
    createPrepOrderMutation.mutate({
      occasionType: prepOccasion,
      decorationStyle: prepDecoration || undefined,
      addOns: prepAddOns.length > 0 ? prepAddOns : undefined,
      notes: prepNotes || undefined,
      budgetRange: prepBudget,
      customBudget: prepBudget === "custom" && prepCustomBudget ? parseInt(prepCustomBudget) * 100 : undefined,
      preferredDatetime: prepDatetime || undefined,
      referenceImageUrl: prepRefImage || undefined,
    });
  };

  const toggleAddOn = (addon: string) => {
    setPrepAddOns(prev => prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon]);
  };

  // Sync local slider state with server data when roomSettings changes
  useEffect(() => {
    if (roomSettings) {
      setLocalTemperature(roomSettings.temperature ?? 22);
      setLocalBrightness(roomSettings.lightsBrightness ?? 50);
      setLocalBathroomBrightness(roomSettings.bathroomLightsBrightness ?? 50);
      setLocalHallBrightness(roomSettings.hallLightsBrightness ?? 50);
      setLocalCurtainsPosition(roomSettings.curtainsPosition ?? 0);
      setLocalJacuzziTemp(roomSettings.jacuzziTemperature ?? 38);
    }
  }, [roomSettings]);

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/messages", { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setChatMessage("");
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    sendChatMutation.mutate(chatMessage.trim());
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<RoomSettings>) => {
      if (!hotelHasSmart) return;
      const response = await apiRequest("PATCH", `/api/room-settings/${booking?.id}`, settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-settings", booking?.id] });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { requestType: string; description: string }) => {
      const response = await apiRequest("POST", "/api/service-requests", {
        ...data,
        guestId: user?.id,
        bookingId: booking?.id,
        roomNumber: booking?.roomNumber,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      setRequestDialogOpen(false);
      setSelectedService("");
      setRequestDescription("");
      toast({
        title: t('requests.requestSubmitted', 'Request sent'),
        description: t('requests.requestSubmittedDesc', 'Your request has been sent to reception.'),
      });
    },
  });

  const doorControlMutation = useMutation({
    mutationFn: async (action: "open" | "close") => {
      if (!hotelHasSmart) return;
      const response = await apiRequest("POST", `/api/door/${booking?.id}/control`, { action });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-settings", booking?.id] });
      toast({
        title: data.doorLocked ? t('room.locked', 'Door Locked') : t('room.unlocked', 'Door Unlocked'),
        description: data.message,
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const preCheckInMutation = useMutation({
    mutationFn: async (formData: typeof preCheckForm) => {
      const response = await apiRequest("POST", `/api/bookings/${booking?.id}/arrival-info`, formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/current"] });
      setPreCheckDialogOpen(false);
      setPreCheckForm({ arrivalTime: "", preCheckNotes: "" });
      toast({
        title: t('dashboard.guest.arrivalInfoSubmitted', 'Arrival Information Submitted'),
        description: t('dashboard.guest.arrivalInfoSubmittedDesc', 'Reception will prepare your room based on your arrival details.'),
      });
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const onlineCheckinMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const url = `/api/bookings/${booking?.id}/precheck`;
      console.log("[PRECHECK] mutationFn called, POST to:", url);
      console.log("[PRECHECK] payload keys:", Object.keys(payload));
      try {
        const response = await apiRequest("POST", url, payload);
        console.log("[PRECHECK] Response status:", response.status);
        return response.json();
      } catch (err: any) {
        console.error("[PRECHECK] Request failed:", err?.message || err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[PRECHECK] SUCCESS!");
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/current"] });
      setOnlineCheckinOpen(false);
      setCheckinForm({ passportNumber: "", nationality: "", dateOfBirth: "", guestAddress: "", numberOfGuests: "", specialRequests: "" });
      setIdDocumentBase64(null);
      clearSignatureCanvas();
      toast({
        title: "Online check-in göndərildi",
        description: "Resepşn məlumatlarınızı yoxlayacaq.",
      });
    },
    onError: (error: Error) => {
      console.error("[PRECHECK] ERROR:", error?.message || error);
      showErrorToast(toast, error);
    },
  });

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const getSignatureBase64 = (): string | null => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((val, i) => i % 4 === 3 && val > 0);
    if (!hasContent) return null;
    return canvas.toDataURL("image/png");
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleIdDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Fayl çox böyükdür", description: "Maksimum 2MB icazə verilir.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setIdDocumentBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmitOnlineCheckin = () => {
    console.log("[PRECHECK] Submit started");
    console.log("[PRECHECK] booking:", booking?.id, "status:", booking?.status);
    console.log("[PRECHECK] checkinForm:", JSON.stringify(checkinForm));
    console.log("[PRECHECK] idDocumentBase64 length:", idDocumentBase64?.length || 0);

    if (!checkinForm.passportNumber || !checkinForm.nationality || !checkinForm.dateOfBirth) {
      console.log("[PRECHECK] Validation failed: missing required fields");
      toast({ title: t('checkin.error', 'Error'), description: t('checkin.requiredFields', 'Passport number, nationality and date of birth are required.'), variant: "destructive" });
      return;
    }
    const signatureData = getSignatureBase64();
    console.log("[PRECHECK] signatureData length:", signatureData?.length || 0);
    if (!signatureData) {
      console.log("[PRECHECK] Validation failed: no signature");
      toast({ title: t('checkin.error', 'Error'), description: t('checkin.signatureRequired', 'Signature is required.'), variant: "destructive" });
      return;
    }

    const payload = {
      ...checkinForm,
      guestSignatureBase64: signatureData,
      idDocumentBase64: idDocumentBase64 || undefined,
    };
    const payloadSize = JSON.stringify(payload).length;
    console.log("[PRECHECK] Payload size:", payloadSize, "bytes (", (payloadSize / 1024).toFixed(1), "KB)");
    console.log("[PRECHECK] POST URL:", `/api/bookings/${booking?.id}/precheck`);
    console.log("[PRECHECK] Calling mutation.mutate now...");

    onlineCheckinMutation.mutate(payload);
  };

  const handleSettingChange = (key: string, value: any) => {
    if (!hotelHasSmart) return;
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleSubmitRequest = () => {
    if (!selectedService || !requestDescription.trim()) {
      showErrorToast(toast, new Error(t('requests.selectServiceAndDescribe', 'Please select a service type and describe your request.')));
      return;
    }
    createRequestMutation.mutate({
      requestType: selectedService,
      description: requestDescription,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (bookingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('dashboard.guest.welcomeBack', 'Welcome back,')}</p>
              <h2 className="text-2xl font-bold">{user?.fullName}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{t('dashboard.guest.noActiveBooking')}</h3>
          <p className="text-muted-foreground">
            {t('dashboard.guest.noActiveBookingDesc', "You don't have an active booking at this time. Please contact reception for assistance.")}
          </p>
        </Card>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (planData?.planType === "apartment_lite") {
    return <ApartmentLiteGuest />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('dashboard.guest.welcomeBack', 'Welcome back,')}</p>
              <h2 className="text-2xl font-bold">{user?.fullName}</h2>
              {booking && (
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DoorOpen className="h-4 w-4 text-primary" />
                    <span>{t('common.room')} {booking.roomNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
                  </div>
                  {booking.status === "arrival_info_submitted" && (
                    <Badge variant="secondary" data-testid="badge-arrival-status">
                      <Clock className="h-3 w-3 mr-1" />
                      {t('dashboard.guest.arrivalInfoSent', 'Arrival info sent')}
                    </Badge>
                  )}
                  {booking.status === "precheck_submitted" && (
                    <Badge variant="default" data-testid="badge-precheck-status">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Online check-in göndərilib
                    </Badge>
                  )}
                  {booking.status === "checked_in" && (
                    <Badge variant="default" data-testid="badge-arrival-status">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('dashboard.guest.checkedIn', 'Checked in')}
                    </Badge>
                  )}
                  {(booking.status === "booked" || booking.status === "pending" || booking.status === "confirmed") && (
                    <Badge variant="secondary" data-testid="badge-arrival-status">
                      {t('dashboard.guest.notCheckedIn', 'Not checked in')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {booking && (booking.status === "booked" || booking.status === "pending" || booking.status === "confirmed" || booking.status === "arrival_info_submitted") && (
              <div className="flex gap-2 shrink-0">
                {(booking.status === "booked" || booking.status === "pending" || booking.status === "confirmed") && (
                  <Button 
                    variant="outline"
                    onClick={() => setPreCheckDialogOpen(true)}
                    data-testid="button-prepare-stay"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {t('dashboard.guest.prepareMyStay', 'Prepare My Stay')}
                  </Button>
                )}
                <Button 
                  onClick={() => setOnlineCheckinOpen(true)}
                  data-testid="button-online-checkin"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('dashboard.guest.onlineCheckin', 'Online Check-in')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {booking && booking.status === "arrival_info_submitted" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{t('dashboard.guest.arrivalInfoReceivedTitle', 'Arrival Information Received')}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.guest.arrivalInfoReceivedDesc', 'Reception will prepare your room based on your arrival details. Check-in will be confirmed at the front desk.')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {booking && booking.status === "precheck_submitted" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{t('dashboard.guest.precheckSubmitted', 'Online check-in submitted')}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.guest.precheckSubmittedDesc', 'Reception will review your information. Check-in will be confirmed upon arrival.')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div ref={roomControlsRef}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">{t('dashboard.guest.roomControls')}</h3>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            {t('room.smartControl', 'Smart Control')}
          </Badge>
        </div>
        
        {!smartControlsEnabled && (
          <Card className="mb-4 border-muted-foreground/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('plan.smartControlsNotAvailable', 'Bu xidmət bu oteldə mövcud deyil')}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {t('plan.smartControlsNotAvailableDesc', 'Bu otel smart idarəetmə paketini aktivləşdirməyib.')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!smartControlsEnabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          {/* Smart Door Lock */}
          <div className={!canLock ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <RoomControlCard
            title={t('room.smartDoorLock', 'Smart Door Lock')}
            description={t('room.controlDoor', 'Control your room door')}
            icon={roomSettings?.doorLocked ? Lock : LockOpen}
            iconColor={roomSettings?.doorLocked ? "text-green-500" : "text-red-500"}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {roomSettings?.doorLocked ? (
                    <>
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">{t('room.locked')}</span>
                    </>
                  ) : (
                    <>
                      <LockOpen className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('room.unlocked')}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={roomSettings?.doorLocked ? "outline" : "default"}
                  size="sm"
                  className="flex-1"
                  onClick={() => doorControlMutation.mutate("open")}
                  disabled={doorControlMutation.isPending || !roomSettings?.doorLocked}
                  data-testid="button-unlock-door"
                >
                  {doorControlMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LockOpen className="h-4 w-4 mr-1" />
                      {t('room.unlocked')}
                    </>
                  )}
                </Button>
                <Button
                  variant={roomSettings?.doorLocked ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => doorControlMutation.mutate("close")}
                  disabled={doorControlMutation.isPending || !!roomSettings?.doorLocked}
                  data-testid="button-lock-door"
                >
                  {doorControlMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-1" />
                      {t('room.locked')}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('room.controlDoorRemotelyDesc', 'Securely control your room door remotely')}
              </p>
            </div>
          </RoomControlCard>
          </div>

          {/* Lights - Light Control */}
          <div className={!canLight ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <RoomControlCard
            title={t('room.lights')}
            description={t('room.controlLights', 'Control room lights')}
            icon={Lightbulb}
            iconColor="text-yellow-500"
          >
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('room.mainRoomLights', 'Main Room Lights')}</span>
                  <Switch
                    checked={roomSettings?.lightsOn || false}
                    onCheckedChange={(checked) => handleSettingChange("lightsOn", checked)}
                    data-testid="switch-lights"
                  />
                </div>
                {roomSettings?.lightsOn && (
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('room.brightness')}</span>
                      <span className="text-xs font-medium">{localBrightness}%</span>
                    </div>
                    <Slider
                      value={[localBrightness]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => setLocalBrightness(value)}
                      onValueCommit={([value]) => handleSettingChange("lightsBrightness", value)}
                      data-testid="slider-brightness"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('room.bathroomLights', 'Bathroom Lights')}</span>
                  <Switch
                    checked={roomSettings?.bathroomLightsOn || false}
                    onCheckedChange={(checked) => handleSettingChange("bathroomLightsOn", checked)}
                    data-testid="switch-bathroom-lights"
                  />
                </div>
                {roomSettings?.bathroomLightsOn && (
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('room.brightness')}</span>
                      <span className="text-xs font-medium">{localBathroomBrightness}%</span>
                    </div>
                    <Slider
                      value={[localBathroomBrightness]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => setLocalBathroomBrightness(value)}
                      onValueCommit={([value]) => handleSettingChange("bathroomLightsBrightness", value)}
                      data-testid="slider-bathroom-brightness"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('room.hallLights', 'Hall / Living Area')}</span>
                  <Switch
                    checked={roomSettings?.hallLightsOn || false}
                    onCheckedChange={(checked) => handleSettingChange("hallLightsOn", checked)}
                    data-testid="switch-hall-lights"
                  />
                </div>
                {roomSettings?.hallLightsOn && (
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('room.brightness')}</span>
                      <span className="text-xs font-medium">{localHallBrightness}%</span>
                    </div>
                    <Slider
                      value={[localHallBrightness]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => setLocalHallBrightness(value)}
                      onValueCommit={([value]) => handleSettingChange("hallLightsBrightness", value)}
                      data-testid="slider-hall-brightness"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <span className="text-sm font-medium">{t('room.otherLights', 'Other Lights')}</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange("nonDimmableLightsOn", true)}
                    className={roomSettings?.nonDimmableLightsOn ? "border-primary text-primary toggle-elevate toggle-elevated" : "toggle-elevate"}
                    data-testid="button-all-lights-on"
                  >
                    <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                    {t('room.allOn', 'All ON')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSettingChange("nonDimmableLightsOn", false)}
                    className={!roomSettings?.nonDimmableLightsOn ? "border-primary text-primary toggle-elevate toggle-elevated" : "toggle-elevate"}
                    data-testid="button-all-lights-off"
                  >
                    <LightbulbOff className="h-3.5 w-3.5 mr-1.5" />
                    {t('room.allOff', 'All OFF')}
                  </Button>
                </div>
              </div>
            </div>
          </RoomControlCard>
          </div>

          {/* Temperature - AC Control */}
          <div className={!canAC ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <RoomControlCard
            title={t('room.temperature')}
            description={t('room.adjustTemperature', 'Adjust room temperature')}
            icon={Thermometer}
            iconColor="text-orange-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{localTemperature}°C</span>
              </div>
              <Slider
                value={[localTemperature]}
                min={16}
                max={30}
                step={1}
                onValueChange={([value]) => setLocalTemperature(value)}
                onValueCommit={([value]) => handleSettingChange("temperature", value)}
                data-testid="slider-temperature"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>16°C</span>
                <span>30°C</span>
              </div>
            </div>
          </RoomControlCard>
          </div>

          {/* Jacuzzi */}
          <div className={!canJacuzzi ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <RoomControlCard
            title={t('room.jacuzzi')}
            description={t('room.controlJacuzzi', 'Control jacuzzi settings')}
            icon={Waves}
            iconColor="text-cyan-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('room.jacuzzi')}</span>
                <Switch
                  checked={roomSettings?.jacuzziOn || false}
                  onCheckedChange={(checked) => handleSettingChange("jacuzziOn", checked)}
                  data-testid="switch-jacuzzi"
                />
              </div>
              {roomSettings?.jacuzziOn && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('room.temperature')}</span>
                    <span className="text-sm font-medium">{localJacuzziTemp}°C</span>
                  </div>
                  <Slider
                    value={[localJacuzziTemp]}
                    min={32}
                    max={42}
                    step={1}
                    onValueChange={([value]) => setLocalJacuzziTemp(value)}
                    onValueCommit={([value]) => handleSettingChange("jacuzziTemperature", value)}
                    data-testid="slider-jacuzzi-temp"
                  />
                </>
              )}
            </div>
          </RoomControlCard>
          </div>

          {/* Welcome Mode */}
          <div className={!canWelcome ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <RoomControlCard
            title={t('room.welcomeMode', 'Welcome Mode')}
            description={t('room.prepareRoom', 'Prepare room for arrival')}
            icon={PartyPopper}
            iconColor="text-purple-500"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {roomSettings?.welcomeMode ? t('room.on') : t('room.off')}
                </span>
                <Switch
                  checked={roomSettings?.welcomeMode || false}
                  onCheckedChange={(checked) => handleSettingChange("welcomeMode", checked)}
                  data-testid="switch-welcome-mode"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('room.welcomeModeDesc', 'Automatically sets ideal temperature, lighting, and plays welcome music')}
              </p>
            </div>
          </RoomControlCard>
          </div>

          {/* Curtains */}
          <div className={!canCurtains ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <RoomControlCard
            title={t('room.curtains')}
            description={t('room.controlCurtains', 'Open or close curtains')}
            icon={Blinds}
            iconColor="text-blue-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('room.curtains')}</span>
                <Switch
                  checked={roomSettings?.curtainsOpen || false}
                  onCheckedChange={(checked) => {
                    handleSettingChange("curtainsOpen", checked);
                    if (checked && localCurtainsPosition === 0) {
                      setLocalCurtainsPosition(100);
                      handleSettingChange("curtainsPosition", 100);
                    }
                    if (!checked) {
                      setLocalCurtainsPosition(0);
                      handleSettingChange("curtainsPosition", 0);
                    }
                  }}
                  data-testid="switch-curtains"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={localCurtainsPosition === 0 ? "secondary" : localCurtainsPosition === 100 ? "default" : "outline"}
                  data-testid="badge-curtains-state"
                >
                  {localCurtainsPosition === 0
                    ? t('room.curtainsClosed', 'Closed')
                    : localCurtainsPosition === 100
                      ? t('room.curtainsFullyOpen', 'Fully Open')
                      : t('room.curtainsPartiallyOpen', 'Partially Open')}
                </Badge>
                <span className="text-sm font-medium ml-auto" data-testid="text-curtains-position">{localCurtainsPosition}%</span>
              </div>
              <Slider
                value={[localCurtainsPosition]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => setLocalCurtainsPosition(value)}
                onValueCommit={([value]) => {
                  handleSettingChange("curtainsPosition", value);
                  handleSettingChange("curtainsOpen", value > 0);
                }}
                data-testid="slider-curtains-position"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('room.curtainsClosed', 'Closed')}</span>
                <span>{t('room.curtainsFullyOpen', 'Fully Open')}</span>
              </div>
            </div>
          </RoomControlCard>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">{t('smartExtras.title', 'Smart Extras')}</h3>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            {t('smartExtras.premiumFeatures', 'Premium Features')}
          </Badge>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!smartControlsEnabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          {smartExtras.filter(e => e.id !== "ai-wakeup").map((extra) => {
            const featureMap: Record<string, boolean> = {
              "immersive-audio": canImmersiveAudio,
              "guest-experience-ai": canGuestAi,
              "smart-mirror": canSmartMirror,
              "mood-lighting": canMoodLighting,
            };
            const allowed = featureMap[extra.id] ?? false;
            return (
              <div key={extra.id} className={!allowed ? 'opacity-40 pointer-events-none select-none relative' : ''}>
                <SmartExtraCard
                  extra={extra}
                  t={t}
                  onActivate={(id, option) => {
                    toast({
                      title: t('smartExtras.activated', '{{name}} activated', { name: t(extra.titleKey) }),
                      description: t('smartExtras.mode', 'Mode: {{option}}', { option }),
                    });
                  }}
                />
              </div>
            );
          })}

          <div className={!canAiWakeup ? 'opacity-40 pointer-events-none select-none relative' : ''}>
          <Card className="overflow-visible" data-testid="card-ai-wakeup">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted text-amber-500">
                    <AlarmClock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('smartExtras.aiWakeup', 'AI Wake-up')}</CardTitle>
                    <CardDescription className="text-xs">{t('smartExtras.aiWakeupDesc', 'Personalized morning routine')}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={alarmEnabled}
                  onCheckedChange={(checked) => {
                    setAlarmEnabled(checked);
                    if (checked) {
                      toast({
                        title: t('smartExtras.alarmSet', 'Alarm Set'),
                        description: t('smartExtras.alarmSetDesc', 'Wake-up alarm set for {{time}}', { time: `${alarmHour}:${alarmMinute}` }),
                      });
                    }
                  }}
                  data-testid="switch-ai-wakeup"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alarmEnabled && (
                  <div className="flex items-center justify-center gap-1 py-2" data-testid="text-alarm-time">
                    <AlarmClock className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-3xl font-bold">{alarmHour}:{alarmMinute}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('smartExtras.alarmHour', 'Hour')}</Label>
                    <Select value={alarmHour} onValueChange={setAlarmHour} disabled={!alarmEnabled}>
                      <SelectTrigger data-testid="select-alarm-hour">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('smartExtras.alarmMinute', 'Minute')}</Label>
                    <Select value={alarmMinute} onValueChange={setAlarmMinute} disabled={!alarmEnabled}>
                      <SelectTrigger data-testid="select-alarm-minute">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {alarmEnabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{t('smartExtras.alarmActive', 'Alarm active')}</span>
                  </div>
                )}
                {!alarmEnabled && (
                  <p className="text-xs text-muted-foreground">{t('smartExtras.alarmOff', 'Enable to set your wake-up alarm')}</p>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* ─── RESTORAN BÖLMƏSI ──────────────────────────────────────── */}
      <Card className="border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/60 to-background dark:from-orange-950/20" data-testid="card-restaurant-section">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500 rounded-lg">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base">{t('restaurant.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-14 flex-col gap-1 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
              onClick={() => callWaiterMutation.mutate()}
              disabled={callWaiterMutation.isPending}
              data-testid="button-call-waiter"
            >
              <Bell className="h-5 w-5 text-orange-500" />
              <span className="text-xs font-medium">{t('restaurant.callWaiter')}</span>
            </Button>
            <Button
              className="h-14 flex-col gap-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setOrderFoodOpen(true)}
              data-testid="button-order-food"
            >
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-xs font-medium">{t('restaurant.orderFood')}</span>
            </Button>
          </div>

          {/* Menu preview — top available items */}
          {restaurantMenu && restaurantMenu.items.filter(i => i.isAvailable).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">{t('restaurant.todayOnMenu')}</p>
              <div className="flex gap-2 flex-wrap">
                {restaurantMenu.items.filter(i => i.isAvailable).slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-300 transition-colors"
                    onClick={() => {
                      setSelectedMenuItems(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
                      setOrderFoodOpen(true);
                    }}
                    data-testid={`quick-add-${item.id}`}
                  >
                    {item.name} · {(item.priceCents / 100).toFixed(2)} ₼
                  </button>
                ))}
                {restaurantMenu.items.filter(i => i.isAvailable).length > 5 && (
                  <button
                    className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-300 transition-colors text-muted-foreground"
                    onClick={() => setOrderFoodOpen(true)}
                    data-testid="button-see-full-menu"
                  >
                    {t('restaurant.moreDishes', { count: restaurantMenu.items.filter(i => i.isAvailable).length - 5 })}
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── SİFARİŞ DİALOQU ────────────────────────────────────── */}
      <Dialog open={orderFoodOpen} onOpenChange={(open) => {
        setOrderFoodOpen(open);
        if (!open) { setSelectedMenuItems({}); setTableNumber(""); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              {t('restaurant.orderFood')}
            </DialogTitle>
            <DialogDescription>{t('restaurant.orderDialogDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Order type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`p-3 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${
                  orderType === "dine_in"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                    : "border-muted bg-background hover:border-muted-foreground/30"
                }`}
                onClick={() => setOrderType("dine_in")}
                data-testid="button-order-type-dine-in"
              >
                <UtensilsCrossed className="h-4 w-4" />
                {t('restaurant.dineIn')}
              </button>
              <button
                className={`p-3 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1 transition-all ${
                  orderType === "room_delivery"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    : "border-muted bg-background hover:border-muted-foreground/30"
                }`}
                onClick={() => setOrderType("room_delivery")}
                data-testid="button-order-type-room-delivery"
              >
                <Bell className="h-4 w-4" />
                {t('restaurant.roomDelivery')}
              </button>
            </div>

            {/* Table number input for dine-in */}
            {orderType === "dine_in" && (
              <div className="space-y-1.5">
                <Label htmlFor="table-number">{t('restaurant.tableNumber')}</Label>
                <Input
                  id="table-number"
                  placeholder={t('restaurant.tableNumberPlaceholder')}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  data-testid="input-table-number"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">{t('restaurant.tableNumberHint')}</p>
              </div>
            )}
            {orderType === "room_delivery" && booking?.roomNumber && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                <Bell className="h-4 w-4 shrink-0" />
                {t('restaurant.deliverTo', { room: booking.roomNumber })}
              </div>
            )}

            {/* Menu items */}
            {!restaurantMenu || restaurantMenu.items.filter(i => i.isAvailable).length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <UtensilsCrossed className="h-10 w-10 mb-3 opacity-30" />
                <p>{t('restaurant.noMenuAvailable')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {restaurantMenu.categories.map(cat => {
                  const catItems = restaurantMenu.items.filter(i => i.categoryId === cat.id && i.isAvailable);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">{cat.name}</h4>
                      <div className="space-y-2">
                        {catItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-orange-200 transition-colors" data-testid={`menu-item-${item.id}`}>
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-0.5">{(item.priceCents / 100).toFixed(2)} ₼</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full"
                                onClick={() => setSelectedMenuItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                data-testid={`button-decrease-${item.id}`}>−</Button>
                              <span className="w-5 text-center text-sm font-bold" data-testid={`qty-${item.id}`}>{selectedMenuItems[item.id] || 0}</span>
                              <Button size="sm" className="h-7 w-7 p-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={() => setSelectedMenuItems(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                data-testid={`button-increase-${item.id}`}>+</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {restaurantMenu.items.filter(i => !i.categoryId && i.isAvailable).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-orange-200 transition-colors" data-testid={`menu-item-${item.id}`}>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-0.5">{(item.priceCents / 100).toFixed(2)} ₼</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full"
                        onClick={() => setSelectedMenuItems(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                        data-testid={`button-decrease-${item.id}`}>−</Button>
                      <span className="w-5 text-center text-sm font-bold" data-testid={`qty-${item.id}`}>{selectedMenuItems[item.id] || 0}</span>
                      <Button size="sm" className="h-7 w-7 p-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => setSelectedMenuItems(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                        data-testid={`button-increase-${item.id}`}>+</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary + footer */}
          {Object.values(selectedMenuItems).some(q => q > 0) && (
            <div className="border-t pt-3 mt-2">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">
                  {t('restaurant.itemCount', { count: Object.values(selectedMenuItems).reduce((s, q) => s + q, 0) })}
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {restaurantMenu
                    ? (Object.entries(selectedMenuItems).reduce((sum, [id, qty]) => {
                        const item = restaurantMenu.items.find(i => i.id === id);
                        return sum + (item ? item.priceCents * qty : 0);
                      }, 0) / 100).toFixed(2) + " ₼"
                    : ""}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOrderFoodOpen(false); setSelectedMenuItems({}); setTableNumber(""); }}>{t('restaurant.cancel')}</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending || Object.values(selectedMenuItems).every(q => q === 0)}
              data-testid="button-place-order"
            >
              {placeOrderMutation.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('restaurant.sending')}</>
                : (() => {
                    const cnt = Object.values(selectedMenuItems).reduce((s, q) => s + q, 0);
                    return cnt > 0 ? `${t('restaurant.placeOrder')} (${cnt})` : t('restaurant.placeOrder');
                  })()
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div ref={servicesRef}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">{t('dashboard.guest.smartAssistant')}</h3>
          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-request">
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('dashboard.guest.requestService')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('dashboard.guest.requestService')}</DialogTitle>
                <DialogDescription>
                  {t('dashboard.guest.requestServiceDesc', 'Select a service and describe what you need. Our team will respond promptly.')}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('requests.serviceType', 'Service Type')}</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger data-testid="select-service-type">
                      <SelectValue placeholder={t('services.selectService', 'Select a service')} />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          <div className="flex items-center gap-2">
                            <service.icon className="h-4 w-4" />
                            <span>{service.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('requests.description', 'Description')}</label>
                  <Textarea
                    placeholder={t('services.describeRequest', 'Describe your request...')}
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    rows={4}
                    data-testid="textarea-request-description"
                  />
                </div>
              </DialogBody>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={createRequestMutation.isPending}
                  data-testid="button-submit-request"
                >
                  {createRequestMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {t('chat.send')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {serviceTypes.map((service) => (
            <Card
              key={service.value}
              className="hover-elevate cursor-pointer overflow-visible"
              onClick={() => {
                setSelectedService(service.value);
                setRequestDialogOpen(true);
              }}
              data-testid={`card-service-${service.value}`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-muted">
                  <service.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{service.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">{t('dashboard.guest.requests')}</h3>
        </div>
        
        {requestsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card key={request.id} data-testid={`request-item-${request.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {serviceTypes.find(s => s.value === request.requestType)?.label || request.requestType.replace("_", " ")}
                        </span>
                        <RequestStatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(request.createdAt!).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{t('requests.noRequests', 'No requests yet')}</p>
              <p className="text-sm">{t('dashboard.guest.useAssistant', 'Use the AI assistant to request services')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h3 className="text-lg font-semibold">{t('roomPrep.title')}</h3>
          <Dialog open={prepDialogOpen} onOpenChange={setPrepDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-prep-order">
                <PartyPopper className="mr-2 h-4 w-4" />
                {t('roomPrep.newOrder')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('roomPrep.newOrder')}</DialogTitle>
                <DialogDescription>{t('roomPrep.subtitle')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label>{t('roomPrep.occasionType')} *</Label>
                  <Select value={prepOccasion} onValueChange={setPrepOccasion}>
                    <SelectTrigger data-testid="select-occasion">
                      <SelectValue placeholder={t('roomPrep.selectOccasion')} />
                    </SelectTrigger>
                    <SelectContent>
                      {["birthday", "honeymoon", "anniversary", "romantic_surprise", "kids_decoration", "custom"].map(o => (
                        <SelectItem key={o} value={o}>{t(`roomPrep.occasion.${o}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('roomPrep.decorationStyle')}</Label>
                  <Select value={prepDecoration} onValueChange={setPrepDecoration}>
                    <SelectTrigger data-testid="select-decoration">
                      <SelectValue placeholder={t('roomPrep.selectDecoration')} />
                    </SelectTrigger>
                    <SelectContent>
                      {["romantic", "luxury", "kids_theme", "minimal", "custom_theme"].map(d => (
                        <SelectItem key={d} value={d}>{t(`roomPrep.decoration.${d}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('roomPrep.preferredDatetime')}</Label>
                  <Input
                    type="datetime-local"
                    value={prepDatetime}
                    onChange={e => setPrepDatetime(e.target.value)}
                    data-testid="input-prep-datetime"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('roomPrep.budgetRange')}</Label>
                  <Select value={prepBudget} onValueChange={setPrepBudget}>
                    <SelectTrigger data-testid="select-budget">
                      <SelectValue placeholder={t('roomPrep.selectBudget')} />
                    </SelectTrigger>
                    <SelectContent>
                      {["basic", "medium", "premium", "custom"].map(b => (
                        <SelectItem key={b} value={b}>{t(`roomPrep.budget.${b}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {prepBudget === "custom" && (
                    <Input
                      type="number"
                      placeholder={t('roomPrep.customBudget')}
                      value={prepCustomBudget}
                      onChange={e => setPrepCustomBudget(e.target.value)}
                      data-testid="input-custom-budget"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('roomPrep.addOns')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["cake", "flowers", "balloons", "champagne", "gift_box", "music_setup", "custom_lighting", "other"].map(addon => (
                      <label key={addon} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={prepAddOns.includes(addon)}
                          onCheckedChange={() => toggleAddOn(addon)}
                          data-testid={`checkbox-addon-${addon}`}
                        />
                        {t(`roomPrep.addon.${addon}`)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('roomPrep.notes')}</Label>
                  <Textarea
                    placeholder={t('roomPrep.notesPlaceholder')}
                    value={prepNotes}
                    onChange={e => setPrepNotes(e.target.value)}
                    data-testid="textarea-prep-notes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('roomPrep.referenceImage')}</Label>
                  <Input
                    placeholder={t('roomPrep.referenceImagePlaceholder')}
                    value={prepRefImage}
                    onChange={e => setPrepRefImage(e.target.value)}
                    data-testid="input-prep-ref-image"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrepDialogOpen(false)} data-testid="button-cancel-prep">
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreatePrepOrder}
                  disabled={!prepOccasion || createPrepOrderMutation.isPending}
                  data-testid="button-submit-prep"
                >
                  {createPrepOrderMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('roomPrep.createOrder')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {prepOrdersLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : prepOrders && prepOrders.length > 0 ? (
          <div className="space-y-3">
            {prepOrders.map(order => (
              <Card key={order.id} data-testid={`prep-order-${order.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PartyPopper className="h-4 w-4 text-pink-500" />
                        <span className="font-medium">{t(`roomPrep.occasion.${order.occasionType}`, order.occasionType)}</span>
                        <PrepStatusBadge status={order.status} />
                      </div>
                      {order.decorationStyle && (
                        <p className="text-sm text-muted-foreground">
                          {t('roomPrep.decorationStyle')}: {t(`roomPrep.decoration.${order.decorationStyle}`, order.decorationStyle)}
                        </p>
                      )}
                      {order.preferredDatetime && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.preferredDatetime).toLocaleString()}
                        </p>
                      )}
                      {order.addOns && order.addOns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.addOns.map(addon => addon && (
                            <Badge key={addon} variant="outline" className="text-xs">{t(`roomPrep.addon.${addon}`, addon)}</Badge>
                          ))}
                        </div>
                      )}
                      {order.price && (
                        <p className="text-sm font-medium text-primary mt-1">
                          {t('roomPrep.price')}: ${(order.price / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.createdAt && new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {order.notes && (
                    <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{order.notes}</p>
                  )}
                  {order.rejectionReason && order.status === "rejected" && (
                    <p className="text-sm text-destructive mt-2 border-t pt-2">{order.rejectionReason}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <PartyPopper className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('roomPrep.noOrders')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('roomPrep.noOrdersDesc')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div ref={messagesRef}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">{t('dashboard.guest.chat')}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] })}
            data-testid="button-refresh-chat"
          >
            {t('common.refresh')}
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-64 mb-4 border rounded-md p-3">
              {chatLoading ? (
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
                      className={`flex ${msg.senderRole === "guest" ? "justify-end" : "justify-start"}`}
                      data-testid={`chat-message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.senderRole === "guest"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderRole === "guest" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {new Date(msg.createdAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <p>{t('chat.noMessagesYet', 'No messages yet. Start a conversation with reception!')}</p>
                </div>
              )}
            </ScrollArea>
            
            <div className="flex gap-2">
              <Input
                ref={chatInputRef}
                placeholder={t('chat.typeMessage', 'Type your message...')}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={sendChatMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendChat}
                disabled={!chatMessage.trim() || sendChatMutation.isPending}
                data-testid="button-send-chat"
              >
                {sendChatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={preCheckDialogOpen} onOpenChange={setPreCheckDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('dashboard.guest.prepareMyStayForm', 'Prepare My Stay')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.guest.prepareMyStayFormDesc', 'Share your arrival details so reception can prepare everything for your stay.')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('dashboard.guest.arrivalTime', 'Expected Arrival Time')} *</Label>
                <Input
                  type="time"
                  value={preCheckForm.arrivalTime}
                  onChange={(e) => setPreCheckForm({ ...preCheckForm, arrivalTime: e.target.value })}
                  data-testid="input-arrival-time"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('dashboard.guest.notesRequests', 'Notes / Special Requests')}</Label>
                <Textarea
                  value={preCheckForm.preCheckNotes}
                  onChange={(e) => setPreCheckForm({ ...preCheckForm, preCheckNotes: e.target.value })}
                  placeholder={t('dashboard.guest.notesRequestsPlaceholder', 'Any special requests or notes for your stay...')}
                  data-testid="input-arrival-notes"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreCheckDialogOpen(false)} data-testid="button-arrival-cancel">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!preCheckForm.arrivalTime) {
                  toast({ title: t('common.error', 'Error'), description: t('dashboard.guest.arrivalTimeRequired', 'Please enter your expected arrival time.'), variant: "destructive" });
                  return;
                }
                preCheckInMutation.mutate(preCheckForm);
              }}
              disabled={preCheckInMutation.isPending}
              data-testid="button-arrival-submit"
            >
              {preCheckInMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard.guest.submitArrivalInfo', 'Submit Arrival Info')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={onlineCheckinOpen} onOpenChange={setOnlineCheckinOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dashboard.guest.onlineCheckin', 'Online Check-in')}</DialogTitle>
            <DialogDescription>
              {t('checkin.description', 'Enter your personal details and sign.')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('checkin.passportNumber', 'Passport / ID Number')} *</Label>
                <Input
                  value={checkinForm.passportNumber}
                  onChange={(e) => setCheckinForm({ ...checkinForm, passportNumber: e.target.value })}
                  placeholder="AA1234567"
                  data-testid="input-passport-number"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.nationality', 'Nationality')} *</Label>
                <Input
                  value={checkinForm.nationality}
                  onChange={(e) => setCheckinForm({ ...checkinForm, nationality: e.target.value })}
                  data-testid="input-nationality"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.dateOfBirth', 'Date of Birth')} *</Label>
                <Input
                  type="date"
                  value={checkinForm.dateOfBirth}
                  onChange={(e) => setCheckinForm({ ...checkinForm, dateOfBirth: e.target.value })}
                  data-testid="input-date-of-birth"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.address', 'Address')}</Label>
                <Input
                  value={checkinForm.guestAddress}
                  onChange={(e) => setCheckinForm({ ...checkinForm, guestAddress: e.target.value })}
                  data-testid="input-guest-address"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.numberOfGuests', 'Number of Guests')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={checkinForm.numberOfGuests}
                  onChange={(e) => setCheckinForm({ ...checkinForm, numberOfGuests: e.target.value })}
                  placeholder="1"
                  data-testid="input-number-of-guests"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.specialRequests', 'Special Requests')}</Label>
                <Textarea
                  value={checkinForm.specialRequests}
                  onChange={(e) => setCheckinForm({ ...checkinForm, specialRequests: e.target.value })}
                  placeholder={t('checkin.specialRequestsPlaceholder', 'Extra pillow, early check-in, etc.')}
                  data-testid="input-special-requests"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.idDocument', 'ID Document Photo (optional)')}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleIdDocumentUpload}
                  data-testid="input-id-document"
                />
                {idDocumentBase64 && (
                  <div className="relative mt-2">
                    <img src={idDocumentBase64} alt="ID" className="max-h-32 rounded border" data-testid="img-id-preview" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0"
                      onClick={() => setIdDocumentBase64(null)}
                      data-testid="button-remove-id"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{t('checkin.maxFileSize', 'Max 2MB, image format')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('checkin.signature', 'Signature')} *</Label>
                <div className="border rounded-md p-1 bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    data-testid="canvas-signature"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearSignatureCanvas} data-testid="button-clear-signature">
                  {t('checkin.clearSignature', 'Clear')}
                </Button>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOnlineCheckinOpen(false)} data-testid="button-checkin-cancel">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSubmitOnlineCheckin}
              disabled={onlineCheckinMutation.isPending}
              data-testid="button-checkin-submit"
            >
              {onlineCheckinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('checkin.submit', 'Submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
