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

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(
    () => window.__pwaInstallPrompt ?? null
  );
  const [canInstall, setCanInstall] = useState<boolean>(
    () => !!window.__pwaInstallPrompt && !isStandaloneMode()
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(isStandaloneMode);

  const deviceType = detectDevice();

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    const onReady = () => {
      const prompt = window.__pwaInstallPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
        setCanInstall(true);
      }
    };

    const onInstalled = () => {
      window.__pwaInstallPrompt = null;
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("pwaInstallReady", onReady);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("pwaInstallReady", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const prompt = deferredPrompt ?? window.__pwaInstallPrompt;
    if (!prompt) return "unavailable";
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setCanInstall(false);
        setIsInstalled(true);
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
    isStandalone: isStandaloneMode(),
    install,
  };
}
