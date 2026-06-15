"use client";
import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptProps {
  variant?: "banner" | "button";
}

// Deteksi iOS Safari
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  return (
    "standalone" in window.navigator &&
    (window.navigator as any).standalone
  );
}

export function InstallPrompt({ variant = "banner" }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (hasDismissed) return;

    // Kalau sudah running sebagai PWA, tidak perlu tampilkan apapun
    if (isInStandaloneMode()) return;

    // Cek iOS
    if (isIOS()) {
      setIsIosDevice(true);
      setShowPrompt(true);
      return; // tidak perlu listen beforeinstallprompt
    }

    // Android/Chrome/etc
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      // iOS tidak bisa trigger prompt — instruksinya sudah ditampilkan di UI
      return;
    }
    if (!deferredPrompt) {
      alert("Install prompt not available. Your browser may not support this feature. Please use Chrome or Edge to install the app.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (variant === "button") {
    if (isIosDevice) return null; // atau buka modal instruksi
    return (
      <Button variant="outline" size="sm" onClick={handleInstallClick} className="hidden sm:flex">
        <Download className="mr-2 h-4 w-4" /> Install App
      </Button>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="bg-card border shadow-lg rounded-xl p-4 flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install SiBoros</h3>

          {isIosDevice ? (
            <p className="text-xs text-muted-foreground mt-1">
              Tap <Share className="inline h-3 w-3 mx-0.5" /> Share, then select
              "Add to Home Screen" to install this app.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mt-1">
                Install this app on your device for quick access and a better experience.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleInstallClick} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Install
                </Button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}