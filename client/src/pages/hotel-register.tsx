import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import { useAuth } from "@/lib/auth-context";
import { Building2, User, Mail, MapPin, Lock, ArrowLeft, Home, Star, Sparkles, Globe } from "lucide-react";
import { Link } from "wouter";
import { InternationalPhoneInput } from "@/components/phone-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

const countries = [
  "United States", "United Kingdom", "Germany", "France", "Italy", "Spain", 
  "Turkey", "Greece", "Thailand", "Japan", "Australia", "Canada", "Mexico",
  "Brazil", "United Arab Emirates", "Singapore", "Switzerland", "Austria",
  "Portugal", "Netherlands", "Azerbaijan", "Other"
];

export default function HotelRegister() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register: authRegister } = useAuth();

  const selectedPlanCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('plan') || 'CORE_STARTER';
  }, []);

  const [form, setForm] = useState({
    hotelName: "",
    hotelCountry: "",
    hotelCity: "",
    hotelAddress: "",
    hotelPhone: "",
    hotelEmail: "",
    totalRooms: "",
    starRating: "",
    adminFullName: "",
    adminUsername: "",
    adminPassword: "",
    adminEmail: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        username: data.adminUsername,
        password: data.adminPassword,
        fullName: data.adminFullName,
        email: data.adminEmail,
        role: "admin",
        planCode: selectedPlanCode,
        hotelData: {
          name: data.hotelName,
          country: data.hotelCountry,
          city: data.hotelCity,
          address: data.hotelAddress,
          phone: data.hotelPhone,
          email: data.hotelEmail,
          totalRooms: parseInt(data.totalRooms) || 1,
          starRating: data.starRating || undefined,
        }
      };
      await authRegister(payload);
      return payload;
    },
    onSuccess: (data) => {
      toast({ title: t('toast.hotelRegistered'), description: `${t('toast.hotelRegisteredDesc')}, ${data.hotelData.name}!` });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = [];
    if (!form.hotelName) missingFields.push(t('hotel.name'));
    if (!form.hotelCountry) missingFields.push(t('hotel.country'));
    if (!form.hotelCity) missingFields.push(t('hotel.city'));
    if (!form.hotelAddress) missingFields.push(t('hotel.address'));
    if (!form.hotelPhone) missingFields.push(t('hotel.phone'));
    if (!form.hotelEmail) missingFields.push(t('hotel.hotelEmail'));
    if (!form.totalRooms || parseInt(form.totalRooms) < 1) missingFields.push(t('hotel.totalRooms'));
    if (!form.adminFullName) missingFields.push(t('hotel.adminName'));
    if (!form.adminEmail) missingFields.push(t('hotel.adminEmail'));
    if (!form.adminUsername) missingFields.push(t('auth.username'));
    if (!form.adminPassword) missingFields.push(t('auth.password'));
    
    if (missingFields.length > 0) {
      toast({ 
        title: t('validation.missingFields'), 
        description: t('validation.pleaseFillIn', { fields: missingFields.join(", ") }), 
        variant: "destructive" 
      });
      return;
    }
    
    registerMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <header className="flex items-center justify-between gap-4 p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">O.S.S</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('hotel.registerTitle')}</CardTitle>
          <CardDescription>
            {t('hotel.registerSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('hotel.hotelInfo')}
              </h3>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotelName">{t('hotel.name')} *</Label>
                  <Input
                    id="hotelName"
                    placeholder={t('hotel.placeholders.hotelName')}
                    value={form.hotelName}
                    onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                    data-testid="input-hotel-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelEmail">{t('hotel.hotelEmail')} *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hotelEmail"
                      type="email"
                      className="pl-10"
                      placeholder="info@hotel.com"
                      value={form.hotelEmail}
                      onChange={(e) => setForm({ ...form, hotelEmail: e.target.value })}
                      data-testid="input-hotel-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelCountry">{t('hotel.country')} *</Label>
                  <Select 
                    value={form.hotelCountry} 
                    onValueChange={(value) => setForm({ ...form, hotelCountry: value })}
                  >
                    <SelectTrigger data-testid="select-country">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t('hotel.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelCity">{t('hotel.city')} *</Label>
                  <Input
                    id="hotelCity"
                    placeholder={t('hotel.placeholders.cityName')}
                    value={form.hotelCity}
                    onChange={(e) => setForm({ ...form, hotelCity: e.target.value })}
                    data-testid="input-hotel-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelPhone">{t('hotel.phone')} *</Label>
                  <InternationalPhoneInput
                    value={form.hotelPhone}
                    onChange={(phone) => setForm({ ...form, hotelPhone: phone })}
                    placeholder={t('hotel.placeholders.enterPhone')}
                    inputProps={{ id: "hotelPhone", "data-testid": "input-hotel-phone" }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotelAddress">{t('hotel.address')} *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hotelAddress"
                      className="pl-10"
                      placeholder={t('hotel.placeholders.hotelAddress')}
                      value={form.hotelAddress}
                      onChange={(e) => setForm({ ...form, hotelAddress: e.target.value })}
                      data-testid="input-hotel-address"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="totalRooms">{t('hotel.totalRooms')} *</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totalRooms"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="pl-10"
                      placeholder={t('hotel.placeholders.totalRooms')}
                      value={form.totalRooms}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setForm({ ...form, totalRooms: val });
                      }}
                      data-testid="input-total-rooms"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg" data-testid="heading-tailor-experience">{t('hotel.tailorExperience')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-optional-fields-description">
                {t('hotel.tailorDescription')}
              </p>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starRating">{t('hotel.starRating')}</Label>
                  <Select 
                    value={form.starRating} 
                    onValueChange={(value) => setForm({ ...form, starRating: value })}
                  >
                    <SelectTrigger data-testid="select-star-rating">
                      <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t('hotel.selectRating')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-star">{t('hotel.stars.1', '1 Star')}</SelectItem>
                      <SelectItem value="2-star">{t('hotel.stars.2', '2 Stars')}</SelectItem>
                      <SelectItem value="3-star">{t('hotel.stars.3', '3 Stars')}</SelectItem>
                      <SelectItem value="4-star">{t('hotel.stars.4', '4 Stars')}</SelectItem>
                      <SelectItem value="5-star">{t('hotel.stars.5', '5 Stars')}</SelectItem>
                      <SelectItem value="boutique">{t('hotel.stars.boutique', 'Boutique Hotel')}</SelectItem>
                      <SelectItem value="resort">{t('hotel.stars.resort', 'Resort')}</SelectItem>
                      <SelectItem value="apartment">{t('hotel.stars.apartment', 'Apartment / House')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('hotel.adminAccount')}
              </h3>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminFullName">{t('hotel.adminName')} *</Label>
                  <Input
                    id="adminFullName"
                    placeholder={t('hotel.placeholders.adminName')}
                    value={form.adminFullName}
                    onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                    data-testid="input-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">{t('hotel.adminEmail')} *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      className="pl-10"
                      placeholder={t('hotel.placeholders.adminEmail')}
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      data-testid="input-admin-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">{t('auth.username')} *</Label>
                  <Input
                    id="adminUsername"
                    placeholder={t('hotel.placeholders.username')}
                    value={form.adminUsername}
                    onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                    data-testid="input-admin-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">{t('auth.password')} *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminPassword"
                      type="password"
                      className="pl-10"
                      placeholder={t('hotel.placeholders.password')}
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      data-testid="input-admin-password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={registerMutation.isPending}
                data-testid="button-register-hotel"
              >
                {registerMutation.isPending ? t('hotel.registering') : t('hotel.registerHotel')}
              </Button>
              
              <Link href="/">
                <Button variant="ghost" className="w-full" type="button" data-testid="button-back-home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common.back')}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
