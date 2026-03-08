import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo";
import { 
  Building2, Eye, EyeOff, Loader2, ChevronRight, ChevronLeft, Check,
  MapPin, Star, Home, Users, Wifi, CreditCard, UserPlus, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/error-handler";
import { InternationalPhoneInput } from "@/components/phone-input";
import { createEmailSchema, createPasswordSchema } from "@/lib/validation";

const TOTAL_STEPS = 9;

const countries = [
  "United States", "United Kingdom", "Germany", "France", "Italy", "Spain", 
  "Turkey", "Greece", "Thailand", "Japan", "Australia", "Canada", "Mexico",
  "Brazil", "United Arab Emirates", "Singapore", "Switzerland", "Austria",
  "Portugal", "Netherlands", "Other"
];

const starRatings = [
  { value: "1-star", label: "1 Star" },
  { value: "2-star", label: "2 Star" },
  { value: "3-star", label: "3 Star" },
  { value: "4-star", label: "4 Star" },
  { value: "5-star", label: "5 Star" },
  { value: "boutique", label: "Boutique Hotel" },
  { value: "resort", label: "Resort" },
  { value: "apartment", label: "Apartment Hotel" },
];

const buildingTypes = [
  { value: "hotel", label: "Hotel Building" },
  { value: "resort", label: "Resort Complex" },
  { value: "boutique", label: "Boutique Hotel" },
  { value: "apartment", label: "Apartment Hotel" },
  { value: "villa", label: "Villa Complex" },
  { value: "capsule", label: "Capsule Hotel" },
  { value: "tiny-house", label: "Tiny House / A-Frame Resort" },
];

const guestTypes = [
  { value: "business", label: "Business" },
  { value: "tourism", label: "Tourism" },
  { value: "family", label: "Family" },
  { value: "luxury", label: "Luxury" },
  { value: "wellness", label: "Wellness" },
  { value: "ski-mountain", label: "Ski / Mountain Tourism" },
  { value: "beach", label: "Beach Resort" },
];

const pmsSoftwareOptions = [
  { value: "opera", label: "Opera" },
  { value: "cloudbeds", label: "Cloudbeds" },
  { value: "hotelogix", label: "Hotelogix" },
  { value: "none", label: "None" },
  { value: "other", label: "Other" },
];

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "TRY", label: "TRY - Turkish Lira" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
];

const staffRoles = [
  { value: "admin", labelKey: "staff.adminRole", descKey: "staff.adminRoleDesc" },
  { value: "reception", labelKey: "staff.receptionRole", descKey: "staff.receptionRoleDesc" },
];

const registerSchema = z.object({
  hotelName: z.string().min(2, "Hotel name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  postalCode: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email required"),
  website: z.string().optional(),
  starRating: z.string().optional(),
  totalRooms: z.coerce.number().min(1, "At least 1 room required"),
  numberOfFloors: z.coerce.number().optional(),
  buildingType: z.string().optional(),
  primaryGuestType: z.string().optional(),
  hasSmartDevices: z.boolean().default(false),
  smartDoorLocks: z.boolean().default(false),
  smartHvac: z.boolean().default(false),
  smartLighting: z.boolean().default(false),
  pmsSystem: z.boolean().default(false),
  bmsSystem: z.boolean().default(false),
  iotSensors: z.boolean().default(false),
  pmsSoftware: z.string().optional(),
  pmsOther: z.string().optional(),
  expectedSmartRoomCount: z.coerce.number().optional(),
  billingCurrency: z.string().optional(),
  billingContactEmail: z.string().email().optional().or(z.literal("")),
  staffFullName: z.string().min(2, "Full name is required"),
  staffEmail: createEmailSchema(),
  staffPassword: createPasswordSchema(),
  staffPasswordConfirm: z.string().min(1, "Please confirm your password"),
  staffRole: z.string().default("admin"),
}).refine((data) => data.staffPassword === data.staffPasswordConfirm, {
  message: "Passwords do not match",
  path: ["staffPasswordConfirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const stepIcons = [
  Building2,
  Star,
  Home,
  Users,
  Wifi,
  FileText,
  CreditCard,
  UserPlus,
  Check,
];

function ProgressBar({ currentStep }: { currentStep: number }) {
  const { t } = useTranslation();
  const stepLabels = [
    t('hotel.hotelInfo', 'Hotel Information'),
    t('hotel.classification', 'Classification'),
    t('hotel.propertyDetails', 'Property Details'),
    t('hotel.guestProfile', 'Guest Profile'),
    t('hotel.smartInfrastructure', 'Smart Infrastructure'),
    t('hotel.pmsIntegration', 'PMS Integration'),
    t('hotel.billingCapacity', 'Billing'),
    t('hotel.staffAccount', 'Staff Account'),
    t('hotel.summary', 'Summary'),
  ];
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{t('hotel.step', 'Step')} {currentStep} / {TOTAL_STEPS}</span>
        <span className="text-sm text-muted-foreground">{stepLabels[currentStep - 1]}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-in-out rounded-full"
          style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-4 overflow-x-auto pb-2">
        {stepIcons.map((StepIcon, index) => {
          const isCompleted = index + 1 < currentStep;
          const isCurrent = index + 1 === currentStep;
          return (
            <div 
              key={index}
              className={`flex flex-col items-center min-w-[60px] ${
                isCompleted ? "text-primary" : isCurrent ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                isCompleted ? "bg-primary text-primary-foreground" : 
                isCurrent ? "bg-primary/20 border-2 border-primary" : "bg-muted"
              }`}>
                {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <span className="text-[10px] text-center hidden md:block">{stepLabels[index]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { register: registerUser, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const justRegistered = useRef(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      hotelName: "",
      country: "",
      city: "",
      address: "",
      postalCode: "",
      phone: "",
      email: "",
      website: "",
      starRating: "",
      totalRooms: 0,
      numberOfFloors: 0,
      buildingType: "",
      primaryGuestType: "",
      hasSmartDevices: false,
      smartDoorLocks: false,
      smartHvac: false,
      smartLighting: false,
      pmsSystem: false,
      bmsSystem: false,
      iotSensors: false,
      pmsSoftware: "",
      pmsOther: "",
      expectedSmartRoomCount: 0,
      billingCurrency: "USD",
      billingContactEmail: "",
      staffFullName: "",
      staffEmail: "",
      staffPassword: "",
      staffPasswordConfirm: "",
      staffRole: "admin",
    },
  });

  const hasSmartDevices = form.watch("hasSmartDevices");
  const pmsSoftware = form.watch("pmsSoftware");

  useEffect(() => {
    if (justRegistered.current && isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepFields: Record<number, (keyof RegisterForm)[]> = {
      1: ["hotelName", "country", "city", "address", "phone", "email"],
      2: [],
      3: ["totalRooms"],
      4: [],
      5: [],
      6: [],
      7: [],
      8: ["staffFullName", "staffEmail", "staffPassword", "staffPasswordConfirm"],
      9: [],
    };

    const fields = stepFields[currentStep] || [];
    if (fields.length === 0) return true;
    
    const result = await form.trigger(fields);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      justRegistered.current = true;
      
      const registerData = {
        username: data.staffEmail.split("@")[0] + Math.random().toString(36).slice(2, 6),
        password: data.staffPassword,
        fullName: data.staffFullName,
        email: data.staffEmail,
        role: data.staffRole as "admin" | "reception",
        hotelData: {
          name: data.hotelName,
          country: data.country,
          city: data.city,
          address: data.address,
          postalCode: data.postalCode,
          phone: data.phone,
          email: data.email,
          website: data.website,
          starRating: data.starRating,
          totalRooms: data.totalRooms,
          numberOfFloors: data.numberOfFloors,
          buildingType: data.buildingType,
          primaryGuestType: data.primaryGuestType,
          hasSmartDevices: data.hasSmartDevices,
          smartDoorLocks: data.smartDoorLocks,
          smartHvac: data.smartHvac,
          smartLighting: data.smartLighting,
          pmsSystem: data.pmsSystem,
          bmsSystem: data.bmsSystem,
          iotSensors: data.iotSensors,
          pmsSoftware: data.pmsSoftware,
          pmsOther: data.pmsOther,
          expectedSmartRoomCount: data.expectedSmartRoomCount,
          billingCurrency: data.billingCurrency,
          billingContactEmail: data.billingContactEmail,
        },
      };
      
      await registerUser(registerData);
      toast({
        title: t('hotel.registrationSuccess', 'Hotel registered successfully!'),
        description: t('hotel.welcomeMessage', 'Welcome to O.S.S Smart Hotel System.'),
      });
    } catch (error: any) {
      justRegistered.current = false;
      showErrorToast(toast, error);
    } finally {
      setIsLoading(false);
    }
  };

  const formData = form.watch();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.basicInfo', 'Hotel Basic Information')}</h3>
            </div>
            <FormField
              control={form.control}
              name="hotelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.name', 'Hotel Name')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('hotel.placeholders.hotelName')} {...field} data-testid="input-hotel-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hotel.country', 'Country')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder={t('hotel.selectCountry', 'Select country')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hotel.city', 'City')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('hotel.placeholders.cityName')} {...field} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.address', 'Hotel Address')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('hotel.placeholders.hotelAddress')} {...field} data-testid="input-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.postalCode', 'Postal Code')}</FormLabel>
                  <FormControl>
                    <Input placeholder="34000" {...field} data-testid="input-postal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hotel.phone', 'Hotel Phone')} *</FormLabel>
                    <FormControl>
                      <InternationalPhoneInput
                        value={field.value?.replace(/^\+/, '') || ''}
                        onChange={(phone) => field.onChange(`+${phone}`)}
                        placeholder={t('hotel.placeholders.enterPhone')}
                        inputProps={{ "data-testid": "input-phone" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hotel.hotelEmail', 'Hotel Email')} *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('hotel.placeholders.adminEmail')} {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.website', 'Website URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.hotel.com" {...field} data-testid="input-website" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.classification', 'Hotel Classification')}</h3>
            </div>
            <FormField
              control={form.control}
              name="starRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.starRating', 'Star Rating / Type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-star-rating">
                        <SelectValue placeholder={t('hotel.selectRating', 'Select classification')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {starRatings.map((rating) => (
                        <SelectItem key={rating.value} value={rating.value}>{t(`hotel.starRatingOption.${rating.value}`, rating.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('hotel.starRatingDesc', "Choose the hotel's official star rating or type classification")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.propertyDetails', 'Property Details')}</h3>
            </div>
            <FormField
              control={form.control}
              name="totalRooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.totalRooms', 'Total Number of Rooms')} *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder={t('hotel.placeholders.totalRooms')} 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-total-rooms" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfFloors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.numberOfFloors', 'Number of Floors')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="10" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-floors" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buildingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.buildingType', 'Building Type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-building-type">
                        <SelectValue placeholder={t('hotel.selectBuildingType', 'Select building type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{t(`hotel.buildingType.${type.value}`, type.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.guestProfile', 'Guest Profile')}</h3>
            </div>
            <FormField
              control={form.control}
              name="primaryGuestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.primaryGuestType', 'Primary Guest Type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-guest-type">
                        <SelectValue placeholder={t('hotel.selectGuestType', 'Select primary guest type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {guestTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{t(`hotel.guestType.${type.value}`, type.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('hotel.guestTypeDesc', 'Select the primary type of guests your hotel typically serves')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.smartInfrastructure')}</h3>
            </div>
            <FormField
              control={form.control}
              name="hasSmartDevices"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('hotel.smartDevices', 'Smart Devices')}</FormLabel>
                    <FormDescription>
                      {t('hotel.smartDevicesDesc', 'Does your hotel already use smart devices?')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-smart-devices"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {hasSmartDevices && (
              <div className="space-y-3 ml-4 mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-3">{t('hotel.selectInstalledSystems', 'Select installed systems:')}</p>
                <FormField
                  control={form.control}
                  name="smartDoorLocks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-door-locks" />
                      </FormControl>
                      <FormLabel className="font-normal">{t('hotel.smartDoorLocks', 'Smart Door Locks')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smartHvac"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-hvac" />
                      </FormControl>
                      <FormLabel className="font-normal">{t('hotel.smartHvac', 'Smart HVAC System')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smartLighting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-lighting" />
                      </FormControl>
                      <FormLabel className="font-normal">{t('hotel.smartLighting', 'Smart Lighting')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pmsSystem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-pms" />
                      </FormControl>
                      <FormLabel className="font-normal">{t('hotel.pmsSystem', 'PMS System')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bmsSystem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-bms" />
                      </FormControl>
                      <FormLabel className="font-normal">{t('hotel.bmsSystem', 'BMS System')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="iotSensors"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-iot" />
                      </FormControl>
                      <FormLabel className="font-normal">{t('hotel.iotSensors', 'IoT Sensors')}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.pmsIntegration', 'PMS Integration')}</h3>
            </div>
            <FormField
              control={form.control}
              name="pmsSoftware"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.pmsSoftwareUsed', 'PMS Software Used')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-pms">
                        <SelectValue placeholder={t('hotel.selectPms', 'Select PMS software')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pmsSoftwareOptions.map((pms) => (
                        <SelectItem key={pms.value} value={pms.value}>{t(`hotel.pmsSoftwareOption.${pms.value}`, pms.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('hotel.pmsDesc', 'Select the Property Management System your hotel uses')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {pmsSoftware === "other" && (
              <FormField
                control={form.control}
                name="pmsOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hotel.otherPmsName', 'Other PMS Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('hotel.enterPmsName', 'Enter PMS name')} {...field} data-testid="input-pms-other" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.billingCapacity', 'Billing & Capacity Planning')}</h3>
            </div>
            <FormField
              control={form.control}
              name="expectedSmartRoomCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.expectedSmartRooms', 'Expected Smart Room Count')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="50" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-smart-room-count" 
                    />
                  </FormControl>
                  <FormDescription>
                    {t('hotel.howManyRooms', 'Number of rooms expected to use smart features')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.billingCurrency', 'Preferred Billing Currency')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder={t('hotel.selectCurrency', 'Select currency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>{t(`hotel.currency.${currency.value}`, currency.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingContactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('hotel.billingContactEmail', 'Billing Contact Email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="billing@hotel.com" {...field} data-testid="input-billing-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.staffAccount')}</h3>
            </div>
            <FormField
              control={form.control}
              name="staffFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fullName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('hotel.placeholders.adminName')} {...field} data-testid="input-staff-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="staffEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')} *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('hotel.placeholders.adminEmail')} {...field} data-testid="input-staff-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="staffPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')} *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('hotel.placeholders.password')}
                        autoComplete="new-password"
                        {...field}
                        data-testid="input-staff-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="staffPasswordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.confirmPassword')} *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('hotel.placeholders.confirmPassword', 'Confirm your password')}
                        autoComplete="new-password"
                        {...field}
                        data-testid="input-staff-password-confirm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password-confirm"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="staffRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.role')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-staff-role">
                        <SelectValue placeholder={t('hotel.selectRole', 'Select role')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{t(role.labelKey)}</span>
                            <span className="text-xs text-muted-foreground">{t(role.descKey)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('hotel.summary')}</h3>
            </div>
            
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('hotel.hotelInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">{t('hotel.name')}:</span> {formData.hotelName}</div>
                  <div><span className="text-muted-foreground">{t('hotel.location', 'Location')}:</span> {formData.city}, {formData.country}</div>
                  <div><span className="text-muted-foreground">{t('hotel.totalRooms')}:</span> {formData.totalRooms}</div>
                  <div><span className="text-muted-foreground">{t('hotel.classification')}:</span> {formData.starRating || t('common.notSpecified', 'Not specified')}</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    {t('hotel.smartInfrastructure')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {formData.hasSmartDevices ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.smartDoorLocks && <Badge variant="secondary">{t('hotel.doorLocks', 'Door Locks')}</Badge>}
                      {formData.smartHvac && <Badge variant="secondary">{t('hotel.hvac', 'HVAC')}</Badge>}
                      {formData.smartLighting && <Badge variant="secondary">{t('hotel.lighting', 'Lighting')}</Badge>}
                      {formData.pmsSystem && <Badge variant="secondary">{t('hotel.pms', 'PMS')}</Badge>}
                      {formData.bmsSystem && <Badge variant="secondary">{t('hotel.bms', 'BMS')}</Badge>}
                      {formData.iotSensors && <Badge variant="secondary">{t('hotel.iot', 'IoT')}</Badge>}
                      {!formData.smartDoorLocks && !formData.smartHvac && !formData.smartLighting && 
                       !formData.pmsSystem && !formData.bmsSystem && !formData.iotSensors && 
                        <span className="text-muted-foreground">{t('hotel.smartDevicesNoneSelected', 'Smart devices enabled (none selected)')}</span>}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t('hotel.noSmartDevices', 'No smart devices currently installed')}</span>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('hotel.pmsIntegration', 'PMS Integration')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <span className="text-muted-foreground">{t('hotel.pms', 'PMS')}: </span>
                  {formData.pmsSoftware === "other" ? formData.pmsOther : 
                   formData.pmsSoftware ? t(`hotel.pmsSoftwareOption.${formData.pmsSoftware}`, pmsSoftwareOptions.find(p => p.value === formData.pmsSoftware)?.label || formData.pmsSoftware) : t('common.notSpecified', 'Not specified')}
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t('hotel.subscriptionPreview', 'Subscription Preview')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>{t('hotel.smartRoomCount', 'Smart Room Count')}:</span>
                    <span className="font-medium">{formData.expectedSmartRoomCount || formData.totalRooms || 0} {t('common.rooms', 'rooms')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('hotel.billingCurrency', 'Billing Currency')}:</span>
                    <span className="font-medium">{formData.billingCurrency || "USD"}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {t('hotel.pricingNote', 'Final pricing will be calculated based on your room count and selected features. Our team will contact you with a customized quote.')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Get Started"
        description="Register your property on O.S.S Smart Hotel System. Set up multi-property management, smart room controls, and streamlined guest services in minutes."
        path="/register"
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

      <main className="flex-1 flex items-start justify-center p-4 md:p-6 overflow-y-auto">
        <Card className="w-full max-w-2xl my-4">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="text-2xl font-bold">{t('hotel.registerTitle')}</CardTitle>
            <CardDescription>
              {t('hotel.registerSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar currentStep={currentStep} />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderStep()}
                
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('common.back')}
                  </Button>
                  
                  {currentStep < TOTAL_STEPS ? (
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      data-testid="button-next-step"
                    >
                      {t('common.next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      data-testid="button-submit-registration"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('hotel.registering')}
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          {t('hotel.completeRegistration')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              {t('auth.haveAccount')}{" "}
              <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                {t('auth.signIn')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
