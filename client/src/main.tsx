import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    __pwaInstallPrompt: Event | null;
  }
}

window.__pwaInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  window.dispatchEvent(new CustomEvent("pwaInstallReady"));
});

// Auto-reload when Vite fails to load a chunk (happens after new deployments).
// This prevents the "Page couldn't be loaded" error that requires a manual refresh.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Also catch dynamic import failures from unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const msg = event?.reason?.message ?? "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Unable to preload CSS") ||
    msg.includes("ChunkLoadError")
  ) {
    event.preventDefault();
    window.location.reload();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[PWA] Service worker registered:", registration.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
