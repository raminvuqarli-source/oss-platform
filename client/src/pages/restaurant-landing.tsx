import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GetQuoteDialog } from "@/components/get-quote-dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  UtensilsCrossed, Check, ArrowRight, ChevronLeft, Zap,
  Monitor, QrCode, BarChart3, Cloud, Layers, Users,
  Activity, HeadphonesIcon, MessageCircle, Star, Phone,
  ShoppingBag, ChefHat, Wallet, RefreshCw, Play, Loader2,
  Sparkles, CreditCard,
} from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/994508880089";

const PLANS = [
  {
    code: "REST_CAFE",
    nameKey: "restLanding.planStandard",
    name: "Standard",
    priceUSD: 29,
    descKey: "restLanding.planStandardDesc",
    desc: "Perfect for small cafés & quick-service restaurants",
    features: [
      { icon: Monitor, key: "restLanding.feat1Pos", label: "1 POS Terminal" },
      { icon: QrCode, key: "restLanding.featQrMenu", label: "QR Menu" },
      { icon: BarChart3, key: "restLanding.featSalesReports", label: "Sales Reports" },
      { icon: Cloud, key: "restLanding.featCloudStorage", label: "Cloud Storage" },
    ],
    popular: false,
    cta: "register",
    ctaKey: "restLanding.register",
    ctaLabel: "Get Started",
  },
  {
    code: "REST_BISTRO",
    nameKey: "restLanding.planPro",
    name: "Professional",
    priceUSD: 49,
    descKey: "restLanding.planProDesc",
    desc: "For growing restaurants that need more power",
    features: [
      { icon: Layers, key: "restLanding.featUnlimitedPos", label: "Unlimited POS Terminals" },
      { icon: QrCode, key: "restLanding.featQrMenu", label: "QR Menu" },
      { icon: Users, key: "restLanding.featWaiterPanel", label: "Waiter Panel" },
      { icon: Activity, key: "restLanding.featAdvancedAnalytics", label: "Advanced Analytics" },
    ],
    popular: true,
    cta: "register",
    ctaKey: "restLanding.register",
    ctaLabel: "Get Started",
  },
  {
    code: "REST_CHAIN",
    nameKey: "restLanding.planEnterprise",
    name: "Enterprise",
    priceUSD: null,
    descKey: "restLanding.planEnterpriseDesc",
    desc: "Custom solution for restaurant chains & franchises",
    features: [
      { icon: Layers, key: "restLanding.featMultiLocation", label: "Multi-location Support" },
      { icon: HeadphonesIcon, key: "restLanding.featPrioritySupport", label: "Priority Support" },
      { icon: RefreshCw, key: "restLanding.featCustomIntegrations", label: "Custom Integrations" },
      { icon: Users, key: "restLanding.featUnlimitedStaff", label: "Unlimited Staff" },
    ],
    popular: false,
    cta: "contact",
    ctaKey: "restLanding.contactUs",
    ctaLabel: "Contact Us",
  },
];

const FEATURES = [
  {
    icon: ShoppingBag,
    titleKey: "restLanding.featureOrderTitle",
    title: "Order Management",
    descKey: "restLanding.featureOrderDesc",
    desc: "Real-time order tracking from table to kitchen to delivery",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: ChefHat,
    titleKey: "restLanding.featureKdsTitle",
    title: "Kitchen Display System",
    descKey: "restLanding.featureKdsDesc",
    desc: "Live kitchen screen with WebSocket push — no more paper tickets",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: QrCode,
    titleKey: "restLanding.featureQrTitle",
    title: "Digital QR Menu",
    descKey: "restLanding.featureQrDesc",
    desc: "Guests scan and order from their own phone — no app required",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Wallet,
    titleKey: "restLanding.featureCashierTitle",
    title: "Cashier & Settlements",
    descKey: "restLanding.featureCashierDesc",
    desc: "Cash, card, or split payments — quick settlements and receipts",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: BarChart3,
    titleKey: "restLanding.featureAnalyticsTitle",
    title: "Sales Analytics",
    descKey: "restLanding.featureAnalyticsDesc",
    desc: "Daily, monthly and all-time revenue — breakdown by payment type",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Users,
    titleKey: "restLanding.featureTeamTitle",
    title: "Team Management",
    descKey: "restLanding.featureTeamDesc",
    desc: "Manage waiters, kitchen staff, cleaners and cashiers in one place",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const DEMO_ROLES = [
  {
    id: "restaurant_manager",
    icon: UtensilsCrossed,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "hover:border-orange-500/40",
    titleKey: "restLanding.demoManager",
    title: "Restaurant Manager",
    descKey: "restLanding.demoManagerDesc",
    desc: "Full dashboard: orders, staff, menu, finance & analytics",
  },
  {
    id: "kitchen",
    icon: ChefHat,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "hover:border-red-500/40",
    titleKey: "restLanding.demoKitchen",
    title: "Kitchen Staff",
    descKey: "restLanding.demoKitchenDesc",
    desc: "Live kitchen display — accept and prepare incoming orders",
  },
  {
    id: "waiter",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "hover:border-amber-500/40",
    titleKey: "restLanding.demoWaiter",
    title: "Waiter",
    descKey: "restLanding.demoWaiterDesc",
    desc: "Table management, order delivery and guest service",
  },
  {
    id: "restaurant_cleaner",
    icon: Sparkles,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/40",
    titleKey: "restLanding.demoCleaner",
    title: "Cleaning Staff",
    descKey: "restLanding.demoCleanerDesc",
    desc: "Cleaning tasks with photo verification and status tracking",
  },
  {
    id: "restaurant_cashier",
    icon: CreditCard,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "hover:border-green-500/40",
    titleKey: "restLanding.demoCashier",
    title: "Cashier",
    descKey: "restLanding.demoCashierDesc",
    desc: "Settle bills, process payments and view daily revenue",
  },
];

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function RestaurantLanding() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleDemoLogin = async (role: string) => {
    setDemoLoading(role);
    try {
      const response = await apiRequest("POST", "/api/auth/demo-login", { role });
      const data = await response.json();
      if (data._demoToken) {
        // store token if needed
      }
      const { _demoToken: _t, ...user } = data;
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "/api/auth/me" });
      queryClient.setQueryData(["/api/auth/me"], user);
      navigate(`/demo?role=${role}`);
    } catch {
      toast({
        title: t("common.error", "Error"),
        description: t("restLanding.demoFailed", "Demo login failed. Please try again."),
        variant: "destructive",
      });
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Restaurant POS System — O.S.S"
        description="Standalone Restaurant POS — orders, kitchen display, QR menu, cashier & analytics. Starting at $29/month."
        path="/restaurant"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">O.S.S POS</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-features">
              {t("landing.features", "Features")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-pricing">
              {t("landing.pricing", "Pricing")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-nav-demo" className="text-orange-500 hover:text-orange-600">
              <Play className="h-3.5 w-3.5 mr-1.5" />
              {t("restLanding.demoTryLive", "Try Live Demo")}
            </Button>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} data-testid="button-login">
              {t("auth.signIn", "Sign In")}
            </Button>
            <Button size="sm" onClick={() => navigate("/register-restaurant")} className="bg-orange-500 hover:bg-orange-600 text-white border-0" data-testid="button-start-trial">
              {t("restLanding.startTrial", "Start Free Trial")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* HERO */}
        <section className="relative overflow-hidden pt-20 pb-28 px-6">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-orange-500/6 blur-[120px]" />
          </div>
          <div className="relative max-w-5xl mx-auto text-center space-y-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-orange-500/20 text-orange-500 mb-2">
                <Zap className="h-3 w-3 mr-1.5" />
                {t("restLanding.badge", "Restaurant POS & Management System")}
              </Badge>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight mt-4">
                {t("restLanding.heroTitle1", "Run your restaurant")}
                <br />
                <span className="text-orange-500">{t("restLanding.heroTitle2", "smarter & faster")}</span>
              </h1>
              <p className="text-xl text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
                {t("restLanding.heroDesc", "Complete POS system with kitchen display, digital menu, cashier & real-time analytics. No hardware required.")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button size="lg" onClick={() => navigate("/register-restaurant")} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20" data-testid="button-hero-trial">
                  {t("restLanding.startFreeTrial", "Start 14-Day Free Trial")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl border-orange-500/40 text-orange-500 hover:bg-orange-500/10" data-testid="button-hero-demo">
                  <Play className="mr-2 h-4 w-4" />
                  {t("restLanding.demoTryLive", "Try Live Demo")}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground/60 mt-3">{t("restLanding.noCreditCard", "No credit card required · Cancel anytime")}</p>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features-section" className="py-20 px-6 bg-muted/20">
          <AnimatedSection className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">{t("restLanding.featuresTitle", "Everything your restaurant needs")}</h2>
              <p className="text-muted-foreground mt-2">{t("restLanding.featuresSubtitle", "Built for modern restaurants — from small cafés to large chains")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <Card className="border-border/50 hover:border-orange-500/30 transition-colors duration-300" data-testid={`card-feature-${i}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className={`inline-flex p-2.5 rounded-lg ${f.bg}`}>
                        <f.icon className={`h-5 w-5 ${f.color}`} />
                      </div>
                      <h3 className="font-semibold">{t(f.titleKey, f.title)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey, f.desc)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* PRICING */}
        <section id="pricing-section" className="py-20 px-6">
          <AnimatedSection className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">{t("restLanding.pricingTitle", "Simple, transparent pricing")}</h2>
              <p className="text-muted-foreground mt-2">{t("restLanding.pricingSubtitle", "Start with a 14-day free trial on any plan. No credit card required.")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-0 right-0 flex justify-center">
                      <Badge className="bg-orange-500 text-white text-xs px-3">
                        <Star className="h-3 w-3 mr-1" />
                        {t("restLanding.popular", "Most Popular")}
                      </Badge>
                    </div>
                  )}
                  <Card className={`h-full flex flex-col border-2 transition-all duration-300 ${plan.popular ? "border-orange-500 shadow-lg shadow-orange-500/10" : "border-border hover:border-orange-500/40"}`} data-testid={`card-plan-${plan.code.toLowerCase()}`}>
                    <CardContent className="p-6 flex flex-col h-full gap-4">
                      <div>
                        <h3 className="text-xl font-bold">{t(plan.nameKey, plan.name)}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t(plan.descKey, plan.desc)}</p>
                      </div>

                      <div className="flex items-baseline gap-1">
                        {plan.priceUSD !== null ? (
                          <>
                            <span className="text-4xl font-extrabold">${plan.priceUSD}</span>
                            <span className="text-muted-foreground text-sm">{t("restLanding.perMonth", "/ month")}</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-orange-500">{t("restLanding.contactForPrice", "Contact Us")}</span>
                        )}
                      </div>

                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map(f => (
                          <li key={f.key} className="flex items-center gap-2.5 text-sm">
                            <div className="shrink-0 h-5 w-5 rounded-full bg-orange-500/10 flex items-center justify-center">
                              <Check className="h-3 w-3 text-orange-500" />
                            </div>
                            <span>{t(f.key, f.label)}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full mt-2 ${plan.popular ? "bg-orange-500 hover:bg-orange-600 text-white border-0" : ""}`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => {
                          if (plan.cta === "contact") {
                            window.open(WHATSAPP_LINK, "_blank");
                          } else {
                            navigate(`/register-restaurant?plan=${plan.code}`);
                          }
                        }}
                        data-testid={`button-plan-${plan.code.toLowerCase()}`}
                      >
                        {plan.cta === "contact" ? (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {t(plan.ctaKey, plan.ctaLabel)}
                          </>
                        ) : (
                          <>
                            {t(plan.ctaKey, plan.ctaLabel)}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              {t("restLanding.pricingNote", "All prices in USD. Local currency (AZN) available at checkout. VAT may apply.")}
            </p>
          </AnimatedSection>
        </section>

        {/* DEMO SECTION */}
        <section id="demo-section" className="py-20 px-6 bg-muted/20" data-testid="section-demo">
          <AnimatedSection className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-orange-500/20 text-orange-500">
                <Play className="h-3 w-3 mr-1.5" />
                {t("restLanding.demoBadge", "Live Demo")}
              </Badge>
              <h2 className="text-3xl font-bold">{t("restLanding.demoTitle", "Try the Restaurant Demo")}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("restLanding.demoSubtitle", "Experience the full O.S.S POS system live — no sign-up, no credit card.")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_ROLES.map((role, i) => {
                const Icon = role.icon;
                const isLoading = demoLoading === role.id;
                const title = t(role.titleKey, role.title);
                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                  >
                    <Card
                      className={`group cursor-pointer transition-all duration-300 border-border/50 ${role.border} hover:shadow-md hover:-translate-y-0.5 h-full`}
                      onClick={() => !demoLoading && handleDemoLogin(role.id)}
                      data-testid={`card-demo-${role.id}`}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${role.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-5 w-5 ${role.color}`} />
                          </div>
                          <h3 className="font-semibold text-sm">{title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t(role.descKey, role.desc)}</p>
                        <Button
                          className="w-full"
                          variant="outline"
                          size="sm"
                          disabled={!!demoLoading}
                          onClick={(e) => { e.stopPropagation(); handleDemoLogin(role.id); }}
                          data-testid={`button-demo-${role.id}`}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {t("restLanding.demoExplore", "Explore as {{role}}", { role: title })}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground/60 mt-8 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("restLanding.demoReadOnly", "Demo data resets automatically. No real data is affected.")}
            </p>
          </AnimatedSection>
        </section>

        {/* CTA BANNER */}
        <section className="py-16 px-6 bg-orange-500/5 border-y border-orange-500/10">
          <AnimatedSection className="max-w-2xl mx-auto text-center space-y-5">
            <h2 className="text-3xl font-bold">{t("restLanding.ctaTitle", "Ready to modernize your restaurant?")}</h2>
            <p className="text-muted-foreground">{t("restLanding.ctaDesc", "Join hundreds of restaurants using O.S.S POS to streamline operations and grow revenue.")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/register-restaurant")} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0" data-testid="button-cta-trial">
                {t("restLanding.startFreeTrial", "Start 14-Day Free Trial")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open(WHATSAPP_LINK, "_blank")} className="rounded-xl" data-testid="button-cta-whatsapp">
                <Phone className="mr-2 h-4 w-4" />
                {t("restLanding.talkToUs", "Talk to Us on WhatsApp")}
              </Button>
            </div>
          </AnimatedSection>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold">O.S.S POS</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
            <a href="https://wa.me/994508880089" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> +994 50 888 00 89
            </a>
            <a href="mailto:info@ossaipro.com" className="hover:text-foreground transition-colors">info@ossaipro.com</a>
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} O.S.S — {t("landing.copyright", "All rights reserved")}
          </p>
        </div>
      </footer>

      <GetQuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} sourcePage="RestaurantLanding" />
    </div>
  );
}
