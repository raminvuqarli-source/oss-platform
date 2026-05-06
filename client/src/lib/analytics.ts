declare function gtag(...args: any[]): void;

export function fireLeadConversion(): void {
  try {
    gtag("event", "conversion", {
      send_to: "AW-18144119582/GntkCISt0KgcEJ6W5ctD",
      value: 1.0,
      currency: "USD",
    });
  } catch {
    // gtag not loaded yet — silently ignore
  }
}
