"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowRightLeft,
  ScanLine,
  Tags,
  PieChart,
  FileText,
  LogOut,
  User,
  Settings,
  Wallet,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: ArrowRightLeft,
  },
  {
    title: "Scan Receipt",
    href: "/scan",
    icon: ScanLine,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    title: "Budget",
    href: "/budget",
    icon: PieChart,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },
];

export function Sidebar({ className, currentUser }: { className?: string, currentUser?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className={cn("pb-12 border-r bg-card/50 min-h-screen flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Siboros
          </h2>
          <div className="space-y-1 mt-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive ? "font-medium bg-secondary text-secondary-foreground" : "text-muted-foreground"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary" : "")} />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
            
            <Link
              href="#"
              className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed pointer-events-none"
            >
              <User size={18} />
              <span>Profile</span>
              <span className="ml-auto text-[9px] font-medium bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-sm leading-tight">
                Soon
              </span>
            </Link>
            <Link
              href="#"
              className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed pointer-events-none"
            >
              <Settings size={18} />
              <span>Settings</span>
              <span className="ml-auto text-[9px] font-medium bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-sm leading-tight">
                Soon
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-auto border-t p-3">
        <div className="flex items-center justify-between">
          <UserMenu user={currentUser} variant="sidebar" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
