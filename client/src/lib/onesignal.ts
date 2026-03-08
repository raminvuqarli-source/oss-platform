declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
    median?: any;
    gonative?: any;
    median_onesignal_info?: (info: any) => void;
  }
}

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

let initialized = false;
let medianBridgeReady = false;
let sdkReady: Promise<any> | null = null;

function isMedianApp(): boolean {
  const ua = navigator.userAgent || "";
  return !!(
    window.median ||
    window.gonative ||
    ua.includes("median") ||
    ua.includes("gonative") ||
    ua.includes("GoNative") ||
    (ua.includes("wv") && ua.includes("Android"))
  );
}

function waitForMedianBridge(maxAttempts = 20, interval = 500): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (window.median?.onesignal) {
        medianBridgeReady = true;
        console.log(`[OneSignal] Median bridge ready after ${attempts * interval}ms`);
        resolve(true);
        return;
      }
      if (attempts >= maxAttempts) {
        console.warn(`[OneSignal] Median bridge not found after ${maxAttempts * interval}ms`);
        resolve(false);
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

function waitForSdk(maxAttempts = 40, interval = 250): Promise<any> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (window.OneSignal && typeof window.OneSignal.init === "function") {
        resolve(window.OneSignal);
        return;
      }
      if (attempts >= maxAttempts) {
        reject(new Error("[OneSignal] SDK not loaded after timeout"));
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

window.median_onesignal_info = function(info: any) {
  console.log("[OneSignal] Median info callback:", JSON.stringify(info));
};

export async function initOneSignal() {
  if (initialized || !APP_ID) {
    if (!APP_ID) console.warn("[OneSignal] No APP_ID, skipping init");
    return;
  }

  if (isMedianApp()) {
    console.log("[OneSignal] Median app detected, waiting for native bridge...");
    const bridgeReady = await waitForMedianBridge();
    if (bridgeReady && window.median?.onesignal) {
      try {
        window.median.onesignal.register();
        console.log("[OneSignal] Median register() called successfully");
        initialized = true;
      } catch (e) {
        console.warn("[OneSignal] Median register error:", e);
      }
    }
    return;
  }

  try {
    sdkReady = waitForSdk();
    const OneSignal = await sdkReady;

    await OneSignal.init({
      appId: APP_ID,
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
    });

    initialized = true;
    console.log("[OneSignal] Web SDK initialized, appId:", APP_ID);

    const permission = OneSignal.Notifications.permission;
    const subId = OneSignal.User.PushSubscription.id;
    console.log("[OneSignal] Permission:", permission, "SubscriptionId:", subId);
  } catch (e) {
    console.warn("[OneSignal] Web init error:", e);
  }
}

async function getOneSignal(): Promise<any | null> {
  if (!APP_ID || !initialized) return null;
  if (isMedianApp()) return null;
  try {
    if (sdkReady) return await sdkReady;
    return window.OneSignal || null;
  } catch {
    return null;
  }
}

export async function loginOneSignal(userId: string) {
  if (!APP_ID) return;
  try {
    if (isMedianApp()) {
      if (!medianBridgeReady) {
        await waitForMedianBridge();
      }
      if (window.median?.onesignal) {
        window.median.onesignal.register();
        window.median.onesignal.login(String(userId));
        console.log("[OneSignal] Median login called with externalId:", userId);
      }
      return;
    }
    const OneSignal = await getOneSignal();
    if (OneSignal) {
      await OneSignal.login(String(userId));
      console.log("[OneSignal] Web login:", userId);
      const subId = OneSignal.User.PushSubscription.id;
      console.log("[OneSignal] After login - SubscriptionId:", subId);
    }
  } catch (e) {
    console.warn("[OneSignal] login error:", e);
  }
}

export async function logoutOneSignal() {
  if (!APP_ID) return;
  try {
    if (isMedianApp()) {
      if (window.median?.onesignal) {
        window.median.onesignal.logout();
        console.log("[OneSignal] Median logout called");
      }
      return;
    }
    const OneSignal = await getOneSignal();
    if (OneSignal) {
      await OneSignal.logout();
    }
  } catch (e) {
    console.warn("[OneSignal] logout error:", e);
  }
}

export async function setOneSignalTags(tags: Record<string, string>) {
  if (!APP_ID) return;
  try {
    if (isMedianApp()) {
      if (!medianBridgeReady) {
        await waitForMedianBridge();
      }
      if (window.median?.onesignal?.tags) {
        window.median.onesignal.tags.sendTags(tags);
        console.log("[OneSignal] Median tags sent:", JSON.stringify(tags));
      }
      return;
    }
    const OneSignal = await getOneSignal();
    if (OneSignal) {
      for (const [key, value] of Object.entries(tags)) {
        await OneSignal.User.addTag(key, value);
      }
    }
  } catch (e) {
    console.warn("[OneSignal] tags error:", e);
  }
}

export async function requestNotificationPermission() {
  if (!APP_ID) return;
  try {
    if (isMedianApp()) {
      if (!medianBridgeReady) {
        await waitForMedianBridge();
      }
      if (window.median?.onesignal) {
        window.median.onesignal.register();
        console.log("[OneSignal] Median notification permission requested via register()");
      }
      return;
    }
    const OneSignal = await getOneSignal();
    if (OneSignal) {
      const currentPermission = OneSignal.Notifications.permission;
      console.log("[OneSignal] Current permission:", currentPermission);
      if (!currentPermission) {
        await OneSignal.Notifications.requestPermission();
        console.log("[OneSignal] Permission requested");
      }
      const isOptedIn = OneSignal.User.PushSubscription.optedIn;
      if (!isOptedIn) {
        await OneSignal.User.PushSubscription.optIn();
        console.log("[OneSignal] Opted in to push");
      }
      const subId = OneSignal.User.PushSubscription.id;
      console.log("[OneSignal] Final SubscriptionId:", subId);
    }
  } catch (e) {
    console.warn("[OneSignal] permission request error:", e);
  }
}
