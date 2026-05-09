import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Building2, UtensilsCrossed, ArrowRight, ChevronRight,
  Download, Monitor, CheckCircle, Globe, Share, Plus, ExternalLink,
} from "lucide-react";
import { SiApple, SiAndroid } from "react-icons/si";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export default function Home() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

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

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <SEO
        title="O.S.S — Smart Management Platform"
        description="O.S.S — Smart management system for hotels and restaurants. Choose your module."
        path="/"
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs tracking-tight">OSS</span>
          </div>
          <span className="font-bold text-lg tracking-tight">O.S.S</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")} data-testid="button-sign-in">
            {t("auth.signIn", "Sign In")}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 mb-12"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest">
            {t("home.welcome", "Welcome to O.S.S")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            {t("home.title", "What are you managing?")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {t("home.subtitle", "Choose your module to get started with the right tools for your business.")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* HOTEL card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              onClick={() => navigate("/hotel")}
              className="group relative w-full h-64 rounded-2xl border-2 border-border hover:border-primary bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 text-left"
              data-testid="button-choose-hotel"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6">
                <div className="p-5 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300 ring-1 ring-primary/20">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight">{t("home.hotel", "HOTEL")}</h2>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {t("home.hotelDesc", "Full property management system — rooms, bookings, staff, guests & more")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {t("home.getStarted", "Get Started")} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          </motion.div>

          {/* RESTORAN card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={() => navigate("/restaurant")}
              className="group relative w-full h-64 rounded-2xl border-2 border-border hover:border-orange-500 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 text-left"
              data-testid="button-choose-restaurant"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6">
                <div className="p-5 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/15 transition-colors duration-300 ring-1 ring-orange-500/20">
                  <UtensilsCrossed className="h-10 w-10 text-orange-500" />
                </div>
                <div className="text-center space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight">{t("home.restaurant", "RESTORAN")}</h2>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {t("home.restaurantDesc", "Standalone POS system — orders, menu, kitchen display, cashier & analytics")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {t("home.getStarted", "Get Started")} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span>{t("home.alreadyHave", "Already have an account?")}</span>
          <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate("/login")} data-testid="button-login-link">
            {t("auth.signIn", "Sign In")} <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </motion.div>

        {/* PWA Install Section */}
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-5xl mt-20 pt-12 border-t border-border/20"
          data-testid="section-download-app"
        >
          <div className="text-center mb-10 space-y-3">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium gap-1.5">
              <Download className="h-3 w-3" />
              {t('landing.pwaProgressiveWebApp', 'Progressive Web App')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('landing.pwaTitle', 'Install OSS on Your Device')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('landing.pwaSubtitle', 'No app store needed. Install directly from your browser — works on all platforms, offline-ready.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Windows */}
            <Card className="border border-border/50 bg-card/60 hover:shadow-md transition-shadow duration-200" data-testid="card-pwa-windows">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Monitor className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="font-semibold text-sm">Windows</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-primary/30 text-primary bg-primary/5">
                    {t('landing.pwaYourDevice', 'Your device')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Chrome / Edge</p>
                {installStatus === "accepted" ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('landing.pwaInstalled', 'Installed!')}</span>
                  </div>
                ) : installStatus === "needs_browser" ? (
                  <Button variant="outline" size="sm" className="w-full rounded-lg text-xs gap-1.5" data-testid="button-open-browser" onClick={openInBrowser}>
                    <ExternalLink className="h-3.5 w-3.5" /> {t('landing.pwaOpenInBrowser', 'Open in Browser')}
                  </Button>
                ) : installStatus === "use_menu" ? (
                  <div className="text-xs text-muted-foreground p-2.5 rounded-lg bg-muted/60 border border-border/30 text-center leading-snug">
                    {t('landing.pwaUseMenu', 'Use browser menu → "Install app"')}
                  </div>
                ) : (
                  <Button className="w-full rounded-lg" size="sm" data-testid="button-install-windows" onClick={triggerInstall}>
                    <Download className="h-4 w-4 mr-2" /> {t('landing.pwaInstallNow', 'Install Now')}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Mac */}
            <Card className="border border-border/50 bg-card/60 hover:shadow-md transition-shadow duration-200" data-testid="card-pwa-mac">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-500/10">
                    <SiApple className="text-slate-600 dark:text-slate-300 text-xl" />
                  </div>
                  <span className="font-semibold text-sm">Mac</span>
                </div>
                <p className="text-xs text-muted-foreground">Chrome / Safari</p>
                <Button className="w-full rounded-lg" size="sm" data-testid="button-install-mac" onClick={triggerInstall}>
                  <Download className="h-4 w-4 mr-2" /> {t('landing.pwaInstallNow', 'Install Now')}
                </Button>
              </CardContent>
            </Card>

            {/* Android */}
            <Card className="border border-border/50 bg-card/60 hover:shadow-md transition-shadow duration-200" data-testid="card-pwa-android">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <SiAndroid className="text-green-500 text-xl" />
                  </div>
                  <span className="font-semibold text-sm">Android</span>
                </div>
                <p className="text-xs text-muted-foreground">Chrome browser</p>
                <Button className="w-full rounded-lg" size="sm" data-testid="button-install-android" onClick={triggerInstall}>
                  <Download className="h-4 w-4 mr-2" /> {t('landing.pwaInstallNow', 'Install Now')}
                </Button>
              </CardContent>
            </Card>

            {/* iPhone / iPad */}
            <Card className="border border-border/50 bg-card/60 hover:shadow-md transition-shadow duration-200" data-testid="card-pwa-ios">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-500/10">
                    <SiApple className="text-slate-600 dark:text-slate-300 text-xl" />
                  </div>
                  <span className="font-semibold text-sm">iPhone / iPad</span>
                </div>
                <p className="text-xs text-muted-foreground">Safari browser</p>
                {showIOSSteps ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border/30">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary">1</div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Share className="h-4 w-4 text-blue-500" />
                        <span>{t('landing.pwaIOSStep1', 'Tap the Share icon')}</span>
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
                  <Button className="w-full rounded-lg" size="sm" data-testid="button-install-ios" onClick={() => setShowIOSModal(true)}>
                    <Download className="h-4 w-4 mr-2" /> {t('landing.pwaInstallNow', 'Install Now')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-8">
            {t('landing.pwaWorksOffline', 'Works offline · No app store required · Always up to date')}
          </p>

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
        </motion.section>
      </main>

      <footer className="py-4 px-6 text-center text-xs text-muted-foreground/50 border-t border-border/30 mt-12">
        &copy; {new Date().getFullYear()} O.S.S (Orange Smart Service) — {t("landing.copyright", "All rights reserved")}
      </footer>
    </div>
  );
}
