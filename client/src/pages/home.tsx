import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Building2, UtensilsCrossed, ArrowRight, ChevronRight } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

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
      </main>

      <footer className="py-4 px-6 text-center text-xs text-muted-foreground/50 border-t border-border/30">
        &copy; {new Date().getFullYear()} O.S.S (Orange Smart Service) — {t("landing.copyright", "All rights reserved")}
      </footer>
    </div>
  );
}
