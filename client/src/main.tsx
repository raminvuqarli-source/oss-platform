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

createRoot(document.getElementById("root")!).render(<App />);
