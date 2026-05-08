import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentReturn() {
  const [status, setStatus] = useState<"success" | "declined" | "pending">("pending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderId = params.get("orderId");

    const isSuccess = payment === "sub_success" || payment === "success";
    const isDeclined = payment === "declined";

    setStatus(isSuccess ? "success" : isDeclined ? "declined" : "pending");

    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "EPOINT_PAYMENT_RESULT", payment, orderId },
        window.location.origin
      );
    } else {
      const dest = isSuccess
        ? `/dashboard?view=billing-addons&payment=${payment}&orderId=${orderId}`
        : `/dashboard?view=billing-addons&payment=declined&orderId=${orderId}`;
      setTimeout(() => { window.location.href = dest; }, 1500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        {status === "pending" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Yüklənir...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-lg">Ödəniş uğurludur!</p>
            <p className="text-muted-foreground text-sm">Plan aktivləşdirilir...</p>
          </>
        )}
        {status === "declined" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="font-semibold text-lg">Ödəniş rədd edildi</p>
            <p className="text-muted-foreground text-sm">Yenidən cəhd edin.</p>
          </>
        )}
      </div>
    </div>
  );
}
