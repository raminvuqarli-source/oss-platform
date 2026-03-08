import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Privacy Policy"
        description="Learn how O.S.S Smart Hotel System collects, uses, stores, and protects your personal data. Read our full privacy policy covering data security, cookies, and your rights."
        path="/privacy-policy"
      />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center gap-3 p-4">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/")} data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">{t('legal.privacyPolicy')}</h1>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold" data-testid="text-privacy-title">{t('legal.privacyPolicy')}</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-privacy-updated">{t('legal.lastUpdated')}: {t('legal.lastUpdatedDate')}</p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.introTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.introText')}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.dataCollectionTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.dataCollectionText')}</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>{t('legal.privacy.dataItem1')}</li>
              <li>{t('legal.privacy.dataItem2')}</li>
              <li>{t('legal.privacy.dataItem3')}</li>
              <li>{t('legal.privacy.dataItem4')}</li>
              <li>{t('legal.privacy.dataItem5')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.dataUseTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.dataUseText')}</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>{t('legal.privacy.useItem1')}</li>
              <li>{t('legal.privacy.useItem2')}</li>
              <li>{t('legal.privacy.useItem3')}</li>
              <li>{t('legal.privacy.useItem4')}</li>
              <li>{t('legal.privacy.useItem5')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.dataSharingTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.dataSharingText')}</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>{t('legal.privacy.shareItem1')}</li>
              <li>{t('legal.privacy.shareItem2')}</li>
              <li>{t('legal.privacy.shareItem3')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.dataSecurityTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.dataSecurityText')}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.cookiesTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.cookiesText')}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.retentionTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.retentionText')}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.rightsTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.rightsText')}</p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>{t('legal.privacy.rightItem1')}</li>
              <li>{t('legal.privacy.rightItem2')}</li>
              <li>{t('legal.privacy.rightItem3')}</li>
              <li>{t('legal.privacy.rightItem4')}</li>
              <li>{t('legal.privacy.rightItem5')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.changesTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.changesText')}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">{t('legal.privacy.contactTitle')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('legal.privacy.contactText')}</p>
            <p className="text-sm text-muted-foreground">
              info@ossaipro.com
            </p>
          </section>

          <div className="pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} O.S.S Smart Hotel System
            </p>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
