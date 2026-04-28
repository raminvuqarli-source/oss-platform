import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { Building2, Users, TrendingUp, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReferredHotel {
  ownerId: string;
  companyName: string;
  email: string;
  joinedAt: string | null;
  status: string;
  properties: { name: string; type: string; city: string; country: string; totalUnits: number }[];
  plan: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  isTrial: boolean;
}

interface MarketingProfile {
  id: string;
  fullName: string;
  email: string | null;
  referralCode: string | null;
}

export default function MarketingDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: profile } = useQuery<MarketingProfile>({
    queryKey: ["/api/marketing/me"],
  });

  const { data: hotels, isLoading } = useQuery<ReferredHotel[]>({
    queryKey: ["/api/marketing/my-hotels"],
  });

  const copyCode = () => {
    if (!profile?.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode);
    setCopied(true);
    toast({ title: t("common.copied", "Copied!"), description: profile.referralCode });
    setTimeout(() => setCopied(false), 2000);
  };

  const activeHotels = hotels?.filter(h => h.subscriptionStatus === "active" && !h.isTrial) ?? [];
  const trialHotels = hotels?.filter(h => h.isTrial) ?? [];
  const totalProperties = hotels?.reduce((sum, h) => sum + h.properties.length, 0) ?? 0;

  const statusBadge = (hotel: ReferredHotel) => {
    if (hotel.isTrial) return <Badge className="bg-blue-500 text-white text-xs">Trial</Badge>;
    if (hotel.subscriptionStatus === "active") return <Badge className="bg-green-600 text-white text-xs">Active</Badge>;
    return <Badge variant="secondary" className="text-xs">{hotel.subscriptionStatus}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">M</div>
          <div>
            <h1 className="font-semibold text-sm">O.S.S Marketing Panel</h1>
            <p className="text-xs text-muted-foreground">{profile?.fullName || user?.fullName}</p>
          </div>
        </div>
        <a href="/api/auth/logout" className="text-xs text-muted-foreground hover:text-foreground">Sign out</a>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Referral Code Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t("marketing.yourReferralCode", "Your Referral Code")}</p>
              {profile?.referralCode ? (
                <p className="text-2xl font-bold font-mono tracking-widest">{profile.referralCode}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("marketing.noCodeYet", "Code not assigned yet — contact your manager")}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t("marketing.shareCode", "Share this code with hotels during registration")}</p>
            </div>
            {profile?.referralCode && (
              <Button variant="outline" size="sm" onClick={copyCode} className="gap-2 shrink-0" data-testid="button-copy-code">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t("common.copied", "Copied!") : t("common.copy", "Copy")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{hotels?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("marketing.totalReferred", "Total Referred")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{activeHotels.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("marketing.activePaid", "Active & Paid")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{trialHotels.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("marketing.inTrial", "In Trial")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Hotels List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("marketing.referredHotels", "Referred Hotels")}
            </CardTitle>
            <CardDescription>{t("marketing.referredHotelsDesc", "Hotels that registered using your referral code")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : hotels && hotels.length > 0 ? (
              <div className="divide-y">
                {hotels.map((hotel) => (
                  <div key={hotel.ownerId} className="px-4 py-3 flex items-start justify-between gap-3" data-testid={`hotel-row-${hotel.ownerId}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{hotel.companyName}</p>
                        {statusBadge(hotel)}
                        {hotel.plan && (
                          <Badge variant="outline" className="text-xs capitalize">{hotel.plan.replace("_", " ")}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{hotel.email}</p>
                      {hotel.properties.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {hotel.properties.map(p => `${p.name} (${p.city})`).join(" · ")}
                        </p>
                      )}
                      {hotel.isTrial && hotel.trialEndsAt && (
                        <p className="text-xs text-yellow-600 mt-0.5">
                          {t("marketing.trialEnds", "Trial ends")}: {new Date(hotel.trialEndsAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {hotel.joinedAt ? new Date(hotel.joinedAt).toLocaleDateString() : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hotel.properties.length} {t("marketing.hotels", "hotel(s)")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t("marketing.noHotels", "No hotels referred yet")}</p>
                <p className="text-xs mt-1">{t("marketing.shareCodeHint", "Share your referral code with potential customers")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
