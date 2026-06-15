"use client";

import { useState, useEffect } from "react";
import { Menu, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export function MobileNav({ currentUser }: { currentUser: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background lg:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10" 
        onClick={() => setIsMobileMenuOpen(true)}
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu size={20} />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <div 
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg transform transition-transform duration-300 ease-in-out motion-reduce:transition-none ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div 
          className="flex-1 overflow-auto h-full" 
          onClick={(e) => {
            // Close the sidebar when clicking a link
            if ((e.target as HTMLElement).closest('a')) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          <Sidebar className="border-none min-h-full" currentUser={currentUser} />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
          <span className="sr-only">Close menu</span>
        </Button>
      </div>

      <span className="font-semibold text-sm flex items-center gap-2">
        <Wallet size={16} className="text-primary" />
        Siboros
      </span>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={currentUser} variant="mobile" />
      </div>
    </header>
  );
}
