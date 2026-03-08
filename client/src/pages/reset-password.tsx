import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, Loader2, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
      toast({
        title: t('auth.passwordReset', 'Password Reset'),
        description: t('auth.passwordResetSuccess', 'Your password has been reset successfully.'),
      });
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center justify-between gap-4 p-4 border-b border-border/50">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover-elevate rounded-md p-1 -m-1">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight">O.S.S</span>
            </div>
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">{t('auth.invalidLink', 'Invalid Reset Link')}</CardTitle>
              <CardDescription>
                {t('auth.invalidLinkDesc', 'This password reset link is invalid or has expired. Please request a new one.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/forgot-password">
                <Button className="w-full" data-testid="button-request-new-link">
                  {t('auth.requestNewLink', 'Request New Link')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-4 p-4 border-b border-border/50">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover-elevate rounded-md p-1 -m-1">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">O.S.S</span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              {isSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <KeyRound className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSuccess
                ? t('auth.passwordReset', 'Password Reset')
                : t('auth.setNewPassword', 'Set New Password')
              }
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? t('auth.passwordResetSuccess', 'Your password has been reset successfully.')
                : t('auth.setNewPasswordDesc', 'Enter your new password below')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <Link href="/login">
                <Button className="w-full" data-testid="button-go-to-login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('auth.backToSignIn', 'Back to Sign In')}
                </Button>
              </Link>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.newPassword', 'New Password')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('auth.enterNewPassword', 'Enter new password')}
                            {...field}
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.confirmPassword', 'Confirm Password')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('auth.confirmNewPassword', 'Confirm new password')}
                            {...field}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-reset-password"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.resetting', 'Resetting...')}
                      </>
                    ) : (
                      t('auth.resetPassword', 'Reset Password')
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {!isSuccess && (
              <div className="mt-6 text-center">
                <Link href="/login">
                  <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-back-to-login">
                    <ArrowLeft className="inline h-3 w-3 mr-1" />
                    {t('auth.backToSignIn', 'Back to Sign In')}
                  </span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
