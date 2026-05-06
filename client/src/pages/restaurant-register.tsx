import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UtensilsCrossed, User, Mail, Lock, MapPin, Phone, ChevronRight, ChevronLeft, Check, Star, Zap, Crown } from "lucide-react";

const RESTAURANT_PLANS = [
  {
    code: "REST_CAFE",
    nameKey: "restaurantRegister.planCafe",
    name: "Cafe",
    priceAZN: 49.30,
    priceUSD: 29,
    descKey: "restaurantRegister.planCafeDesc",
    desc: "Small cafes & quick-service",
    featuresKey: "restaurantRegister.planCafeFeatures",
    features: ["Up to 10 staff", "Menu management", "Orders & KDS", "Cashier"],
    icon: Star,
    popular: false,
  },
  {
    code: "REST_BISTRO",
    nameKey: "restaurantRegister.planBistro",
    name: "Bistro",
    priceAZN: 100.30,
    priceUSD: 59,
    descKey: "restaurantRegister.planBistroDesc",
    desc: "Growing restaurants",
    featuresKey: "restaurantRegister.planBistroFeatures",
    features: ["Up to 30 staff", "Analytics dashboard", "WhatsApp integration", "All Cafe features"],
    icon: Zap,
    popular: true,
  },
  {
    code: "REST_CHAIN",
    nameKey: "restaurantRegister.planChain",
    name: "Chain",
    priceAZN: 253.30,
    priceUSD: 149,
    descKey: "restaurantRegister.planChainDesc",
    desc: "Restaurant chains & franchises",
    featuresKey: "restaurantRegister.planChainFeatures",
    features: ["Unlimited staff", "Multi-location", "Custom integrations", "Priority support"],
    icon: Crown,
    popular: false,
  },
];

export default function RestaurantRegister() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const planParam = new URLSearchParams(search).get("plan");

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(planParam || "REST_CAFE");

  useEffect(() => {
    if (planParam && ["REST_CAFE", "REST_BISTRO", "REST_CHAIN"].includes(planParam)) {
      setSelectedPlan(planParam);
    }
  }, [planParam]);

  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    city: "",
    phone: "",
    country: "",
    address: "",
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/register-restaurant", {
        username: accountForm.username,
        password: accountForm.password,
        fullName: accountForm.fullName,
        email: accountForm.email,
        planCode: selectedPlan,
        restaurantData: {
          name: restaurantForm.name,
          city: restaurantForm.city || undefined,
          phone: restaurantForm.phone || undefined,
          country: restaurantForm.country || undefined,
          address: restaurantForm.address || undefined,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refreshUser?.();
      toast({
        title: t("restaurantRegister.successTitle", "Welcome aboard!"),
        description: t("restaurantRegister.successDesc", "Your restaurant account has been created. 14-day free trial started."),
      });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      showErrorToast(err, toast);
    },
  });

  function step1Valid() {
    return accountForm.fullName.length >= 2 &&
      accountForm.email.includes("@") &&
      accountForm.username.length >= 3 &&
      accountForm.password.length >= 6;
  }

  function step2Valid() {
    return restaurantForm.name.length >= 2;
  }

  function handleNext() {
    if (step === 1 && step1Valid()) setStep(2);
    else if (step === 2 && step2Valid()) setStep(3);
    else if (step === 3) registerMutation.mutate();
  }

  const stepLabels = [
    t("restaurantRegister.step1", "Account"),
    t("restaurantRegister.step2", "Restaurant"),
    t("restaurantRegister.step3", "Plan"),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
          </div>
          O.S.S POS
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold">{t("restaurantRegister.title", "Register Your Restaurant")}</h1>
            <p className="text-muted-foreground">{t("restaurantRegister.subtitle", "Set up your POS system in minutes. 14-day free trial.")}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div key={n} className="flex items-center gap-1.5">
                  <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border-2 transition-colors
                    ${done ? "bg-green-500 border-green-500 text-white" :
                      active ? "border-primary bg-primary text-primary-foreground" :
                        "border-muted-foreground/30 text-muted-foreground"}`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : n}
                  </div>
                  <span className={`text-sm ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                  {i < stepLabels.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-1" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Account */}
          {step === 1 && (
            <Card data-testid="card-account-step">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> {t("restaurantRegister.accountTitle", "Account Details")}</CardTitle>
                <CardDescription>{t("restaurantRegister.accountDesc", "Create your login credentials")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="fullName">{t("restaurantRegister.fullName", "Full Name")}</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      value={accountForm.fullName}
                      onChange={e => setAccountForm(p => ({ ...p, fullName: e.target.value }))}
                      data-testid="input-fullname"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="email">{t("restaurantRegister.email", "Email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@restaurant.com"
                        className="pl-9"
                        value={accountForm.email}
                        onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))}
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username">{t("restaurantRegister.username", "Username")}</Label>
                    <Input
                      id="username"
                      placeholder="myrestaurant"
                      value={accountForm.username}
                      onChange={e => setAccountForm(p => ({ ...p, username: e.target.value }))}
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{t("restaurantRegister.password", "Password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        className="pl-9"
                        value={accountForm.password}
                        onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))}
                        data-testid="input-password"
                      />
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={handleNext} disabled={!step1Valid()} data-testid="button-next-step1">
                  {t("restaurantRegister.next", "Continue")} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t("restaurantRegister.hasAccount", "Already have an account?")} <Link href="/login" className="text-primary hover:underline">{t("restaurantRegister.signIn", "Sign in")}</Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Restaurant Info */}
          {step === 2 && (
            <Card data-testid="card-restaurant-step">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5 text-primary" /> {t("restaurantRegister.restaurantTitle", "Restaurant Details")}</CardTitle>
                <CardDescription>{t("restaurantRegister.restaurantDesc", "Tell us about your restaurant")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="restName">{t("restaurantRegister.restaurantName", "Restaurant Name")} *</Label>
                  <Input
                    id="restName"
                    placeholder={t("restaurantRegister.restaurantNamePlaceholder", "The Golden Fork")}
                    value={restaurantForm.name}
                    onChange={e => setRestaurantForm(p => ({ ...p, name: e.target.value }))}
                    data-testid="input-restaurant-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="restCity">{t("restaurantRegister.city", "City")}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="restCity"
                        placeholder="Baku"
                        className="pl-9"
                        value={restaurantForm.city}
                        onChange={e => setRestaurantForm(p => ({ ...p, city: e.target.value }))}
                        data-testid="input-city"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="restPhone">{t("restaurantRegister.phone", "Phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="restPhone"
                        placeholder="+994 50 000 00 00"
                        className="pl-9"
                        value={restaurantForm.phone}
                        onChange={e => setRestaurantForm(p => ({ ...p, phone: e.target.value }))}
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="restAddress">{t("restaurantRegister.address", "Address")}</Label>
                  <Input
                    id="restAddress"
                    placeholder={t("restaurantRegister.addressPlaceholder", "Street, building")}
                    value={restaurantForm.address}
                    onChange={e => setRestaurantForm(p => ({ ...p, address: e.target.value }))}
                    data-testid="input-address"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step2"><ChevronLeft className="h-4 w-4 mr-1" /> {t("restaurantRegister.back", "Back")}</Button>
                  <Button className="flex-1" onClick={handleNext} disabled={!step2Valid()} data-testid="button-next-step2">
                    {t("restaurantRegister.next", "Continue")} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <Card data-testid="card-plan-step">
              <CardHeader>
                <CardTitle>{t("restaurantRegister.planTitle", "Choose Your Plan")}</CardTitle>
                <CardDescription>{t("restaurantRegister.planDesc", "All plans include a 14-day free trial. Cancel anytime.")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {RESTAURANT_PLANS.map(plan => {
                  const Icon = plan.icon;
                  const isSelected = selectedPlan === plan.code;
                  return (
                    <div
                      key={plan.code}
                      onClick={() => setSelectedPlan(plan.code)}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      data-testid={`card-plan-${plan.code.toLowerCase()}`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-xs">{t("restaurantRegister.popular", "Most Popular")}</Badge>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{t(plan.nameKey, plan.name)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{t(plan.descKey, plan.desc)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-lg">{plan.priceAZN} ₼</p>
                          <p className="text-xs text-muted-foreground">{t("restaurantRegister.perMonth", "/ month")}</p>
                        </div>
                      </div>
                      <ul className="mt-3 grid grid-cols-2 gap-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} data-testid="button-back-step3"><ChevronLeft className="h-4 w-4 mr-1" /> {t("restaurantRegister.back", "Back")}</Button>
                  <Button
                    className="flex-1"
                    onClick={handleNext}
                    disabled={registerMutation.isPending}
                    data-testid="button-submit-register"
                  >
                    {registerMutation.isPending ? t("restaurantRegister.submitting", "Creating account...") : t("restaurantRegister.submit", "Start Free Trial")}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">{t("restaurantRegister.trialNote", "No credit card required for trial")}</p>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Link href="/register-hotel" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              {t("restaurantRegister.registerHotelLink", "Registering a hotel instead?")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
