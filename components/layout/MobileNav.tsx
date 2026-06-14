"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export function MobileNav({ currentUser }: { currentUser: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background lg:hidden">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu size={20} />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex-1 overflow-auto h-full" onClick={() => setIsMobileMenuOpen(false)}>
            <Sidebar className="border-none min-h-full" currentUser={currentUser} />
          </div>
        </SheetContent>
      </Sheet>

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
