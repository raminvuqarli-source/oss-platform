import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GetQuoteDialog } from "@/components/get-quote-dialog";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Building2, Shield, Lightbulb, MessageSquare, CalendarCheck,
  Globe, Mail, Phone, CheckCircle, Minus, Plus,
  BarChart3, Users, Wifi, Smartphone, Clock, HeadphonesIcon,
  Cpu, Calculator, Play, Loader2, Crown, UserCog, ConciergeBell, User,
  SunMedium, Gauge, BrainCircuit, ArrowRight, Zap, Activity, LayoutDashboard,
  BedDouble, MessageCircle, TrendingUp, ChevronRight, Download, Monitor, Share, MoreHorizontal, ExternalLink,
} from "lucide-react";
import { X } from "lucide-react";
import { SiApple, SiAndroid } from "react-icons/si";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PlanCode } from "@shared/schema";
import type { FeatureAccess, BusinessFeature } from "@shared/planFeatures";

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

const CORE_FEATURES_UI: { key: string; featureKey: BusinessFeature }[] = [
  { key: "pricing.coreFeatures.pms", featureKey: "guest_management" },
  { key: "pricing.coreFeatures.booking", featureKey: "guest_management" },
  { key: "pricing.coreFeatures.guest", featureKey: "guest_management" },
  { key: "pricing.coreFeatures.staff", featureKey: "staff_management" },
  { key: "pricing.coreFeatures.reports", featureKey: "guest_management" },
  { key: "pricing.coreFeatures.multiProperty", featureKey: "multi_property" },
  { key: "pricing.coreFeatures.advancedAnalytics", featureKey: "advanced_analytics" },
  { key: "pricing.coreFeatures.prioritySupport", featureKey: "priority_support" },
  { key: "pricing.coreFeatures.customIntegrations", featureKey: "custom_integrations" },
];

const DEFAULT_TRIAL_DAYS = 14;

const DEMO_ROLES = [
  { id: "owner", icon: Crown, colorClass: "text-amber-500 dark:text-amber-400", bgClass: "bg-amber-500/10" },
  { id: "admin", icon: UserCog, colorClass: "text-blue-500 dark:text-blue-400", bgClass: "bg-blue-500/10" },
  { id: "reception", icon: ConciergeBell, colorClass: "text-emerald-500 dark:text-emerald-400", bgClass: "bg-emerald-500/10" },
  { id: "guest", icon: User, colorClass: "text-violet-500 dark:text-violet-400", bgClass: "bg-violet-500/10" },
] as const;

const POPULAR_PLAN_CODE = "CORE_GROWTH";
const BEST_VALUE_PLAN_CODE = "CORE_PRO";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [roomCount, setRoomCount] = useState(10);
  const [selectedSmartIdx, setSelectedSmartIdx] = useState(1);
  const [selectedCorePlanIdx, setSelectedCorePlanIdx] = useState(1);
  const [smartEnabled, setSmartEnabled] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [installStatus, setInstallStatus] = useState<"idle" | "accepted" | "needs_browser" | "use_menu">("idle");
  const [showIOSModal, setShowIOSModal] = useState(false);

  const isInIframe = window.self !== window.top;

  const triggerInstall = async () => {
    const prompt = (window as any).__pwaInstallPrompt;
    if (!prompt) {
      setInstallStatus(isInIframe ? "needs_browser" : "use_menu");
      return;
    }
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      (window as any).__pwaInstallPrompt = null;
      if (outcome === "accepted") {
        setInstallStatus("accepted");
      }
    } catch {
      setInstallStatus(isInIframe ? "needs_browser" : "use_menu");
    }
  };

  const openInBrowser = () => {
    const url = window.location.href.split("?")[0];
    window.open(url, "_blank", "noopener");
  };

  const isIOSSafari = (() => {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  })();
  const pwa = usePWAInstall();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: plans } = useQuery<PlanFromAPI[]>({
    queryKey: ["/api/plans"],
  });

  const { data: smartPlans } = useQuery<SmartPlanFromAPI[]>({
    queryKey: ["/api/smart-plans"],
  });

  const handleDemoLogin = async (role: string) => {
    setDemoLoading(role);
    try {
      const response = await apiRequest("POST", "/api/auth/demo-login", { role });
      const data = await response.json();
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "/api/auth/me" });
      queryClient.setQueryData(["/api/auth/me"], data);
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Demo login failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(null);
    }
  };

  const corePlans = plans || [];
  const smartPlansList = smartPlans || [];
  const selectedCore = corePlans[selectedCorePlanIdx] || corePlans[0];
  const selectedSmart = smartPlansList[selectedSmartIdx] || smartPlansList[0];
  const corePrice = selectedCore?.priceMonthlyUSD || 0;
  const smartUnitPrice = selectedSmart?.priceMonthlyUSD || 0;
  const smartCost = smartEnabled ? smartUnitPrice * roomCount : 0;
  const monthlyTotal = useMemo(
    () => corePrice + (smartEnabled ? smartUnitPrice * roomCount : 0),
    [corePrice, smartUnitPrice, roomCount, smartEnabled],
  );

  const navigateToRegister = (planCode?: string) => {
    const params = new URLSearchParams();
    if (smartEnabled) params.set('smart', '1');
    if (planCode) params.set('plan', planCode);
    else if (selectedCore?.code) params.set('plan', selectedCore.code);
    setLocation(`/register-hotel${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div className="bg-background flex flex-col" style={{ minHeight: '100dvh' }}>
      <SEO
        title="Smart Hotel Management Platform"
        description="O.S.S Smart Hotel System — Multi-property management with smart room controls, AI assistant, booking management, and seamless guest services. Start from $79/month."
        path="/"
      />

      <header className={`flex items-center justify-between gap-4 px-6 py-3 shrink-0 sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm" : "bg-transparent"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">O.S.S</span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-features">
            {t('landing.features')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-pricing">
            {t('landing.pricing')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-demo">
            {t('landing.tryLiveDemo')}
          </Button>
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} data-testid="button-header-login">
            {t('auth.signIn')}
          </Button>
          <Button size="sm" onClick={() => navigateToRegister()} data-testid="button-header-trial">
            <span className="hidden sm:inline">{t('pricing.startFreeTrial')}</span>
            <span className="sm:hidden">Trial</span>
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <main className="flex-grow">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 px-6" data-testid="section-hero">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/8 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border/50">
                <Zap className="h-3 w-3 mr-1.5 text-primary" />
                {t('landing.trustedBadge')}
              </Badge>

              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
                {t('welcome.title')}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('welcome.subtitle')} {t('landing.heroExtended')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button size="lg" onClick={() => navigateToRegister()} className="rounded-xl shadow-lg shadow-primary/20" data-testid="button-start-trial">
                  {t('pricing.startFreeTrial')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl" data-testid="button-hero-demo">
                  <Play className="mr-2 h-4 w-4" />
                  {t('landing.tryLiveDemo')}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground/70">
                {t('pricing.trialDaysLabel', { days: DEFAULT_TRIAL_DAYS })}
              </p>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="mt-16 relative"
            >
              <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl pointer-events-none" />
              <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-0.5 rounded-md bg-muted/50 text-xs text-muted-foreground">ossaiproapp.com/dashboard</div>
                  </div>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Occupancy", value: "87%", change: "+5%", color: "text-emerald-500" },
                      { label: "Revenue", value: "$12,450", change: "+12%", color: "text-blue-500" },
                      { label: "Bookings", value: "24", change: "+3", color: "text-violet-500" },
                      { label: "Guest Rating", value: "4.8", change: "+0.2", color: "text-amber-500" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-muted/40 border border-border/30 space-y-1">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={`text-xs font-medium ${stat.color}`}>{stat.change}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 h-32 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-border/30 flex items-center justify-center">
                      <div className="flex items-end gap-1.5 h-20">
                        {[40, 55, 45, 70, 60, 80, 75, 90, 85, 65, 88, 92].map((h, i) => (
                          <div key={i} className="w-3 md:w-4 rounded-t bg-primary/40 transition-all" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="h-32 rounded-xl bg-muted/40 border border-border/30 p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Recent Activity</p>
                      {["Check-in: Room 301", "New booking #1024", "Service request #45"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* INSTANT VALUE SECTION */}
        <AnimatedSection>
          <section className="py-24 px-6" data-testid="section-instant-value">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
                <div className="flex-1 space-y-6">
                  <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3 mr-1.5 text-primary" />
                    {t('landing.instantValue.badge')}
                  </Badge>
                  <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]" data-testid="text-instant-value-title">
                    {t('landing.instantValue.title')}
                  </h2>
                  <p className="text-lg text-muted-foreground" data-testid="text-instant-value-subtitle">
                    {t('landing.instantValue.subtitle')}
                  </p>
                  <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="space-y-4 pt-2">
                    {[
                      { icon: CalendarCheck, key: 'landing.instantValue.bullet1', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { icon: Zap, key: 'landing.instantValue.bullet2', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                      { icon: Cpu, key: 'landing.instantValue.bullet3', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                      { icon: TrendingUp, key: 'landing.instantValue.bullet4', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                      { icon: Users, key: 'landing.instantValue.bullet5', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    ].map((item, idx) => {
                      const BIcon = item.icon;
                      return (
                        <motion.li key={idx} variants={fadeUp} className="flex items-start gap-3" data-testid={`instant-value-bullet-${idx + 1}`}>
                          <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <BIcon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <span className="text-base font-medium leading-relaxed">{t(item.key)}</span>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </div>
                <div className="flex-1 w-full max-w-md lg:max-w-none">
                  <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden shadow-xl">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/30 bg-card/40">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                      <div className="flex-1 flex justify-center">
                        <div className="px-3 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground">ossaiproapp.com/dashboard</div>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Today's Check-ins", value: "12", icon: CalendarCheck, color: "text-blue-500" },
                          { label: "Open Requests", value: "5", icon: MessageSquare, color: "text-amber-500" },
                          { label: "Occupancy", value: "87%", icon: BarChart3, color: "text-emerald-500" },
                        ].map((s) => {
                          const SIcon = s.icon;
                          return (
                            <div key={s.label} className="p-3 rounded-xl bg-card/60 border border-border/30 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <SIcon className={`h-3 w-3 ${s.color}`} />
                                <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                              </div>
                              <p className="text-xl font-bold">{s.value}</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-2">
                        {[
                          { room: "Room 301", guest: "A. Smith", status: "Checked In", statusColor: "bg-emerald-500" },
                          { room: "Suite 501", guest: "M. Johnson", status: "Arriving", statusColor: "bg-blue-500" },
                          { room: "Room 205", guest: "K. Lee", status: "Checkout", statusColor: "bg-amber-500" },
                        ].map((row) => (
                          <div key={row.room} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/20">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BedDouble className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-medium">{row.room}</p>
                                <p className="text-[10px] text-muted-foreground">{row.guest}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${row.statusColor}`} />
                              <span className="text-[10px] text-muted-foreground">{row.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* FEATURES SECTION */}
        <AnimatedSection>
          <section id="features" className="py-24 px-6 relative" data-testid="section-features">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">{t('landing.features')}</Badge>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">{t('landing.everythingYouNeed')}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('landing.everythingYouNeedDesc')}</p>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: Shield, titleKey: 'landing.featureDetails.secureAccess', descKey: 'landing.featureDetails.secureAccessDesc', tid: 'secure-access' },
                  { icon: Lightbulb, titleKey: 'landing.featureDetails.smartControls', descKey: 'landing.featureDetails.smartControlsDesc', tid: 'smart-controls' },
                  { icon: MessageSquare, titleKey: 'landing.featureDetails.guestCommunication', descKey: 'landing.featureDetails.guestCommunicationDesc', tid: 'guest-communication' },
                  { icon: CalendarCheck, titleKey: 'landing.featureDetails.bookingManagement', descKey: 'landing.featureDetails.bookingManagementDesc', tid: 'booking-management' },
                  { icon: BarChart3, titleKey: 'landing.featureDetails.financialAnalytics', descKey: 'landing.featureDetails.financialAnalyticsDesc', tid: 'financial-analytics' },
                  { icon: HeadphonesIcon, titleKey: 'landing.featureDetails.serviceRequests', descKey: 'landing.featureDetails.serviceRequestsDesc', tid: 'service-requests' },
                ].map((f) => {
                  const FIcon = f.icon;
                  return (
                    <motion.div key={f.tid} variants={fadeUp}>
                      <div className="group p-6 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/20 hover:bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 h-full" data-testid={`feature-${f.tid}`}>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                          <FIcon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-heading font-semibold text-base mb-2">{t(f.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* WHY OSS SECTION */}
        <AnimatedSection>
          <section className="py-24 px-6 relative" data-testid="section-why-oss">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">
                  <Zap className="h-3 w-3 mr-1.5" />
                  {t('landing.whyOss.title')}
                </Badge>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]" data-testid="text-why-oss-title">
                  {t('landing.whyOss.title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-why-oss-subtitle">
                  {t('landing.whyOss.subtitle')}
                </p>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: LayoutDashboard, titleKey: 'landing.whyOss.allInOne', descKey: 'landing.whyOss.allInOneDesc', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10', borderColor: 'hover:border-blue-500/30', tid: 'all-in-one' },
                  { icon: Cpu, titleKey: 'landing.whyOss.smartRoom', descKey: 'landing.whyOss.smartRoomDesc', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10', borderColor: 'hover:border-emerald-500/30', tid: 'smart-room' },
                  { icon: TrendingUp, titleKey: 'landing.whyOss.analytics', descKey: 'landing.whyOss.analyticsDesc', iconColor: 'text-violet-500', iconBg: 'bg-violet-500/10', borderColor: 'hover:border-violet-500/30', tid: 'analytics' },
                  { icon: Building2, titleKey: 'landing.whyOss.multiProperty', descKey: 'landing.whyOss.multiPropertyDesc', iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', borderColor: 'hover:border-amber-500/30', tid: 'multi-property' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.tid} variants={fadeUp}>
                      <div className={`group p-6 rounded-2xl bg-card/50 border border-border/40 ${item.borderColor} hover:bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 h-full`} data-testid={`card-why-oss-${item.tid}`}>
                        <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`h-6 w-6 ${item.iconColor}`} />
                        </div>
                        <h3 className="font-heading font-semibold text-lg mb-2">{t(item.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* PRODUCT PREVIEW SECTIONS */}
        <section className="py-24 px-6" data-testid="section-product-preview">
          <div className="max-w-6xl mx-auto space-y-32">
            <AnimatedSection>
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">
                  <Activity className="h-3 w-3 mr-1.5" />
                  {t('landing.productPreview.title')}
                </Badge>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">{t('landing.productPreview.subtitle')}</h2>
              </div>
            </AnimatedSection>

            {[
              {
                icon: LayoutDashboard,
                titleKey: "landing.productPreview.dashboard.title",
                descKey: "landing.productPreview.dashboard.desc",
                color: "from-blue-500/10 to-cyan-500/10",
                iconColor: "text-blue-500",
                iconBg: "bg-blue-500/10",
                mockContent: (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[{ v: "87%", l: "Occ." }, { v: "$142", l: "ADR" }, { v: "$123", l: "RevPAR" }].map((s) => (
                        <div key={s.l} className="p-3 rounded-lg bg-muted/60 border border-border/30 text-center">
                          <p className="text-lg font-bold">{s.v}</p>
                          <p className="text-[10px] text-muted-foreground">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-20 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-border/30 flex items-end justify-around px-3 pb-2">
                      {[35, 50, 42, 68, 55, 78, 62].map((h, i) => (
                        <div key={i} className="w-4 rounded-t bg-blue-500/30" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                icon: BedDouble,
                titleKey: "landing.productPreview.smartRoom.title",
                descKey: "landing.productPreview.smartRoom.desc",
                color: "from-emerald-500/10 to-teal-500/10",
                iconColor: "text-emerald-500",
                iconBg: "bg-emerald-500/10",
                reverse: true,
                mockContent: (
                  <div className="p-5 space-y-3">
                    {[
                      { label: "Lighting", value: "75%", icon: Lightbulb, color: "bg-amber-500" },
                      { label: "Temperature", value: "22°C", icon: Activity, color: "bg-blue-500" },
                      { label: "Curtains", value: "Open", icon: Shield, color: "bg-emerald-500" },
                    ].map((ctrl) => (
                      <div key={ctrl.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/30">
                        <div className={`w-8 h-8 rounded-lg ${ctrl.color}/10 flex items-center justify-center`}>
                          <ctrl.icon className={`h-4 w-4 ${ctrl.color === "bg-amber-500" ? "text-amber-500" : ctrl.color === "bg-blue-500" ? "text-blue-500" : "text-emerald-500"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ctrl.label}</p>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">{ctrl.value}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                icon: MessageCircle,
                titleKey: "landing.productPreview.communication.title",
                descKey: "landing.productPreview.communication.desc",
                color: "from-violet-500/10 to-purple-500/10",
                iconColor: "text-violet-500",
                iconBg: "bg-violet-500/10",
                mockContent: (
                  <div className="p-5 space-y-3">
                    {[
                      { name: "Guest - Room 301", msg: "Extra towels please", time: "2m ago", urgent: false },
                      { name: "VIP - Suite 501", msg: "Late checkout request", time: "5m ago", urgent: true },
                      { name: "Guest - Room 205", msg: "Room service order", time: "12m ago", urgent: false },
                    ].map((m) => (
                      <div key={m.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/30">
                        <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{m.name}</p>
                            {m.urgent && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{m.msg}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{m.time}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                icon: TrendingUp,
                titleKey: "landing.productPreview.analytics.title",
                descKey: "landing.productPreview.analytics.desc",
                color: "from-amber-500/10 to-orange-500/10",
                iconColor: "text-amber-500",
                iconBg: "bg-amber-500/10",
                reverse: true,
                mockContent: (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[{ l: "RevPAR", v: "$123", c: "+8%" }, { l: "ADR", v: "$142", c: "+5%" }, { l: "Sold Nights", v: "186", c: "+12" }, { l: "Revenue", v: "$26.4k", c: "+15%" }].map((s) => (
                        <div key={s.l} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                          <p className="text-[10px] text-muted-foreground">{s.l}</p>
                          <p className="text-base font-bold">{s.v}</p>
                          <p className="text-[10px] text-emerald-500 font-medium">{s.c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ].map((section, idx) => {
              const Icon = section.icon;
              const isReverse = (section as any).reverse;
              return (
                <AnimatedSection key={idx}>
                  <div className={`flex flex-col ${isReverse ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 lg:gap-16 items-center`}>
                    <div className="flex-1 space-y-5">
                      <div className={`w-12 h-12 rounded-xl ${section.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${section.iconColor}`} />
                      </div>
                      <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-tight leading-[1.1]">{t(section.titleKey)}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">{t(section.descKey)}</p>
                      <Button variant="ghost" className="px-0 text-primary font-medium group" onClick={() => navigateToRegister()}>
                        {t('pricing.startFreeTrial')}
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                    <div className="flex-1 w-full max-w-md lg:max-w-none">
                      <div className={`rounded-2xl border border-border/40 bg-gradient-to-br ${section.color} overflow-hidden shadow-xl`}>
                        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/30 bg-card/40">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                        </div>
                        {section.mockContent}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <AnimatedSection>
          <section className="py-24 px-6 relative" data-testid="section-how-it-works">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-5xl mx-auto space-y-16">
              <div className="text-center space-y-4">
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.howItWorks.title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  {t('landing.howItWorks.subtitle')}
                </p>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {[
                  { step: 1, icon: Building2, titleKey: 'landing.howItWorks.step1Title', descKey: 'landing.howItWorks.step1Desc', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { step: 2, icon: Users, titleKey: 'landing.howItWorks.step2Title', descKey: 'landing.howItWorks.step2Desc', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { step: 3, icon: CalendarCheck, titleKey: 'landing.howItWorks.step3Title', descKey: 'landing.howItWorks.step3Desc', color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.step} variants={fadeUp} className="text-center space-y-5" data-testid={`how-it-works-step-${item.step}`}>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center`}>
                            <Icon className={`h-7 w-7 ${item.color}`} />
                          </div>
                          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {item.step}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-heading text-xl font-bold">{t(item.titleKey)}</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{t(item.descKey)}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* TRUST + STATS SECTION */}
        <AnimatedSection>
          <section className="py-24 px-6 relative" data-testid="section-trusted-by">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-5xl mx-auto space-y-16">
              <div className="text-center space-y-4">
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.trustedBy.title')}
                </h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                  {t('landing.trustedBy.subtitle')}
                </p>
              </div>

              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { value: "50+", label: t('landing.stats.hotels'), icon: Building2 },
                  { value: "12", label: t('landing.stats.countries'), icon: Globe },
                  { value: "99.9%", label: t('landing.stats.uptime'), icon: Activity },
                  { value: "24/7", label: t('landing.stats.support'), icon: HeadphonesIcon },
                ].map((stat) => {
                  const SIcon = stat.icon;
                  return (
                    <motion.div key={stat.label} variants={fadeUp} className="text-center p-6 rounded-2xl border border-border/40 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300">
                      <SIcon className="h-6 w-6 text-primary mx-auto mb-3" />
                      <p className="text-3xl md:text-4xl font-bold tracking-tight">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {[
                  { name: "Riverside Hotel", icon: Building2 },
                  { name: "Green Valley Resort", icon: Globe },
                  { name: "Mountain Lodge", icon: Shield },
                  { name: "City Center Suites", icon: Building2 },
                  { name: "Blue Coast Hotel", icon: Globe },
                  { name: "Sunset Boutique Hotel", icon: Building2 },
                ].map((hotel) => {
                  const Icon = hotel.icon;
                  return (
                    <div
                      key={hotel.name}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border/30 bg-card/30 text-muted-foreground/50 select-none hover:border-border/60 hover:text-muted-foreground/70 transition-all duration-300"
                      data-testid={`trusted-hotel-${hotel.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium whitespace-nowrap">{hotel.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* PRICING SECTION */}
        <AnimatedSection>
          <section id="pricing" className="py-24 px-6 relative" data-testid="section-pricing">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-6xl mx-auto space-y-16">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">{t('landing.pricing')}</Badge>
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                  {t('pricing.sectionTitle')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  {t('pricing.sectionSubtitle')}
                </p>
                <Badge variant="outline" className="text-xs rounded-full">
                  {t('pricing.billedMonthly', 'Billed monthly')}
                </Badge>
              </div>

              <div className="space-y-8" data-testid="pricing-core">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-heading text-2xl font-bold">{t('pricing.corePlatform')}</h3>
                  </div>
                  <p className="text-base font-medium text-foreground/80">
                    {t('pricing.coreMarketingLine1')}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    {t('pricing.coreMarketingLine2')}
                  </p>
                </div>

                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {corePlans.map((plan, idx) => {
                    const isPopular = plan.code === POPULAR_PLAN_CODE;
                    const isBestValue = plan.code === BEST_VALUE_PLAN_CODE;
                    const isGrowth = isPopular;
                    return (
                      <motion.div key={plan.code} variants={fadeUp}>
                        <Card
                          className={`relative cursor-pointer transition-all duration-300 hover:-translate-y-1 h-full ${
                            selectedCorePlanIdx === idx ? "ring-2 ring-primary" : ""
                          } ${isGrowth
                            ? "border-primary/40 shadow-xl shadow-primary/10 bg-gradient-to-b from-primary/5 to-transparent scale-[1.02] md:scale-105"
                            : "border-border/40 hover:border-primary/20 hover:shadow-lg"
                          }`}
                          onClick={() => setSelectedCorePlanIdx(idx)}
                          data-testid={`card-core-${plan.code}`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                              <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs shadow-lg shadow-primary/30">{t('pricing.mostPopular')}</Badge>
                            </div>
                          )}
                          {isBestValue && !isPopular && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                              <Badge className="bg-green-600 text-white px-4 py-1 text-xs">{t('pricing.bestValue')}</Badge>
                            </div>
                          )}
                          <CardContent className="p-7 space-y-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isGrowth ? "bg-primary/15" : "bg-primary/10"}`}>
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <span className="font-bold text-lg">{plan.displayName}</span>
                                <p className="text-xs text-muted-foreground/70 mt-0.5">
                                  {t(`pricing.planDesc.${plan.code}`)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {plan.limits.maxProperties >= 999
                                    ? t('pricing.unlimitedProperties')
                                    : plan.limits.maxProperties === 1
                                      ? t('pricing.upToProperties', { count: plan.limits.maxProperties })
                                      : t('pricing.upToProperties_plural', { count: plan.limits.maxProperties })}
                                  {' / '}
                                  {plan.limits.maxUnitsPerProperty >= 999
                                    ? t('pricing.unlimitedRooms')
                                    : t('pricing.upToRooms', { count: plan.limits.maxUnitsPerProperty })}
                                </p>
                              </div>
                            </div>
                            <div>
                              <span className="text-4xl font-bold tracking-tight">${plan.priceMonthlyUSD}</span>
                              <span className="text-muted-foreground text-sm"> {t('pricing.perMonth')}</span>
                            </div>
                            <ul className="space-y-2.5">
                              {CORE_FEATURES_UI.map((feature) => {
                                const included = plan.features[feature.featureKey];
                                return (
                                  <li key={feature.key} className="flex items-center gap-2.5 text-sm">
                                    {included ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 shrink-0" />
                                    ) : (
                                      <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                                    )}
                                    <span className={included ? "" : "text-muted-foreground/50"}>{t(feature.key)}</span>
                                  </li>
                                );
                              })}
                            </ul>
                            <div className="border-t border-border/50 pt-5 space-y-3">
                              <Button
                                className={`w-full rounded-xl ${isGrowth ? "shadow-md shadow-primary/20" : ""}`}
                                onClick={(e) => { e.stopPropagation(); navigateToRegister(plan.code); }}
                                data-testid={`button-trial-core-${plan.code}`}
                              >
                                {t('pricing.startFreeTrial')}
                              </Button>
                              <Button
                                className="w-full rounded-xl"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); navigateToRegister(plan.code); }}
                                data-testid={`button-subscribe-core-${plan.code}`}
                              >
                                {t('pricing.subscribeNow')}
                              </Button>
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                              <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{t('pricing.trialCheckmark', { days: DEFAULT_TRIAL_DAYS })}</p>
                              <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{t('pricing.noCreditCard')}</p>
                              <p className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{t('pricing.setupMinutes')}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* SMART ROOM ADD-ON */}
              <div className="space-y-8" data-testid="pricing-smart">
                <div className="text-center space-y-3">
                  <Badge variant="secondary" className="text-xs rounded-full">{t('pricing.optionalAddon')}</Badge>
                  <div className="flex items-center justify-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <h3 className="font-heading text-2xl font-bold">{t('pricing.smartRoomAddon')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('pricing.smartRoomAddonDesc')}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Switch
                    id="smart-toggle"
                    checked={smartEnabled}
                    onCheckedChange={setSmartEnabled}
                    data-testid="switch-smart-toggle"
                  />
                  <label htmlFor="smart-toggle" className="text-sm font-medium cursor-pointer">
                    {t('pricing.enableSmartRooms')}
                  </label>
                </div>

                {smartEnabled && smartPlansList.length > 0 && (
                  <>
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {smartPlansList.map((sp, idx) => {
                        const TierIcon = SMART_CODE_ICONS[sp.code] || Cpu;
                        const isSelected = selectedSmartIdx === idx;
                        const isComingSoon = sp.available === false;
                        return (
                          <motion.div key={sp.code} variants={fadeUp}>
                            <Card
                              className={`relative transition-all duration-300 h-full ${
                                isComingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                              } ${isSelected && !isComingSoon ? "ring-2 ring-primary" : "border-border/40"}`}
                              onClick={() => { if (!isComingSoon) setSelectedSmartIdx(idx); }}
                              data-testid={`card-smart-${sp.code}`}
                            >
                              {isComingSoon && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 dark:border-amber-700" data-testid={`badge-coming-soon-${sp.code}`}>
                                    {t('pricing.comingSoon', 'Coming Soon')}
                                  </Badge>
                                </div>
                              )}
                              {!isComingSoon && sp.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                  <Badge className="bg-primary text-primary-foreground">{t('pricing.popular')}</Badge>
                                </div>
                              )}
                              <CardContent className="p-7 space-y-5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isComingSoon ? "bg-muted" : "bg-primary/10"}`}>
                                    <TierIcon className={`h-5 w-5 ${isComingSoon ? "text-muted-foreground" : "text-primary"}`} />
                                  </div>
                                  <span className="font-bold text-lg">{sp.displayName}</span>
                                </div>
                                <div>
                                  <span className="text-4xl font-bold tracking-tight">${sp.priceMonthlyUSD}</span>
                                  <span className="text-muted-foreground text-sm"> {t('pricing.perRoomPerMonth')}</span>
                                </div>
                                <ul className="space-y-2.5">
                                  {Object.entries(SMART_FEATURE_LABELS).map(([featureCode, labelKey]) => {
                                    const included = sp.features.includes(featureCode);
                                    return (
                                      <li key={featureCode} className="flex items-center gap-2.5 text-sm">
                                        {included ? (
                                          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 shrink-0" />
                                        ) : (
                                          <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                                        )}
                                        <span className={included ? "" : "text-muted-foreground/50"}>{t(labelKey)}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                                <Button
                                  className="w-full rounded-xl"
                                  variant={isComingSoon ? "secondary" : isSelected ? "default" : "outline"}
                                  disabled={isComingSoon}
                                  onClick={(e) => { e.stopPropagation(); if (!isComingSoon) setSelectedSmartIdx(idx); }}
                                  data-testid={`button-select-smart-${sp.code}`}
                                >
                                  {isComingSoon ? t('pricing.comingSoon', 'Coming Soon') : isSelected ? t('pricing.selected') : t('pricing.selectPlan')}
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                    <p className="text-center text-xs text-muted-foreground">{t('pricing.hardwareNotIncluded')}</p>
                  </>
                )}
              </div>

              {/* PRICING CALCULATOR */}
              <AnimatedSection>
                <div className="max-w-2xl mx-auto" data-testid="pricing-calculator">
                  <Card className="border-border/40 shadow-xl">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calculator className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-bold">{t('pricing.calculator')}</h3>
                          <p className="text-xs text-muted-foreground">{t('pricing.calculatorSub')}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <label className="text-sm font-medium">{t('pricing.coreTierLabel')}</label>
                          <div className="flex gap-2 flex-wrap">
                            {corePlans.map((plan, idx) => (
                              <Button
                                key={plan.code}
                                size="sm"
                                variant={selectedCorePlanIdx === idx ? "default" : "outline"}
                                onClick={() => setSelectedCorePlanIdx(idx)}
                                className="rounded-lg"
                                data-testid={`button-calc-core-${plan.code}`}
                              >
                                {plan.displayName}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <label className="text-sm font-medium">{t('pricing.enableSmartRooms')}</label>
                          <Switch
                            checked={smartEnabled}
                            onCheckedChange={setSmartEnabled}
                            data-testid="switch-calc-smart-toggle"
                          />
                        </div>

                        {smartEnabled && (
                          <>
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <label className="text-sm font-medium">{t('pricing.smartRoomCount')}</label>
                              <div className="flex items-center gap-3">
                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => setRoomCount((c) => Math.max(1, c - 1))} data-testid="button-calc-minus">
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
                                  className="w-16 text-center text-lg font-semibold bg-transparent border border-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                                  data-testid="input-room-count"
                                />
                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => setRoomCount((c) => Math.min(999, c + 1))} data-testid="button-calc-plus">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <label className="text-sm font-medium">{t('pricing.smartTier')}</label>
                              <div className="flex gap-2 flex-wrap">
                                {smartPlansList.map((sp, idx) => {
                                  const isComingSoon = sp.available === false;
                                  return (
                                    <Button
                                      key={sp.code}
                                      size="sm"
                                      variant={isComingSoon ? "ghost" : selectedSmartIdx === idx ? "default" : "outline"}
                                      onClick={() => { if (!isComingSoon) setSelectedSmartIdx(idx); }}
                                      disabled={isComingSoon}
                                      className={`rounded-lg ${isComingSoon ? "opacity-50" : ""}`}
                                      data-testid={`button-calc-tier-${sp.code}`}
                                    >
                                      {sp.displayName}{isComingSoon ? ` (${t('pricing.comingSoon', 'Coming Soon')})` : ""}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-t border-border/50 pt-5 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{selectedCore?.displayName || "—"}</span>
                          <span className="font-medium">${corePrice}{t('pricing.perMonth')}</span>
                        </div>
                        {smartEnabled && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {selectedSmart?.displayName || "—"} x {roomCount} {roomCount !== 1 ? t('pricing.rooms') : t('pricing.room')}
                            </span>
                            <span className="font-medium">${smartCost.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="font-semibold">{t('pricing.estimatedTotal')}</span>
                          <span className="text-3xl font-bold text-primary" data-testid="text-calc-total">
                            ${monthlyTotal.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{t('pricing.exclVat')}</p>
                      </div>

                      <Button size="lg" className="w-full rounded-xl shadow-md shadow-primary/20" onClick={() => navigateToRegister()} data-testid="button-calc-subscribe">
                        {t('pricing.subscribeNow')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </AnimatedSection>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t('pricing.pricesExclVat')}
                </p>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* FAQ SECTION */}
        <AnimatedSection>
          <section className="py-24 px-6" data-testid="section-faq">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.faq.title')}
                </h2>
              </div>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border border-border/40 rounded-xl px-6 data-[state=open]:bg-card/50 transition-colors" data-testid={`faq-item-${i}`}>
                    <AccordionTrigger className="text-left text-base font-medium py-5 hover:no-underline" data-testid={`faq-trigger-${i}`}>
                      {t(`landing.faq.q${i}`)}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {t(`landing.faq.a${i}`)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </AnimatedSection>

        {/* DEMO SECTION */}
        <AnimatedSection>
          <section id="demo" className="py-24 px-6" data-testid="section-demo">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">
                  <Play className="h-3 w-3 mr-1.5" />
                  {t('landing.tryLiveDemo')}
                </Badge>
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.demoTitle')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  {t('landing.demoSubtitle')}
                </p>
              </div>

              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {DEMO_ROLES.map((role) => {
                  const Icon = role.icon;
                  const isLoading = demoLoading === role.id;
                  const roleNameKey = `landing.demoRole${role.id.charAt(0).toUpperCase() + role.id.slice(1)}` as const;
                  const roleDescKey = `landing.demoRole${role.id.charAt(0).toUpperCase() + role.id.slice(1)}Desc` as const;
                  return (
                    <motion.div key={role.id} variants={fadeUp}>
                      <Card
                        className="group cursor-pointer transition-all duration-300 border-border/40 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1 h-full"
                        onClick={() => !demoLoading && handleDemoLogin(role.id)}
                        data-testid={`card-demo-${role.id}`}
                      >
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${role.bgClass} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                              <Icon className={`h-6 w-6 ${role.colorClass}`} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-heading font-semibold">{t(roleNameKey)}</h3>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t(roleDescKey)}
                          </p>
                          <Button
                            className="w-full rounded-xl"
                            variant="outline"
                            disabled={!!demoLoading}
                            onClick={(e) => { e.stopPropagation(); handleDemoLogin(role.id); }}
                            data-testid={`button-demo-${role.id}`}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('landing.demoEntering')}
                              </>
                            ) : (
                              <>
                                {t('landing.demoExplore', { role: t(roleNameKey) })}
                                <ArrowRight className="ml-2 h-3.5 w-3.5" />
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        </AnimatedSection>

        {/* CTA SECTION */}
        <section className="py-24 px-6 relative overflow-hidden" data-testid="section-cta">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          </div>
          <AnimatedSection>
            <div className="relative max-w-3xl mx-auto text-center space-y-8">
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">{t('landing.readyToTransform')}</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('landing.readyToTransformDesc')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigateToRegister()} className="rounded-xl shadow-lg shadow-primary/20" data-testid="button-cta-register">
                  {t('landing.registerYourHotel')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => setLocation("/login")} className="rounded-xl" data-testid="button-cta-login">
                  {t('auth.signIn')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground/70">
                {t('pricing.trialCheckmark', { days: DEFAULT_TRIAL_DAYS })} &middot; {t('pricing.noCreditCard')}
              </p>
            </div>
          </AnimatedSection>
        </section>

        {/* DOWNLOAD / INSTALL APP SECTION */}
        <AnimatedSection>
          <section id="download" className="py-20 px-6 border-t border-border/20" data-testid="section-download-app">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12 space-y-3">
                <Badge variant="secondary" className="px-3 py-1 text-xs font-medium gap-1.5">
                  <Download className="h-3 w-3" />
                  Progressive Web App
                </Badge>
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                  Install OSS on Your Device
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  No app store needed. Install directly from your browser — works on all platforms, offline-ready.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                {/* Windows */}
                <Card
                  className={`relative overflow-hidden transition-all duration-200 ${pwa.deviceType === "windows" ? "border-primary/60 shadow-md shadow-primary/10" : "border-border/40 hover:border-border/70"}`}
                  data-testid="card-platform-windows"
                >
                  {pwa.deviceType === "windows" && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">Your device</Badge>
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Monitor className="text-blue-500 h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Windows</p>
                        <p className="text-xs text-muted-foreground">Chrome / Edge</p>
                      </div>
                    </div>
                    {installStatus === "accepted" ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium" data-testid="text-install-success-windows">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" /> OSS installed successfully
                      </div>
                    ) : installStatus === "needs_browser" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Open OSS directly in Chrome or Edge — not inside an embedded frame.</p>
                        <Button variant="outline" className="w-full rounded-lg" data-testid="button-open-browser-windows" onClick={openInBrowser}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                        </Button>
                      </div>
                    ) : installStatus === "use_menu" ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Look for <span className="font-medium text-foreground">⊕</span> icon in the address bar</p>
                        </div>
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Or Chrome menu <span className="font-medium text-foreground">⋮</span> → <span className="font-medium text-foreground">Install OSS</span></p>
                        </div>
                      </div>
                    ) : (
                      <Button className="w-full rounded-lg" data-testid="button-install-windows" onClick={triggerInstall}>
                        <Download className="h-4 w-4 mr-2" /> Install Now
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Mac */}
                <Card
                  className={`relative overflow-hidden transition-all duration-200 ${pwa.deviceType === "mac" ? "border-primary/60 shadow-md shadow-primary/10" : "border-border/40 hover:border-border/70"}`}
                  data-testid="card-platform-mac"
                >
                  {pwa.deviceType === "mac" && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">Your device</Badge>
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                        <SiApple className="text-slate-600 dark:text-slate-300 text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Mac</p>
                        <p className="text-xs text-muted-foreground">Chrome / Safari</p>
                      </div>
                    </div>
                    {installStatus === "accepted" ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium" data-testid="text-install-success-mac">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" /> OSS installed successfully
                      </div>
                    ) : installStatus === "needs_browser" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Open OSS directly in Chrome or Safari — not inside an embedded frame.</p>
                        <Button variant="outline" className="w-full rounded-lg" data-testid="button-open-browser-mac" onClick={openInBrowser}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                        </Button>
                      </div>
                    ) : installStatus === "use_menu" ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Look for <span className="font-medium text-foreground">⊕</span> icon in the address bar</p>
                        </div>
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Or Chrome menu <span className="font-medium text-foreground">⋮</span> → <span className="font-medium text-foreground">Install OSS</span></p>
                        </div>
                      </div>
                    ) : (
                      <Button className="w-full rounded-lg" data-testid="button-install-mac" onClick={triggerInstall}>
                        <Download className="h-4 w-4 mr-2" /> Install Now
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Android */}
                <Card
                  className={`relative overflow-hidden transition-all duration-200 ${pwa.deviceType === "android" ? "border-primary/60 shadow-md shadow-primary/10" : "border-border/40 hover:border-border/70"}`}
                  data-testid="card-platform-android"
                >
                  {pwa.deviceType === "android" && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">Your device</Badge>
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <SiAndroid className="text-green-500 text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Android</p>
                        <p className="text-xs text-muted-foreground">Chrome browser</p>
                      </div>
                    </div>
                    {installStatus === "accepted" ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium" data-testid="text-install-success-android">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" /> OSS installed successfully
                      </div>
                    ) : installStatus === "needs_browser" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Open OSS directly in Chrome — not inside an embedded frame.</p>
                        <Button variant="outline" className="w-full rounded-lg" data-testid="button-open-browser-android" onClick={openInBrowser}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Open in New Tab
                        </Button>
                      </div>
                    ) : installStatus === "use_menu" ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Look for <span className="font-medium text-foreground">⊕</span> icon in the address bar</p>
                        </div>
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Or Chrome menu <span className="font-medium text-foreground">⋮</span> → <span className="font-medium text-foreground">Install OSS</span></p>
                        </div>
                      </div>
                    ) : (
                      <Button className="w-full rounded-lg" data-testid="button-install-android" onClick={triggerInstall}>
                        <Download className="h-4 w-4 mr-2" /> Install Now
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* iPhone / iPad */}
                <Card
                  className={`relative overflow-hidden transition-all duration-200 ${pwa.deviceType === "ios" ? "border-primary/60 shadow-md shadow-primary/10" : "border-border/40 hover:border-border/70"}`}
                  data-testid="card-platform-ios"
                >
                  {pwa.deviceType === "ios" && (
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20">Your device</Badge>
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                        <SiApple className="text-slate-600 dark:text-slate-300 text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">iPhone / iPad</p>
                        <p className="text-xs text-muted-foreground">{isIOSSafari ? "You're in Safari ✓" : "Safari browser"}</p>
                      </div>
                    </div>
                    {isIOSSafari ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary">1</div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <span>Tap</span>
                            <Share className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Share</span>
                            <span className="text-muted-foreground text-xs">(bottom bar)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary">2</div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Plus className="h-4 w-4 text-green-500" />
                            <span>Tap <span className="font-medium">"Add to Home Screen"</span></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">OSS will appear on your home screen</span>
                        </div>
                      </div>
                    ) : (
                      <Button className="w-full rounded-lg" data-testid="button-install-ios" onClick={() => setShowIOSModal(true)}>
                        <Download className="h-4 w-4 mr-2" /> Install Now
                      </Button>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* iOS Install Modal */}
              <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
                <DialogContent className="max-w-md" data-testid="modal-ios-install">
                  <DialogHeader>
                    <div className="flex items-center gap-2.5 mb-1">
                      <SiApple className="text-slate-600 dark:text-slate-300 text-xl" />
                      <DialogTitle>Install OSS on iPhone / iPad</DialogTitle>
                    </div>
                    <DialogDescription>
                      Safari required — Chrome on iOS doesn't support PWA install.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    {[
                      { step: "1", icon: <Globe className="h-4 w-4 text-blue-500" />, title: "Open Safari", desc: "Must use Safari — Chrome on iOS doesn't support PWA install." },
                      { step: "2", icon: <Share className="h-4 w-4 text-blue-500" />, title: "Tap the Share icon", desc: "The square with an arrow pointing up at the bottom of the screen." },
                      { step: "3", icon: <Plus className="h-4 w-4 text-green-500" />, title: "Add to Home Screen", desc: "Scroll down in the share sheet and tap 'Add to Home Screen'." },
                      { step: "4", icon: <CheckCircle className="h-4 w-4 text-green-500" />, title: "Tap Add", desc: "OSS will appear on your home screen as an app icon." },
                    ].map(item => (
                      <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary mt-0.5">{item.step}</div>
                        <div className="flex items-start gap-2.5 flex-1">
                          <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <p className="text-center text-xs text-muted-foreground/50 mt-8">
                Works offline · No app store required · Always up to date
              </p>
            </div>
          </section>
        </AnimatedSection>
      </main>

      <footer className="relative border-t border-border/30 py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">O.S.S</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="https://www.ossaipro.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Globe className="h-4 w-4" />
                www.ossaipro.com
              </a>
              <a href="mailto:info@ossaipro.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                info@ossaipro.com
              </a>
              <a href="tel:+994518880089" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                +994 51 888 00 89
              </a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); setLocation("/privacy-policy"); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy-policy">
              {t('legal.privacyPolicy')}
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a href="/terms-of-service" onClick={(e) => { e.preventDefault(); setLocation("/terms-of-service"); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-terms-of-service">
              {t('legal.termsOfService')}
            </a>
          </div>
          <p className="text-center text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} {t('landing.copyright')}
          </p>
        </div>
      </footer>

      <GetQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        sourcePage="Landing"
      />
    </div>
  );
}
