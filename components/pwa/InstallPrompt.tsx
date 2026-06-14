"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptProps {
  variant?: "banner" | "button";
}

export function InstallPrompt({ variant = "banner" }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user dismissed it previously
    const hasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (hasDismissed) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If app is successfully installed
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Your browser is blocking the automatic install prompt. \n\n• The app might already be installed.\n• You may be in dev mode.\n• On iOS/Safari, you must tap 'Share' -> 'Add to Home Screen'.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (variant === "button") {
    return (
      <Button variant="outline" size="sm" onClick={handleInstallClick} className="hidden sm:flex">
        <Download className="mr-2 h-4 w-4" /> Install App
      </Button>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="border border-blue-600 fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="bg-card border shadow-lg rounded-xl p-4 flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install SiBoros</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install this app on your device for quick access and a better experience.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleInstallClick} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Install
            </Button>
          </div>
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
