"use client";

import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface UserMenuProps {
  user: { email: string; full_name?: string | null; avatar_url?: string | null };
  variant?: "sidebar" | "mobile";
}

export function UserMenu({ user, variant = "mobile" }: UserMenuProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const initials = user.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Sidebar variant: full row with name and email
  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg
                             hover:bg-muted transition-colors text-left outline-none focus-visible:ring-2 ring-primary">
            <Avatar className="w-8 h-8 border">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{user.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
            <User size={14} className="mr-2" />
            Profile
            <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">Soon</Badge>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
            <Settings size={14} className="mr-2" />
            Settings
            <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">Soon</Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
            <LogOut size={14} className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Mobile variant: avatar icon only
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded-full
                           ring-2 ring-border hover:ring-primary transition-all outline-none">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <User size={14} className="mr-2" />
          Profile
          <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">Soon</Badge>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <Settings size={14} className="mr-2" />
          Settings
          <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">Soon</Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
          <LogOut size={14} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
