import { useLocation } from "wouter";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function TermsOfService() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={t('terms.pageTitle')}
        description={t('terms.pageDescription')}
        path="/terms-of-service"
      />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center gap-3 p-4">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">{t('terms.headerTitle')}</h1>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-terms-title">{t('terms.mainTitle')}</h2>
            <div className="text-sm text-muted-foreground space-y-1 pt-2">
              <p className="font-medium text-foreground">{t('terms.company')}</p>
              <p>{t('terms.location')}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pt-3">
              <p><span className="font-medium text-foreground">{t('terms.softwareProduct')}:</span> {t('terms.softwareProductValue')}</p>
              <p><span className="font-medium text-foreground">{t('terms.serviceProvider')}:</span> {t('terms.serviceProviderValue')}</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
              <p>{t('terms.contractVersion')}</p>
              <p>{t('terms.lastUpdated')}</p>
            </div>
          </div>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s1_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s1_intro')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s1_item1')}</li>
              <li>{t('terms.s1_item2')}</li>
              <li>{t('terms.s1_item3')}</li>
              <li>{t('terms.s1_item4')}</li>
              <li>{t('terms.s1_item5')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s1_cloud')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s2_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s2_intro')}
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium">{t('terms.s2_mainPlans')}</p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Starter</li>
                <li>Growth</li>
                <li>Pro</li>
                <li>Apartment Lite</li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">{t('terms.s2_smartPlans')}</p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Smart Lite</li>
                <li>Smart Pro</li>
                <li>Smart AI</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s2_pricing')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s3_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s3_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s3_p2')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s3_p3')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s4_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s4_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s4_p2')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s4_p3')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s5_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s5_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s5_p2')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s5_p3')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s6_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s6_intro')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s6_item1')}</li>
              <li>{t('terms.s6_item2')}</li>
              <li>{t('terms.s6_item3')}</li>
              <li>{t('terms.s6_item4')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s6_note')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s7_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s7_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s7_p2')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s7_item1')}</li>
              <li>{t('terms.s7_item2')}</li>
              <li>{t('terms.s7_item3')}</li>
              <li>{t('terms.s7_item4')}</li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s8_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s8_intro')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s8_item1')}</li>
              <li>{t('terms.s8_item2')}</li>
              <li>{t('terms.s8_item3')}</li>
              <li>{t('terms.s8_item4')}</li>
              <li>{t('terms.s8_item5')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s8_limit')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s9_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s9_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s9_p2')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s9_item1')}</li>
              <li>{t('terms.s9_item2')}</li>
              <li>{t('terms.s9_item3')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s9_p3')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s10_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s10_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s10_p2')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s10_item1')}</li>
              <li>{t('terms.s10_item2')}</li>
              <li>{t('terms.s10_item3')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s10_p3')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s11_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s11_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s11_p2')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s12_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s12_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s12_p2')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s12_p3')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.s12_item1')}</li>
              <li>{t('terms.s12_item2')}</li>
              <li>{t('terms.s12_item3')}</li>
              <li>{t('terms.s12_item4')}</li>
              <li>{t('terms.s12_item5')}</li>
              <li>{t('terms.s12_item6')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s12_p4')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.s13_title')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s13_p1')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s13_p2')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.s13_p3')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.dataResponsibilityTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.dataResponsibilityText')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.accountTerminationTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.accountTerminationText')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.accountTerminationItem1')}</li>
              <li>{t('terms.accountTerminationItem2')}</li>
              <li>{t('terms.accountTerminationItem3')}</li>
              <li>{t('terms.accountTerminationItem4')}</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.accountTerminationNotice')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.priceChangesTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.priceChangesText')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.priceChangesNotice')}
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t('terms.forceMajeureTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('terms.forceMajeureText')}
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
              <li>{t('terms.forceMajeureItem1')}</li>
              <li>{t('terms.forceMajeureItem2')}</li>
              <li>{t('terms.forceMajeureItem3')}</li>
              <li>{t('terms.forceMajeureItem4')}</li>
              <li>{t('terms.forceMajeureItem5')}</li>
            </ul>
          </section>

          <div className="pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} {t('terms.copyright')}
            </p>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
