import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isPlanLimitError } from "@/lib/error-handler";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Users,
  Mail,
  Phone,
  ChevronLeft,
  Search,
  BedDouble,
  Clock,
  LogIn,
  LogOut,
  FileText,
  Key,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CreditCard,
  DollarSign,
  Radio,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User, Booking, ServiceRequest } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";

type GuestUser = Omit<User, "password">;

interface GuestDetails {
  guest: GuestUser;
  credentials: { username: string; password: string };
  booking: Booking | null;
  serviceRequests: ServiceRequest[];
  credentialLogs: Array<{ id: string; action: string; performedByName: string; notes: string | null; createdAt: Date | null }>;
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  testId,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full p-3 text-sm font-medium text-left hover-elevate rounded-md"
        data-testid={testId}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-3 pb-3 space-y-4">{children}</div>}
    </div>
  );
}

function AddGuestDialog({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("guest123");
  const [createdGuest, setCreatedGuest] = useState<{ username: string; password: string } | null>(null);
  const [guestUpgradeOpen, setGuestUpgradeOpen] = useState(false);

  const [bookingNumber, setBookingNumber] = useState("");
  const [bookingSource, setBookingSource] = useState("walk_in");
  const [reservationStatus, setReservationStatus] = useState("confirmed");

  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [nightlyRate, setNightlyRate] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [discount, setDiscount] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  useEffect(() => {
    const rate = parseFloat(nightlyRate);
    if (!rate || rate <= 0) return;
    const nights = calculateNights(checkInDate, checkOutDate);
    if (nights > 0) {
      setTotalPrice((rate * nights).toFixed(2));
    }
  }, [nightlyRate, checkInDate, checkOutDate]);

  const nightsCount = calculateNights(checkInDate, checkOutDate);

  const remainingBalance = (() => {
    const total = parseFloat(totalPrice) || 0;
    const disc = parseFloat(discount) || 0;
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, total - disc - paid);
  })();

  const BOOKING_SOURCES = [
    { value: "walk_in", label: t('guests.bookingSources.walk_in') },
    { value: "booking_com", label: t('guests.bookingSources.booking_com') },
    { value: "airbnb", label: t('guests.bookingSources.airbnb') },
    { value: "expedia", label: t('guests.bookingSources.expedia') },
    { value: "direct_website", label: t('guests.bookingSources.direct_website') },
    { value: "travel_agency", label: t('guests.bookingSources.travel_agency') },
    { value: "corporate", label: t('guests.bookingSources.corporate') },
    { value: "other", label: t('guests.bookingSources.other') },
  ];

  const RESERVATION_STATUSES = [
    { value: "pending", label: t('guests.bookingStatus.pending') },
    { value: "confirmed", label: t('guests.bookingStatus.confirmed') },
    { value: "checked_in", label: t('guests.bookingStatus.checked_in') },
    { value: "checked_out", label: t('guests.bookingStatus.checked_out') },
    { value: "cancelled", label: t('guests.bookingStatus.cancelled') },
    { value: "no_show", label: t('guests.bookingStatus.no_show') },
  ];

  const PAYMENT_STATUSES = [
    { value: "paid", label: t('guests.paymentStatuses.paid') },
    { value: "pending", label: t('guests.paymentStatuses.pending') },
    { value: "partial", label: t('guests.paymentStatuses.partial') },
  ];

  const PAYMENT_METHODS = [
    { value: "cash", label: t('guests.paymentMethods.cash') },
    { value: "card", label: t('guests.paymentMethods.card') },
    { value: "bank_transfer", label: t('guests.paymentMethods.bank_transfer') },
    { value: "online_payment", label: t('guests.paymentMethods.online_payment') },
    { value: "ota_prepaid", label: t('guests.paymentMethods.ota_prepaid') },
  ];

  const CURRENCIES = ["USD", "EUR", "GBP", "TRY", "AZN", "AED", "SAR"];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/staff/create-guest", {
        fullName,
        email,
        phoneNumber,
        roomNumber,
        checkInDate,
        checkOutDate,
        password,
        specialNotes: notes || undefined,
        bookingNumber: bookingNumber || undefined,
        bookingSource,
        reservationStatus,
        numberOfGuests,
        nightlyRate: nightlyRate || undefined,
        totalPrice: totalPrice || undefined,
        currency,
        discount: discount || undefined,
        paymentStatus,
        paymentMethod,
        amountPaid: amountPaid || undefined,
        transactionReference: transactionReference || undefined,
        paymentNotes: paymentNotes || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setCreatedGuest({ username: data.user?.username || data.username, password });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onSuccess();
    },
    onError: (error: any) => {
      if (isPlanLimitError(error)) {
        setGuestUpgradeOpen(true);
        return;
      }
      toast({ title: t('guests.failedToAddGuest'), description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setRoomNumber("");
    setCheckInDate("");
    setCheckOutDate("");
    setNotes("");
    setPassword("guest123");
    setCreatedGuest(null);
    setBookingNumber("");
    setBookingSource("walk_in");
    setReservationStatus("confirmed");
    setNumberOfGuests("1");
    setNightlyRate("");
    setTotalPrice("");
    setCurrency("USD");
    setDiscount("");
    setPaymentStatus("pending");
    setPaymentMethod("cash");
    setAmountPaid("");
    setTransactionReference("");
    setPaymentNotes("");
  };

  return (<>
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-guest">
          <UserPlus className="h-4 w-4 mr-1.5" />
          {t('guests.addGuest')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        {createdGuest ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('guests.guestAdded')}</DialogTitle>
              <DialogDescription>{t('guests.shareCredentials')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 px-4 sm:px-6">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">{t('common.username')}</span>
                    <span className="text-sm font-medium font-mono truncate min-w-0" data-testid="text-guest-username">{createdGuest.username}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">{t('common.password')}</span>
                    <span className="text-sm font-medium font-mono truncate min-w-0" data-testid="text-guest-password">{createdGuest.password}</span>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">
                {t('guests.credentialSignInInfo')}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} data-testid="button-done-guest">{t('common.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('guests.addNewGuest')}</DialogTitle>
              <DialogDescription>{t('guests.addNewGuestDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-3 px-4 sm:px-6 max-h-[65vh] overflow-y-auto">
              <div className="space-y-1.5">
                <Label htmlFor="guest-name">{t('guests.fullName')} *</Label>
                <Input
                  id="guest-name"
                  placeholder={t('placeholders.guestName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  data-testid="input-guest-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-phone">{t('guests.phone')} *</Label>
                  <Input
                    id="guest-phone"
                    placeholder={t('placeholders.phoneNumber')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    data-testid="input-guest-phone"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guest-email">{t('guests.email')} *</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder={t('placeholders.guestEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-guest-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-room">{t('guests.roomSpace')} *</Label>
                  <Input
                    id="guest-room"
                    placeholder={t('placeholders.roomNumber')}
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    data-testid="input-guest-room"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guest-password">{t('guests.guestPassword')}</Label>
                  <Input
                    id="guest-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-guest-password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="guest-checkin">{t('guests.checkInDate')} *</Label>
                  <Input
                    id="guest-checkin"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    data-testid="input-guest-checkin"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guest-checkout">{t('guests.checkOutDate')} *</Label>
                  <Input
                    id="guest-checkout"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    data-testid="input-guest-checkout"
                  />
                </div>
              </div>

              <CollapsibleSection title={t('guests.bookingInformation')} icon={CalendarDays} defaultOpen testId="section-booking-info">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-number">{t('guests.bookingNumber')}</Label>
                    <Input
                      id="booking-number"
                      placeholder={t('placeholders.bookingNumber')}
                      value={bookingNumber}
                      onChange={(e) => setBookingNumber(e.target.value)}
                      data-testid="input-booking-number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('guests.bookingSource')}</Label>
                    <Select value={bookingSource} onValueChange={setBookingSource}>
                      <SelectTrigger data-testid="select-booking-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKING_SOURCES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('guests.reservationStatus')}</Label>
                  <Select value={reservationStatus} onValueChange={setReservationStatus}>
                    <SelectTrigger data-testid="select-reservation-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESERVATION_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t('guests.stayDetails')} icon={BedDouble} testId="section-stay-details">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="num-guests">{t('guests.numberOfGuests')}</Label>
                    <Input
                      id="num-guests"
                      type="number"
                      min="1"
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(e.target.value)}
                      data-testid="input-num-guests"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('guests.currency')}</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nightly-rate">{t('guests.nightlyRate')}</Label>
                    <Input
                      id="nightly-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t('placeholders.amount')}
                      value={nightlyRate}
                      onChange={(e) => setNightlyRate(e.target.value)}
                      data-testid="input-nightly-rate"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="total-price">
                      {t('guests.totalStayPrice')}
                      {nightsCount > 0 && nightlyRate && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({nightsCount} {nightsCount === 1 ? t('guests.night', 'night') : t('guests.nights', 'nights')})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="total-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t('placeholders.amount')}
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      data-testid="input-total-price"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discount">{t('guests.discount')}</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t('placeholders.amount')}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    data-testid="input-discount"
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t('guests.paymentInformation')} icon={CreditCard} testId="section-payment-info">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('guests.paymentStatus')}</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('guests.paymentMethod')}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount-paid">{t('guests.amountPaid')}</Label>
                    <Input
                      id="amount-paid"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t('placeholders.amount')}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      data-testid="input-amount-paid"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('guests.remainingBalance')}</Label>
                    <div className="flex items-center h-9 px-3 border rounded-md bg-muted/50 text-sm" data-testid="text-remaining-balance">
                      <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {remainingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="txn-ref">{t('guests.transactionReference')}</Label>
                  <Input
                    id="txn-ref"
                    placeholder="REF-001"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    data-testid="input-txn-ref"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-notes">{t('guests.paymentNotes')}</Label>
                  <Textarea
                    id="payment-notes"
                    placeholder={t('placeholders.specialNotes')}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="resize-none"
                    data-testid="input-payment-notes"
                  />
                </div>
              </CollapsibleSection>

              <div className="space-y-2">
                <Label htmlFor="guest-notes">{t('guests.specialNotes')}</Label>
                <Textarea
                  id="guest-notes"
                  placeholder={t('placeholders.specialNotes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  data-testid="input-guest-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-guest">{t('common.cancel')}</Button>
              <Button
                onClick={() => {
                  const missing: string[] = [];
                  if (!fullName) missing.push(t('guests.fullName'));
                  if (!phoneNumber) missing.push(t('guests.phone'));
                  if (!roomNumber) missing.push(t('guests.roomSpace'));
                  if (!checkInDate) missing.push(t('guests.checkInDate'));
                  if (!checkOutDate) missing.push(t('guests.checkOutDate'));
                  if (missing.length > 0) {
                    toast({ title: t('validation.requiredFields', 'Required fields missing'), description: missing.join(", "), variant: "destructive" });
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
                data-testid="button-submit-guest"
              >
                {createMutation.isPending ? t('common.creating') : t('guests.addGuest')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
    <UpgradeModal
      open={guestUpgradeOpen}
      onClose={() => setGuestUpgradeOpen(false)}
      featureName="Guest Management"
    />
    </>
  );
}

function GuestProfile({ guestId, onBack }: { guestId: string; onBack: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<GuestDetails>({
    queryKey: ["/api/users/guests", guestId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/users/guests/${guestId}/details`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guest details");
      return res.json();
    },
  });

  const getStatusLabel = (status: string) => {
    return t(`guests.bookingStatus.${status}`, { defaultValue: status });
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!data?.booking) return;
      await apiRequest("PATCH", `/api/bookings/${data.booking.id}`, { status: "checked_in" });
    },
    onSuccess: () => {
      toast({ title: t('guests.bookingStatus.checked_in') });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests", guestId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
    },
    onError: () => {
      toast({ title: "Failed to check in", variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!data?.booking) return;
      await apiRequest("PATCH", `/api/bookings/${data.booking.id}`, { status: "checked_out" });
    },
    onSuccess: () => {
      toast({ title: t('guests.bookingStatus.checked_out') });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests", guestId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
    },
    onError: () => {
      toast({ title: "Failed to check out", variant: "destructive" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!data?.booking) throw new Error("Booking yoxdur");
      const booking = data.booking;

      let amount = 0;
      if ((booking as any).totalPrice) {
        amount = (booking as any).totalPrice;
      } else if ((booking as any).nightlyRate) {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        const discount = (booking as any).discount || 0;
        amount = ((booking as any).nightlyRate * nights) - discount;
      }

      if (amount <= 0) throw new Error("Ödəniş məbləği müəyyən edilə bilmir");

      if ((booking as any).currency && (booking as any).currency !== "AZN") {
        toast({ title: "Valyuta AZN deyil", variant: "destructive" });
      }

      const response = await apiRequest("POST", "/api/epoint/create-booking-order", {
        bookingId: booking.id,
        amount,
      });
      return response.json();
    },
    onSuccess: (result: { paymentUrl: string; orderId: string }) => {
      window.location.href = result.paymentUrl;
    },
    onError: (error: any) => {
      const message = error?.message || "";
      if (message.includes("BOOKING_ALREADY_PAID")) {
        toast({ title: "Bu rezervasiya artıq ödənilib", variant: "destructive" });
      } else {
        toast({ title: message || "Ödəniş xətası", variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/guests/${guestId}`);
    },
    onSuccess: () => {
      toast({ title: t('dashboard.reception.guestDeleted') });
      queryClient.invalidateQueries({ queryKey: ["/api/users/guests"] });
      onBack();
    },
    onError: () => {
      toast({ title: "Failed to remove guest", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Button variant="outline" size="sm" onClick={onBack} data-testid="button-back-guests">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>
        <p className="mt-4 text-muted-foreground">{t('dashboard.reception.guestNotFound')}</p>
      </div>
    );
  }

  const { guest, credentials, booking, serviceRequests } = data;
  const initials = guest.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Button variant="outline" size="sm" onClick={onBack} data-testid="button-back-guests">
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t('common.back')}
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold" data-testid="text-guest-profile-name">{guest.fullName}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-1">
                  {guest.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {guest.email}
                    </span>
                  )}
                  {guest.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {guest.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {booking && booking.status === "confirmed" && (
                <Button
                  size="sm"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  data-testid="button-checkin"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  {checkInMutation.isPending ? "..." : t('dashboard.guest.checkIn')}
                </Button>
              )}
              {booking && booking.status === "checked_in" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  data-testid="button-checkout"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {checkOutMutation.isPending ? "..." : t('dashboard.guest.checkOut')}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-delete-guest">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('common.remove')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('dashboard.reception.deleteGuestConfirm', { name: guest.fullName })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()} data-testid="button-confirm-delete">
                      {t('common.remove')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t('dashboard.reception.guestCredentials')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground shrink-0">{t('common.username')}</span>
                <span className="font-mono truncate min-w-0" data-testid="text-profile-username">{credentials.username}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground shrink-0">{t('common.password')}</span>
                <span className="font-mono truncate min-w-0 text-muted-foreground" data-testid="text-profile-password">••••••••</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {booking && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                {t('dashboard.reception.bookingDetails')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-muted-foreground">{t('common.room')}</span>
                  <span className="font-medium" data-testid="text-booking-room">{booking.roomNumber}</span>
                </div>
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-muted-foreground">{t('common.status')}</span>
                  <Badge variant={getStatusVariant(booking.status)} data-testid="badge-booking-status">
                    {getStatusLabel(booking.status)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-muted-foreground">{t('dashboard.guest.checkIn')}</span>
                  <span>{new Date(booking.checkInDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-muted-foreground">{t('dashboard.guest.checkOut')}</span>
                  <span>{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                </div>
                {booking.bookingNumber && (
                  <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="text-muted-foreground">{t('guests.bookingNumber')}</span>
                    <span className="font-mono text-xs">{booking.bookingNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-muted-foreground">{t('guests.paymentStatus')}</span>
                  <Badge
                    variant={
                      (booking as any).paymentStatus === "paid" ? "default" :
                      (booking as any).paymentStatus === "failed" ? "destructive" : "secondary"
                    }
                    data-testid="badge-payment-status"
                  >
                    {(booking as any).paymentStatus === "paid" ? t('guests.paymentStatuses.paid') :
                     (booking as any).paymentStatus === "failed" ? t('guests.paymentStatuses.failed') : t('guests.paymentStatuses.unpaid')}
                  </Badge>
                </div>
                {(booking as any).paymentStatus !== "paid" && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => paymentMutation.mutate()}
                    disabled={paymentMutation.isPending}
                    data-testid="button-pay-now"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    {paymentMutation.isPending ? t('common.loading') : t('guests.payNow')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {serviceRequests.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('dashboard.reception.serviceRequests')} ({serviceRequests.length})
            </h3>
            <div className="space-y-2">
              {serviceRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-md border text-sm flex-wrap"
                >
                  <div className="min-w-0">
                    <p className="font-medium capitalize">{req.requestType.replace("_", " ")}</p>
                    <p className="text-muted-foreground text-xs truncate">{req.description}</p>
                  </div>
                  <Badge variant={req.status === "completed" ? "outline" : "secondary"}>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "checked_in") return "default";
  if (status === "confirmed") return "secondary";
  if (status === "checked_out") return "outline";
  if (status === "cancelled" || status === "no_show") return "destructive";
  return "secondary";
}

export default function GuestsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastConfirm, setBroadcastConfirm] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState<{ count: number; guestNames: string[] } | null>(null);

  const { data: guests, isLoading } = useQuery<GuestUser[]>({
    queryKey: ["/api/users/guests"],
  });

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: user?.role !== "guest",
  });

  const broadcastMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat/broadcast", { message });
      return res.json() as Promise<{ count: number; guestNames: string[] }>;
    },
    onSuccess: (data) => {
      setBroadcastDone(data);
      setBroadcastMsg("");
      setBroadcastConfirm(false);
      toast({
        title: t('broadcast.successTitle', 'Mesaj göndərildi'),
        description: t('broadcast.successDesc', '{{count}} qonaq mesajı aldı.', { count: data.count }),
      });
    },
    onError: () => {
      setBroadcastConfirm(false);
      toast({ title: t('common.error', 'Xəta baş verdi'), variant: "destructive" });
    },
  });

  const getStatusLabel = (status: string) => {
    return t(`guests.bookingStatus.${status}`, { defaultValue: status });
  };

  if (selectedGuestId) {
    return (
      <GuestProfile
        guestId={selectedGuestId}
        onBack={() => setSelectedGuestId(null)}
      />
    );
  }

  const guestList = guests || [];
  const bookingMap = new Map<string, Booking>();
  (bookings || []).forEach((b) => {
    const existing = bookingMap.get(b.guestId);
    if (!existing || new Date(b.checkInDate) > new Date(existing.checkInDate)) {
      bookingMap.set(b.guestId, b);
    }
  });

  const filtered = searchQuery
    ? guestList.filter(
        (g) =>
          g.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.phone?.includes(searchQuery)
      )
    : guestList;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-guests-title">{t('dashboard.reception.guests')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{guestList.length} {t('common.guest')}{guestList.length !== 1 ? "s" : ""}</p>
        </div>
        {(user?.role === "reception" || user?.role === "admin" || user?.role === "owner_admin" || user?.role === "property_manager") && (
          <AddGuestDialog onSuccess={() => {}} />
        )}
      </div>

      {/* BROADCAST PANEL — only for staff roles */}
      {(user?.role === "admin" || user?.role === "owner_admin" || user?.role === "property_manager" || user?.role === "reception") && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Radio className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t('broadcast.infoTitle', 'Bütün Qonaqlara Yayım')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('broadcast.infoDesc', 'Bu mesaj oteldəki bütün qonaqlara eyni anda göndəriləcək.')}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {guestList.length} {t('broadcast.guests', 'qonaq')}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder={t('broadcast.placeholder', 'Bütün qonaqlara göndəriləcək mesajınızı yazın...')}
                value={broadcastMsg}
                onChange={e => { setBroadcastMsg(e.target.value); setBroadcastDone(null); }}
                rows={2}
                className="resize-none flex-1"
                data-testid="input-guests-broadcast"
              />
              <Button
                className="self-end gap-1.5 shrink-0"
                disabled={!broadcastMsg.trim() || !guestList.length || broadcastMutation.isPending}
                onClick={() => setBroadcastConfirm(true)}
                data-testid="btn-guests-broadcast"
              >
                {broadcastMutation.isPending
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <Radio className="h-4 w-4" />}
                {t('broadcast.sendBtn', 'Göndər')}
              </Button>
            </div>

            {broadcastDone && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('broadcast.successTitle', 'Mesaj göndərildi')} — {broadcastDone.count} {t('broadcast.guests', 'qonaq')}: {broadcastDone.guestNames.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Broadcast confirm dialog */}
      <AlertDialog open={broadcastConfirm} onOpenChange={setBroadcastConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('broadcast.confirmTitle', 'Yayım göndərilsin?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('broadcast.confirmDesc', 'Bu mesaj {{count}} qonağa göndəriləcək.', { count: guestList.length })}
              <div className="mt-3 p-3 rounded-lg bg-muted text-sm italic text-muted-foreground">
                "{broadcastMsg}"
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Ləğv et')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => broadcastMutation.mutate(broadcastMsg)}
              disabled={broadcastMutation.isPending}
              data-testid="btn-guests-broadcast-confirm"
            >
              {broadcastMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              {t('broadcast.confirmSend', 'Göndər')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {guestList.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dashboard.reception.searchGuests')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-guests"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium">{searchQuery ? t('common.noResults') : t('dashboard.reception.noGuests')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? t('common.noResults') : t('dashboard.reception.addGuestHint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((guest) => {
            const booking = bookingMap.get(guest.id);
            const initials = guest.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

            return (
              <Card
                key={guest.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedGuestId(guest.id)}
                data-testid={`card-guest-${guest.id}`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate" data-testid={`text-guest-name-${guest.id}`}>{guest.fullName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {guest.phone}
                          </span>
                        )}
                        {booking && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3 shrink-0" />
                            {t('common.room')} {booking.roomNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {booking && (
                      <Badge variant={getStatusVariant(booking.status)} data-testid={`badge-guest-status-${guest.id}`}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    )}
                    {booking && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                      </span>
                    )}
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
