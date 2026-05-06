import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/error-handler";
import { fireLeadConversion } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, Check } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

function createQuoteFormSchema(t: (key: string) => string) {
  return z.object({
    hotelName: z.string().min(2, t("quote.hotelNameRequired")),
    contactName: z.string().min(2, t("quote.contactNameRequired")),
    phone: z.string().min(8, t("quote.phoneRequired")),
    email: z.string().email(t("quote.emailRequired")),
    country: z.string().min(2, t("quote.countryRequired")),
    city: z.string().min(2, t("quote.cityRequired")),
    preferredContactHours: z.string().optional(),
    timezone: z.string().optional(),
    preferredContactMethod: z.string().optional(),
    totalRooms: z.number().min(1).optional().or(z.string().transform((v) => v ? parseInt(v) : undefined)),
    expectedSmartRooms: z.number().min(1).optional().or(z.string().transform((v) => v ? parseInt(v) : undefined)),
    interestedFeatures: z.array(z.string()).optional(),
    message: z.string().optional(),
  });
}

type QuoteFormValues = z.infer<ReturnType<typeof createQuoteFormSchema>>;

const FEATURE_IDS = [
  "door_locks",
  "room_controls",
  "stay_preparation",
  "service_requests",
  "chat_support",
  "ai_assistant",
  "financial_management",
  "analytics",
  "multi_language",
];

const CONTACT_METHOD_IDS = [
  "phone",
  "email",
  "whatsapp",
  "video_call",
];

const TIMEZONE_VALUES = [
  "UTC+0",
  "UTC+1",
  "UTC+2",
  "UTC+3",
  "UTC+4",
  "UTC+5",
  "UTC+8",
  "UTC-5",
  "UTC-8",
];

interface GetQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePage: "Landing" | "Login" | "Admin";
}

export function GetQuoteDialog({ open, onOpenChange, sourcePage }: GetQuoteDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const quoteFormSchema = useMemo(() => createQuoteFormSchema(t), [t]);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      hotelName: "",
      contactName: "",
      phone: "",
      email: "",
      country: "",
      city: "",
      preferredContactHours: "",
      timezone: "",
      preferredContactMethod: "",
      totalRooms: undefined,
      expectedSmartRooms: undefined,
      interestedFeatures: [],
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      const response = await apiRequest("POST", "/api/quote-requests", {
        ...data,
        interestedFeatures: selectedFeatures,
        sourcePage,
        language: i18n.language,
      });
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      fireLeadConversion();
      toast({
        title: t("quote.successTitle"),
        description: t("quote.successMessage"),
      });
    },
    onError: (error) => {
      showErrorToast(toast, error);
    },
  });

  const onSubmit = (data: QuoteFormValues) => {
    submitMutation.mutate(data);
  };

  const handleClose = () => {
    if (submitted) {
      setSubmitted(false);
      form.reset();
      setSelectedFeatures([]);
    }
    onOpenChange(false);
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              {t("quote.successTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("quote.successMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-muted-foreground">
                {t("quote.thankYou")}
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full sm:w-auto">
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("quote.title")}
          </DialogTitle>
          <DialogDescription>
            {t("quote.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hotelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.hotelName")} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t("quote.hotelNamePlaceholder")} {...field} data-testid="input-hotel-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.contactName")} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t("quote.contactNamePlaceholder")} {...field} data-testid="input-contact-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.email")} *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="hotel@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("dashboard.reception.phone")} *</FormLabel>
                        <FormControl>
                          <PhoneInput
                            country="az"
                            value={field.value}
                            onChange={field.onChange}
                            inputStyle={{
                              width: "100%",
                              height: "40px",
                              fontSize: "14px",
                              backgroundColor: "transparent",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "calc(var(--radius) - 2px)",
                              color: "inherit",
                            }}
                            buttonStyle={{
                              backgroundColor: "transparent",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "calc(var(--radius) - 2px) 0 0 calc(var(--radius) - 2px)",
                            }}
                            dropdownStyle={{
                              backgroundColor: "hsl(var(--background))",
                              color: "hsl(var(--foreground))",
                            }}
                            containerClass="phone-input-container"
                            inputProps={{ "data-testid": "input-phone" }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.country")} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t("quote.countryPlaceholder")} {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.city")} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t("quote.cityPlaceholder")} {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.totalRooms")}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="100" {...field} data-testid="input-total-rooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedSmartRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.expectedSmartRooms")}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="50" {...field} data-testid="input-smart-rooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferredContactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.preferredContactMethod")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-contact-method">
                              <SelectValue placeholder={t("common.select")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTACT_METHOD_IDS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {t(`quote.contactMethod.${method}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quote.timezone_label")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder={t("common.select")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONE_VALUES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {t(`quote.timezone.${tz.replace('+', 'plus').replace('-', 'minus')}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="preferredContactHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quote.preferredContactHours")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("quote.preferredContactHoursPlaceholder")} {...field} data-testid="input-contact-hours" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="mb-3 block">{t("quote.interestedFeatures")}</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FEATURE_IDS.map((featureId) => (
                      <label
                        key={featureId}
                        className="flex items-center space-x-2 p-2 rounded-md border border-border hover-elevate cursor-pointer"
                        data-testid={`checkbox-feature-${featureId}`}
                      >
                        <Checkbox
                          checked={selectedFeatures.includes(featureId)}
                          onCheckedChange={() => toggleFeature(featureId)}
                        />
                        <span className="text-sm">{t(`quote.feature.${featureId}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quote.message")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("quote.messagePlaceholder")}
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit-quote">
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.submitting")}
                  </>
                ) : (
                  t("quote.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
