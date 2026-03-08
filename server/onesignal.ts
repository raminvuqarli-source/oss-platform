import { logger } from "./utils/logger";

const ONESIGNAL_APP_ID = process.env.VITE_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";

interface PushNotificationOptions {
  userIds: string[];
  title: string;
  message: string;
  url?: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    logger.warn({ appIdPresent: !!ONESIGNAL_APP_ID, restApiKeyPresent: !!ONESIGNAL_REST_API_KEY }, "Missing APP_ID or REST_API_KEY, skipping push notification");
    return false;
  }

  if (options.userIds.length === 0) {
    logger.warn("No userIds provided, skipping push");
    return false;
  }

  try {
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: options.userIds,
      },
      target_channel: "push",
      headings: { en: options.title },
      contents: { en: options.message },
      android_channel_id: undefined,
      priority: 10,
      android_visibility: 1,
    };

    if (options.url) {
      payload.url = options.url;
    }

    if (options.data) {
      payload.data = options.data;
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      logger.error({ status: response.status, responseText }, "OneSignal push failed");
      return false;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      logger.error({ responseText }, "OneSignal invalid JSON response");
      return false;
    }
    
    if (result.recipients === 0) {
      logger.warn({ externalIds: options.userIds }, "0 recipients - users may not be subscribed or external_id not matched");
    }
    
    if (result.errors) {
      logger.error({ errors: result.errors }, "OneSignal push errors");
    }
    
    return true;
  } catch (error) {
    logger.error({ err: error }, "OneSignal push error");
    return false;
  }
}
