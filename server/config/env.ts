export const env = {
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || "";
  },
  get SESSION_SECRET(): string {
    return process.env.SESSION_SECRET || "";
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || "development";
  },
  get PORT(): number {
    return parseInt(process.env.PORT || "5000", 10);
  },
  get RESEND_API_KEY(): string | undefined {
    return process.env.RESEND_API_KEY;
  },
  get EPOINT_PRIVATE_KEY(): string | undefined {
    return process.env.EPOINT_PRIVATE_KEY;
  },
  get EPOINT_PUBLIC_KEY(): string | undefined {
    return process.env.EPOINT_PUBLIC_KEY;
  },
  get EPOINT_MERCHANT_ID(): string | undefined {
    return process.env.EPOINT_MERCHANT_ID;
  },
  get BASE_URL(): string {
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
    if (process.env.BASE_URL) return process.env.BASE_URL;
    if (process.env.NODE_ENV === "production") return "https://ossaiproapp.com";
    if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;
    if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    return "http://localhost:5000";
  },
} as const;
