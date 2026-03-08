import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GetQuoteDialog } from "@/components/get-quote-dialog";
import { useTranslation } from "react-i18next";
import { Building2, Eye, EyeOff, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/error-handler";
import { SEO } from "@/components/seo";
import { createLoginFormSchema, type LoginForm } from "@/lib/validation";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, logout, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const [switchMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("switch") === "true";
  });
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [logoutStarted, setLogoutStarted] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(createLoginFormSchema()),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function getRedirectForRole(role: string): string {
    switch (role) {
      case "oss_super_admin":
        return "/oss-admin";
      default:
        return "/dashboard";
    }
  }

  useEffect(() => {
    if (switchMode && isAuthenticated && !logoutStarted) {
      setLogoutStarted(true);
      logout().then(() => {
        setLogoutComplete(true);
        window.history.replaceState({}, "", "/login");
      }).catch(() => {
        setLogoutStarted(false);
      });
      return;
    }

    if (switchMode && !isAuthenticated) {
      setLogoutComplete(true);
    }

    if (!switchMode && !logoutComplete && isAuthenticated && user) {
      setLocation(getRedirectForRole(user.role));
    }
  }, [isAuthenticated, user, setLocation, switchMode, logoutStarted, logoutComplete]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const loggedInUser = await login(data.username, data.password);
      toast({
        title: t('auth.welcomeBack'),
        description: t('auth.welcomeBackDesc'),
      });
      if (loggedInUser) {
        setTimeout(() => {
          setLocation(getRedirectForRole(loggedInUser.role));
        }, 100);
      }
    } catch (error: unknown) {
      showErrorToast(toast, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Sign In"
        description="Sign in to your O.S.S Smart Hotel System account. Access your property management dashboard, bookings, and smart room controls."
        path="/login"
        noindex
      />
      <header className="flex items-center justify-between gap-4 p-4 border-b border-border/50">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover-elevate rounded-md p-1 -m-1">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">O.S.S</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {(switchMode && !logoutComplete) ? (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">{t('auth.switchingAccount', 'Switching account...')}</p>
          </div>
        ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">{t('auth.loginTitle', 'Sign In')}</CardTitle>
            <CardDescription>
              {t('auth.loginSubtitle', 'Enter your credentials to access your account')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.username', 'Username')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('auth.enterUsername', 'Enter your username')}
                          {...field}
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.password', 'Password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.enterPassword', 'Enter your password')}
                            {...field}
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Link href="/forgot-password">
                    <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                      {t('auth.forgotPassword')}
                    </span>
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-submit-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signIn')
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.contactHotel')}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setQuoteDialogOpen(true)}
                data-testid="button-get-quote"
              >
                <FileText className="mr-2 h-4 w-4" />
                {t('quote.getQuote', 'Get a Quote')}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        <GetQuoteDialog
          open={quoteDialogOpen}
          onOpenChange={setQuoteDialogOpen}
          sourcePage="Login"
        />
      </main>
    </div>
  );
}
