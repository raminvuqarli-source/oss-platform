import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

export default function JoinTeam() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<"loading" | "valid" | "used" | "invalid">("loading");

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }, []);

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    fetch(`/api/staff/validate-invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setTokenStatus("valid");
        } else {
          const data = await res.json().catch(() => ({}));
          if (data.status === "accepted") {
            setTokenStatus("used");
          } else {
            setTokenStatus("invalid");
          }
        }
      })
      .catch(() => {
        setTokenStatus("invalid");
      });
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!token || !username || !password || !fullName) {
      toast({ title: t('joinTeam.allFieldsRequired'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/staff/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, username, password, fullName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('joinTeam.failedToAccept'));
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t('joinTeam.welcomeToTeam'), description: t('joinTeam.accountCreated') });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
            <Skeleton className="h-5 w-48 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenStatus === "used") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="font-medium">{t('joinTeam.alreadyAccepted', 'Invitation Already Accepted')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('joinTeam.alreadyAcceptedDesc', 'This invitation has already been used. Please log in with your account.')}</p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/login")} data-testid="button-go-login">
              {t('joinTeam.signIn', 'Sign In')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenStatus === "invalid" || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium">{t('joinTeam.invalidLink')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('joinTeam.invalidLinkDesc')}</p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/login")} data-testid="button-go-login">
              {t('joinTeam.goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{t('joinTeam.title')}</CardTitle>
          <CardDescription>{t('joinTeam.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-fullname">{t('joinTeam.fullName')}</Label>
            <Input
              id="join-fullname"
              placeholder={t('joinTeam.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              data-testid="input-join-fullname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-username">{t('joinTeam.username')}</Label>
            <Input
              id="join-username"
              placeholder={t('joinTeam.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-join-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-password">{t('joinTeam.password')}</Label>
            <Input
              id="join-password"
              type="password"
              placeholder={t('joinTeam.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-join-password"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleAcceptInvite}
            disabled={isLoading || !username || !password || !fullName}
            data-testid="button-accept-invite"
          >
            {isLoading ? t('joinTeam.creatingAccount') : t('joinTeam.joinTeam')}
            {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t('joinTeam.alreadyHaveAccount')}{" "}
            <button className="underline text-primary" onClick={() => setLocation("/login")} data-testid="link-login">
              {t('joinTeam.signIn')}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
