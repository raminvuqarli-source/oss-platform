import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GetQuoteDialog } from "@/components/get-quote-dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  Building2, Globe, Mail, Phone, CheckCircle,
  BarChart3, Users, CalendarCheck, Lightbulb,
  Play, Loader2, Crown, UserCog, ConciergeBell, User,
  BrainCircuit, ArrowRight, Zap, Activity, TrendingUp,
  ChevronRight, UtensilsCrossed, Sparkles,
  ChefHat, Utensils, Wallet, Home,
} from "lucide-react";
import { apiRequest, queryClient, setDemoToken } from "@/lib/queryClient";
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

const DEFAULT_TRIAL_DAYS = 14;

const DEMO_ROLES = [
  { id: "owner", icon: Crown, colorClass: "text-amber-500 dark:text-amber-400", bgClass: "bg-amber-500/10" },
  { id: "admin", icon: UserCog, colorClass: "text-blue-500 dark:text-blue-400", bgClass: "bg-blue-500/10" },
  { id: "reception", icon: ConciergeBell, colorClass: "text-emerald-500 dark:text-emerald-400", bgClass: "bg-emerald-500/10" },
  { id: "guest", icon: User, colorClass: "text-violet-500 dark:text-violet-400", bgClass: "bg-violet-500/10" },
] as const;

const DEMO_INFO_ROLES = [
  { id: "housekeeping", icon: Sparkles, colorClass: "text-teal-500 dark:text-teal-400", bgClass: "bg-teal-500/10", titleKey: "landing.demo.housekeeping.title", descKey: "landing.demo.housekeeping.desc" },
  { id: "maintenance", icon: BrainCircuit, colorClass: "text-orange-500 dark:text-orange-400", bgClass: "bg-orange-500/10", titleKey: "landing.demo.maintenance.title", descKey: "landing.demo.maintenance.desc" },
];

const RESTAURANT_DEMO_ROLES = [
  { id: "restaurant_manager", icon: ChefHat, colorClass: "text-red-500 dark:text-red-400", bgClass: "bg-red-500/10", titleKey: "landing.demo.roles.restaurantManager.title", descKey: "landing.demo.roles.restaurantManager.desc" },
  { id: "kitchen", icon: ChefHat, colorClass: "text-orange-500 dark:text-orange-400", bgClass: "bg-orange-500/10", titleKey: "landing.demo.roles.kitchen.title", descKey: "landing.demo.roles.kitchen.desc" },
  { id: "waiter", icon: Utensils, colorClass: "text-amber-500 dark:text-amber-400", bgClass: "bg-amber-500/10", titleKey: "landing.demo.roles.waiter.title", descKey: "landing.demo.roles.waiter.desc" },
  { id: "restaurant_cleaner", icon: Sparkles, colorClass: "text-cyan-500 dark:text-cyan-400", bgClass: "bg-cyan-500/10", titleKey: "landing.demo.roles.restaurantCleaner.title", descKey: "landing.demo.roles.restaurantCleaner.desc" },
  { id: "restaurant_cashier", icon: Wallet, colorClass: "text-green-500 dark:text-green-400", bgClass: "bg-green-500/10", titleKey: "landing.demo.roles.restaurantCashier.title", descKey: "landing.demo.roles.restaurantCashier.desc" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
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
  const [scrolled, setScrolled] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: plans } = useQuery<PlanFromAPI[]>({ queryKey: ["/api/plans"] });
  const corePlans = (plans || []).filter(p => !p.code.startsWith("REST_"));

  const handleDemoLogin = async (role: string) => {
    setDemoLoading(role);
    try {
      const response = await apiRequest("POST", "/api/auth/demo-login", { role });
      const data = await response.json();
      if (data._demoToken) setDemoToken(data._demoToken);
      const { _demoToken: _t, ...user } = data;
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "/api/auth/me" });
      queryClient.setQueryData(["/api/auth/me"], user);
      setLocation(`/demo?role=${role}`);
    } catch {
      toast({ title: "Demo login failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDemoLoading(null);
    }
  };

  const navigateToRegister = (planCode?: string) => {
    const params = new URLSearchParams();
    if (planCode) params.set('plan', planCode);
    setLocation(`/register-hotel${params.toString() ? '?' + params.toString() : ''}`);
  };

  const VALUE_PROPS = [
    {
      icon: TrendingUp,
      titleKey: "landing.vp.analytics.title",
      descKey: "landing.vp.analytics.desc",
      features: ["landing.vp.analytics.f1", "landing.vp.analytics.f2", "landing.vp.analytics.f3"],
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "hover:border-blue-500/25",
      gradient: "from-blue-500/5 to-transparent",
      badge: "Analytics",
      tid: "analytics",
    },
    {
      icon: CalendarCheck,
      titleKey: "landing.vp.bookings.title",
      descKey: "landing.vp.bookings.desc",
      features: ["landing.vp.bookings.f1", "landing.vp.bookings.f2", "landing.vp.bookings.f3"],
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/25",
      gradient: "from-emerald-500/5 to-transparent",
      badge: "PMS",
      tid: "bookings",
    },
    {
      icon: Lightbulb,
      titleKey: "landing.vp.smartRooms.title",
      descKey: "landing.vp.smartRooms.desc",
      features: ["landing.vp.smartRooms.f1", "landing.vp.smartRooms.f2", "landing.vp.smartRooms.f3"],
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/25",
      gradient: "from-amber-500/5 to-transparent",
      badge: "IoT",
      tid: "smart-rooms",
    },
    {
      icon: Users,
      titleKey: "landing.vp.staff.title",
      descKey: "landing.vp.staff.desc",
      features: ["landing.vp.staff.f1", "landing.vp.staff.f2", "landing.vp.staff.f3"],
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "hover:border-violet-500/25",
      gradient: "from-violet-500/5 to-transparent",
      badge: "Team",
      tid: "staff",
    },
  ];

  return (
    <div className="bg-background flex flex-col" style={{ minHeight: '100dvh' }}>
      <SEO
        title="O.S.S — Smart Hotel Management Platform | Multi-Property PMS"
        description="O.S.S Smart Hotel System — Multi-property management with smart room controls, AI assistant, dynamic pricing, booking management, and seamless guest services. Start from $79/month. 14-day free trial."
        path="/hotel"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "O.S.S Smart Hotel System",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "AggregateOffer", "lowPrice": "79", "highPrice": "199", "priceCurrency": "USD" },
          "featureList": ["Smart Room Controls", "Multi-Property Management", "Dynamic Pricing", "Automated Night Audit", "Channel Manager Integration", "Restaurant POS & KDS"]
        }}
      />

      {/* HEADER */}
      <header className={`flex items-center justify-between gap-4 px-6 py-3 shrink-0 sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm" : "bg-transparent"}`}>
        <button onClick={() => setLocation("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="button-logo-home">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">O.S.S</span>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => document.getElementById("capabilities")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-features">
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
          <Button variant="ghost" size="sm" asChild data-testid="button-header-login">
            <a href="/login" onClick={(e) => { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); setLocation("/login"); }}>
              {t('auth.signIn')}
            </a>
          </Button>
          <Button size="sm" asChild data-testid="button-header-trial">
            <a href="/register-hotel" onClick={(e) => { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigateToRegister(); }}>
              <span className="hidden sm:inline">{t('pricing.startFreeTrial')}</span>
              <span className="sm:hidden">Trial</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-grow">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 px-6" data-testid="section-hero">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-primary/8 blur-[130px]" />
            <div className="absolute top-1/3 -left-24 w-[320px] h-[320px] rounded-full bg-blue-500/6 blur-[90px]" />
            <div className="absolute top-1/4 -right-24 w-[320px] h-[320px] rounded-full bg-violet-500/6 blur-[90px]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-primary/4 blur-[80px]" />
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border/50 shadow-sm">
                <Zap className="h-3 w-3 mr-1.5 text-primary" />
                {t('landing.trustedBadge')}
              </Badge>

              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]" style={{ letterSpacing: "-0.02em" }}>
                <span className="font-extrabold block">{t('landing.heroTitle1')}</span>
                <span className="font-semibold block bg-gradient-to-r from-primary via-primary/80 to-blue-500 bg-clip-text text-transparent">
                  {t('landing.heroTitle2')}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('landing.heroExtended')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button size="lg" asChild className="rounded-xl shadow-lg shadow-primary/20 h-12 px-7 text-base font-semibold" data-testid="button-start-trial">
                  <a href="/register-hotel" onClick={(e) => { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigateToRegister(); }}>
                    {t('landing.startFreeTrial')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl h-12 px-7 text-base" data-testid="button-hero-demo">
                  <Play className="mr-2 h-4 w-4" />
                  {t('landing.ctaLiveDemo')}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground/70">{t('landing.trialText')}</p>

              {/* Mini stats strip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-8 md:gap-14 pt-3"
              >
                {[
                  { value: "50+", label: t('landing.heroStatHotels') },
                  { value: "99.9%", label: t('landing.heroStatUptime') },
                  { value: "10", label: t('landing.heroStatSetup') },
                  { value: "14", label: t('landing.heroStatTrial') },
                ].map((s) => (
                  <div key={s.label} className="text-center" data-testid={`hero-stat-${s.label}`}>
                    <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 70, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-16 relative"
            >
              <div className="absolute inset-x-10 top-4 h-full rounded-3xl bg-primary/10 blur-3xl -z-10" />
              <div className="relative rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/40">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-0.5 rounded-md bg-muted/60 text-xs text-muted-foreground/70 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      ossaiproapp.com/dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { labelKey: "landing.mockOccupancy", value: "87%", change: "+5%", color: "text-emerald-500", bg: "bg-emerald-500/8" },
                      { labelKey: "landing.mockRevenue", value: "$12,450", change: "+12%", color: "text-blue-500", bg: "bg-blue-500/8" },
                      { labelKey: "landing.mockBookings", value: "24", change: "+3", color: "text-violet-500", bg: "bg-violet-500/8" },
                      { labelKey: "landing.mockGuestRating", value: "4.8★", change: "+0.2", color: "text-amber-500", bg: "bg-amber-500/8" },
                    ].map((stat) => (
                      <div key={stat.labelKey} className={`p-4 rounded-xl ${stat.bg} border border-border/30 space-y-1`}>
                        <p className="text-xs text-muted-foreground">{t(stat.labelKey)}</p>
                        <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                        <p className={`text-xs font-semibold ${stat.color}`}>{stat.change}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 h-32 rounded-xl bg-gradient-to-r from-primary/5 to-blue-500/5 border border-border/30 flex items-end justify-around px-4 pb-3 gap-1">
                      {[40, 55, 45, 70, 60, 80, 75, 90, 85, 65, 88, 92].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-primary/20" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="h-32 rounded-xl bg-muted/40 border border-border/30 p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('landing.mockRecentActivity')}</p>
                      {[t('landing.mockCheckin'), t('landing.mockNewBooking'), t('landing.mockServiceRequest')].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                          <span className="text-muted-foreground truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* OTA Integration strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-10 text-center space-y-4"
            >
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-medium">{t('landing.otaStrip')}</p>
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
                {["Booking.com", "Airbnb", "Expedia", "Hotels.com", "Agoda", "Vrbo"].map((name) => (
                  <span key={name} className="text-sm font-semibold text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-300 select-none">
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* VALUE PROPS — THE BUTTON CONCEPT */}
        <section id="capabilities" className="py-24 px-6 relative" data-testid="section-capabilities">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/4 blur-[120px]" />
          </div>
          <div className="relative max-w-5xl mx-auto space-y-12">
            <AnimatedSection>
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">
                  <Activity className="h-3 w-3 mr-1.5" />
                  {t('landing.vp.title')}
                </Badge>
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.vp.subtitle')}
                </h2>
              </div>
            </AnimatedSection>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.01 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {VALUE_PROPS.map((vp) => {
                const Icon = vp.icon;
                return (
                  <motion.div key={vp.tid} variants={fadeUp}>
                    <div
                      className={`group relative p-8 rounded-2xl border border-border/40 bg-gradient-to-br ${vp.gradient} hover:bg-card ${vp.border} hover:border-opacity-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full`}
                      onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
                      data-testid={`card-vp-${vp.tid}`}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-14 h-14 rounded-2xl ${vp.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`h-7 w-7 ${vp.color}`} />
                        </div>
                        <Badge variant="secondary" className="text-xs rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
                          {vp.badge}
                        </Badge>
                      </div>

                      <h3 className="font-heading text-xl font-bold mb-2">{t(vp.titleKey)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t(vp.descKey)}</p>

                      <ul className="space-y-2.5">
                        {vp.features.map((fKey) => (
                          <li key={fKey} className="flex items-center gap-2.5 text-sm">
                            <CheckCircle className={`h-4 w-4 ${vp.color} shrink-0`} />
                            <span>{t(fKey)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className={`mt-6 flex items-center gap-1 text-sm font-medium ${vp.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                        {t('landing.ctaLiveDemo')}
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <AnimatedSection>
          <section className="py-24 px-6 relative" data-testid="section-how-it-works">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-5xl mx-auto space-y-16">
              <div className="text-center space-y-4">
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.howItWorks.title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('landing.howItWorks.subtitle')}</p>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.01 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {[
                  { step: 1, icon: Building2, titleKey: 'landing.howItWorks.step1Title', descKey: 'landing.howItWorks.step1Desc', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { step: 2, icon: Users, titleKey: 'landing.howItWorks.step2Title', descKey: 'landing.howItWorks.step2Desc', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { step: 3, icon: CalendarCheck, titleKey: 'landing.howItWorks.step3Title', descKey: 'landing.howItWorks.step3Desc', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
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
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('landing.demoSubtitle')}</p>
              </div>

              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.01 }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                            <h3 className="font-heading font-semibold">{t(roleNameKey)}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{t(roleDescKey)}</p>
                          <Button
                            className="w-full rounded-xl"
                            variant="outline"
                            disabled={!!demoLoading}
                            asChild
                            data-testid={`button-demo-${role.id}`}
                          >
                            <a href={`/demo?role=${role.id}`} onClick={(e) => { e.stopPropagation(); if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); if (!demoLoading) handleDemoLogin(role.id); }}>
                              {isLoading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('landing.demoEntering')}</>
                              ) : (
                                <>{t('landing.demoExplore', { role: t(roleNameKey) })}<ArrowRight className="ml-2 h-3.5 w-3.5" /></>
                              )}
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Info roles */}
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground font-medium">{t('landing.demo.moreRolesIncluded', 'More roles included:')}</p>
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.01 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DEMO_INFO_ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <motion.div key={role.id} variants={fadeUp}>
                        <Card className="group cursor-pointer transition-all duration-300 border-border/40 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 h-full" onClick={() => handleDemoLogin(role.id)} data-testid={`card-demo-info-${role.id}`}>
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${role.bgClass} flex items-center justify-center`}>
                                <Icon className={`h-5 w-5 ${role.colorClass}`} />
                              </div>
                              <h3 className="font-heading font-semibold text-sm">{t(role.titleKey)}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{t(role.descKey)}</p>
                            <Button className="w-full rounded-xl" variant="outline" size="sm" asChild data-testid={`button-demo-info-${role.id}`}>
                              <a href={`/demo?role=${role.id}`} onClick={(e) => { e.stopPropagation(); if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); handleDemoLogin(role.id); }}>
                                {t('landing.demo.exploreAs', { role: t(role.titleKey) })}<ArrowRight className="ml-1.5 h-3 w-3" />
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Restaurant Ecosystem */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/50" />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">{t('landing.restaurantEcosystem', 'Restaurant Ecosystem')}</span>
                  </div>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.01 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {RESTAURANT_DEMO_ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <motion.div key={role.id} variants={fadeUp}>
                        <Card className="group cursor-pointer transition-all duration-300 border-border/40 hover:border-orange-500/20 hover:shadow-md hover:-translate-y-0.5 h-full" onClick={() => handleDemoLogin(role.id)} data-testid={`card-demo-restaurant-${role.id}`}>
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${role.bgClass} flex items-center justify-center`}>
                                <Icon className={`h-5 w-5 ${role.colorClass}`} />
                              </div>
                              <h3 className="font-heading font-semibold text-sm">{t(role.titleKey)}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{t(role.descKey)}</p>
                            <Button className="w-full rounded-xl" variant="outline" size="sm" asChild data-testid={`button-demo-restaurant-${role.id}`}>
                              <a href={`/demo?role=${role.id}`} onClick={(e) => { e.stopPropagation(); if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); handleDemoLogin(role.id); }}>
                                {t('landing.demo.exploreAs', { role: t(role.titleKey) })}<ArrowRight className="ml-1.5 h-3 w-3" />
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* PRICING — SIMPLIFIED */}
        <AnimatedSection>
          <section id="pricing" className="py-24 px-6 relative" data-testid="section-pricing">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>
            <div className="relative max-w-5xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">{t('landing.pricing')}</Badge>
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1]">
                  {t('landing.simpleTransparentPricing')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('landing.simpleTransparentPricingDesc')}</p>
              </div>

              {corePlans.length > 0 ? (
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.01 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {corePlans.map((plan, idx) => {
                    const isPopular = plan.code === "CORE_GROWTH";
                    const isBest = plan.code === "CORE_PRO";
                    const keyFeatures: string[] = [];
                    if (plan.limits.maxProperties >= 999) keyFeatures.push(t('pricing.unlimitedProperties'));
                    else keyFeatures.push(t('pricing.upToProperties', { count: plan.limits.maxProperties }));
                    if (plan.limits.maxUnitsPerProperty >= 999) keyFeatures.push(t('pricing.unlimitedRooms'));
                    else keyFeatures.push(t('pricing.upToRooms', { count: plan.limits.maxUnitsPerProperty }));
                    if (plan.features.advanced_analytics) keyFeatures.push(t('pricing.coreFeatures.advancedAnalytics'));
                    if (plan.features.priority_support) keyFeatures.push(t('pricing.coreFeatures.prioritySupport'));
                    if (plan.features.custom_integrations) keyFeatures.push(t('pricing.coreFeatures.customIntegrations'));
                    if (!plan.features.advanced_analytics) keyFeatures.push(t('pricing.coreFeatures.reports'));
                    const displayFeatures = keyFeatures.slice(0, 4);

                    return (
                      <motion.div key={plan.code} variants={fadeUp} className="relative">
                        {isPopular && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-primary text-primary-foreground shadow-md">{t('landing.mostPopular')}</Badge>
                          </div>
                        )}
                        <Card className={`h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isPopular ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border-border/40'}`} data-testid={`card-plan-${plan.code}`}>
                          <CardContent className="p-7 space-y-6 flex flex-col h-full">
                            <div>
                              <p className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{plan.displayName}</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold tracking-tight">${plan.priceMonthlyUSD}</span>
                                <span className="text-muted-foreground text-sm">{t('landing.perMonth')}</span>
                              </div>
                            </div>
                            <ul className="space-y-2.5 flex-1">
                              {displayFeatures.map((f, i) => (
                                <li key={i} className="flex items-center gap-2.5 text-sm">
                                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="space-y-2.5 pt-2">
                              <Button
                                className="w-full rounded-xl"
                                variant={isPopular ? "default" : "outline"}
                                onClick={() => navigateToRegister(plan.code)}
                                data-testid={`button-plan-trial-${plan.code}`}
                              >
                                {t('pricing.startFreeTrial')}
                              </Button>
                              <p className="text-center text-xs text-muted-foreground">{t('pricing.trialCheckmark', { days: DEFAULT_TRIAL_DAYS })}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-48 animate-pulse bg-muted/30" />
                  ))}
                </div>
              )}

              {/* Apartment Lite — separate card for individual apartment owners */}
              <AnimatedSection>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium whitespace-nowrap">{t('pricing.apartmentOwners')}</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-sm mx-auto mt-4"
                >
                  <Card
                    className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-border/40 hover:border-teal-500/30"
                    onClick={() => navigateToRegister('APT_LITE')}
                    data-testid="card-plan-APT_LITE"
                  >
                    <CardContent className="p-7 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center">
                          <Home className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="font-heading font-bold text-base">{t('pricing.apartmentLite')}</p>
                          <p className="text-xs text-muted-foreground">{t('pricing.apartmentLiteSub')}</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight">$19</span>
                        <span className="text-muted-foreground text-sm">{t('landing.perMonth')}</span>
                      </div>
                      <ul className="space-y-2.5">
                        {(['guestMgmt', 'smartLock', 'chat', 'doorLogs', 'units'] as const).map((key) => (
                          <li key={key} className="flex items-center gap-2.5 text-sm">
                            <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" />
                            <span>{t(`pricing.apartmentFeatures.${key}`)}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full rounded-xl"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); navigateToRegister('APT_LITE'); }}
                        data-testid="button-plan-trial-APT_LITE"
                      >
                        {t('pricing.startFreeTrial')}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">{t('pricing.trialCheckmark', { days: DEFAULT_TRIAL_DAYS })}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedSection>

              <p className="text-center text-sm text-muted-foreground">{t('landing.allPlansTrialText')}</p>
            </div>
          </section>
        </AnimatedSection>

        {/* STATS */}
        <AnimatedSection>
          <section className="py-16 px-6" data-testid="section-stats">
            <div className="max-w-4xl mx-auto">
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.01 }} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { value: "50+", label: t('landing.stats.hotels'), icon: Building2 },
                  { value: "12", label: t('landing.stats.countries'), icon: Globe },
                  { value: "99.9%", label: t('landing.stats.uptime'), icon: Activity },
                  { value: "24/7", label: t('landing.stats.support'), icon: BarChart3 },
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
            </div>
          </section>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection>
          <section className="py-16 px-6" data-testid="section-faq">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-center">{t('landing.faq.title')}</h2>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {[1, 2, 3].map((i) => (
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

        {/* CTA */}
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
                <Button size="lg" asChild className="rounded-xl shadow-lg shadow-primary/20 h-12 px-8 text-base font-semibold" data-testid="button-cta-register">
                  <a href="/register-hotel" onClick={(e) => { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); navigateToRegister(); }}>
                    {t('landing.registerYourHotel')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl h-12 px-8 text-base" onClick={() => setQuoteDialogOpen(true)} data-testid="button-cta-quote">
                  {t('landing.contactSales')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground/70">
                {t('pricing.trialCheckmark', { days: DEFAULT_TRIAL_DAYS })} &middot; {t('pricing.noCreditCard')}
              </p>
            </div>
          </AnimatedSection>
        </section>

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
