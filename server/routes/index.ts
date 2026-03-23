import type { Express } from "express";
import type { Server } from "http";

import { registerAuthRoutes } from "./auth.routes";
import { registerTenantRoutes } from "./tenant.routes";
import { registerSaasRoutes } from "./saas.routes";
import { registerBookingRoutes } from "./bookings.routes";
import { registerServiceRequestRoutes } from "./service-requests.routes";
import { registerNotificationRoutes } from "./notifications.routes";
import { registerChatRoutes } from "./chat.routes";
import { registerFinanceRoutes } from "./finance.routes";
import { registerQuoteRoutes } from "./quote.routes";
import { registerAdminRoutes } from "./admin.routes";
import { registerRoomPrepRoutes } from "./room-prep.routes";
import { registerStaffRoutes } from "./staff.routes";
import { registerFinanceCenterRoutes } from "./finance-center.routes";
import { registerEpointRoutes } from "./epoint.routes";
import { registerContractRoutes } from "./contracts.routes";
import { registerStaffPerformanceRoutes } from "./staff-performance.routes";
import { registerHousekeepingRoutes } from "./housekeeping.routes";
import { registerIntegrationRoutes } from "./integrations";
import { registerAvailabilityRoutes } from "./availability.routes";
import { registerRatePlanRoutes } from "./rate-plans.routes";
import { registerOtaRoutes } from "./ota.routes";
import { registerAnalyticsRoutes } from "./analytics.routes";
import { registerPricingRoutes } from "./pricing.routes";
import { registerSubscriptionRoutes } from "./subscription.routes";
import { registerInvoiceRoutes } from "./invoice.routes";
import { registerAdminFinanceRoutes } from "./admin-finance.routes";
import { registerRefundRoutes } from "./refund.routes";
import { registerAiChatRoutes } from "./ai-chat.routes";
import { registerFolioRoutes } from "./folio.routes";
import { initWebSocket } from "../websocket/index";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/download/user-manual", (req, res) => {
    const lang = (req.query.lang as string) || "en";
    if (lang === "fa") {
      const filePath = path.resolve("OSS_User_Manual_Farsi.docx");
      res.download(filePath, "OSS_User_Manual_Farsi.docx");
    } else {
      const filePath = path.resolve("OSS_Complete_User_Manual.docx");
      res.download(filePath, "OSS_Complete_User_Manual.docx");
    }
  });

  await registerAuthRoutes(httpServer, app);

  registerTenantRoutes(app);
  registerSaasRoutes(app);
  registerBookingRoutes(app);
  registerServiceRequestRoutes(app);
  registerNotificationRoutes(app);
  registerChatRoutes(app);
  registerFinanceRoutes(app);
  registerQuoteRoutes(app);
  registerAdminRoutes(app);
  registerRoomPrepRoutes(app);
  registerStaffRoutes(app);
  registerFinanceCenterRoutes(app);
  registerEpointRoutes(app);
  registerContractRoutes(app);
  registerStaffPerformanceRoutes(app);
  registerHousekeepingRoutes(app);
  registerIntegrationRoutes(app);
  registerAvailabilityRoutes(app);
  registerRatePlanRoutes(app);
  registerOtaRoutes(app);
  registerAnalyticsRoutes(app);
  registerPricingRoutes(app);
  registerSubscriptionRoutes(app);
  registerInvoiceRoutes(app);
  registerAdminFinanceRoutes(app);
  registerRefundRoutes(app);
  registerAiChatRoutes(app);
  registerFolioRoutes(app);
  initWebSocket(httpServer, app);

  return httpServer;
}
