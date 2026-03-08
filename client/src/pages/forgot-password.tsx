import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, Loader2, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import { createEmailSchema } from "@/lib/validation";

function createForgotPasswordSchema() {
  return z.object({
    email: createEmailSchema(),
  });
}

type ForgotPasswordForm = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(createForgotPasswordSchema()),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", data);
      setEmailSent(true);
      toast({
        title: t('auth.emailSent', 'Email sent'),
        description: t('auth.passwordResetInstructions', 'If an account exists with this email, you will receive password reset instructions.'),
      });
    } catch (error) {
      showErrorToast(toast, error);
    } finally {
      setIsLoading(false);
    }
  };

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
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword', 'Forgot Password')}</CardTitle>
            <CardDescription>
              {emailSent 
                ? t('auth.checkEmail', 'Check your email for reset instructions')
                : t('auth.forgotPasswordDesc', "Enter your email and we'll send you reset instructions")
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.passwordResetInstructions', 'If an account exists with the email you provided, you will receive password reset instructions shortly.')}
                </p>
                <Link href="/login">
                  <Button className="w-full" data-testid="button-back-to-login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('auth.backToSignIn', 'Back to Sign In')}
                  </Button>
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.email', 'Email Address')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('auth.enterEmail', 'Enter your email')}
                            {...field}
                            data-testid="input-email"
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
                    data-testid="button-submit-forgot-password"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.sending', 'Sending...')}
                      </>
                    ) : (
                      t('auth.sendResetInstructions', 'Send Reset Instructions')
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {!emailSent && (
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
