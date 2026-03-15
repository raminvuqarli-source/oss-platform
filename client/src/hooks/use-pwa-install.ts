import { useState, useEffect } from "react";

export type DeviceType = "windows" | "mac" | "android" | "ios" | "other";

export interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  deviceType: DeviceType;
  isIOS: boolean;
  isStandalone: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Mac/.test(navigator.platform) && !/iPhone|iPad|iPod/.test(ua)) return "mac";
  if (/Win/.test(navigator.platform)) return "windows";
  return "other";
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const deviceType = detectDevice();
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isStandalone]);

  const install = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setCanInstall(false);
        return "accepted";
      }
      return "dismissed";
    } catch {
      return "unavailable";
    }
  };

  return {
    canInstall,
    isInstalled,
    deviceType,
    isIOS: deviceType === "ios",
    isStandalone,
    install,
  };
}
