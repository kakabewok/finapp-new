"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  User,
  Users,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  admin: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  member: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  viewer: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

export function WorkspaceSwitcher() {
  const {
    activeWorkspaceId,
    activeWorkspace,
    workspaces,
    isLoading,
    setActiveWorkspace,
  } = useWorkspace();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const displayLabel = activeWorkspace ? activeWorkspace.name : "Personal";
  const displayIcon = activeWorkspace ? (
    <Users className="h-4 w-4 text-primary" />
  ) : (
    <User className="h-4 w-4 text-primary" />
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 h-auto text-left font-normal"
          >
            <div className="flex items-center gap-2 min-w-0">
              {displayIcon}
              <span className="truncate text-sm font-medium">{displayLabel}</span>
              {activeWorkspace && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-4 capitalize shrink-0", roleColors[activeWorkspace.role])}
                >
                  {activeWorkspace.role}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px]" align="start" side="bottom">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Switch workspace
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Personal option */}
          <DropdownMenuItem
            onClick={() => setActiveWorkspace(null)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span className="flex-1">Personal</span>
            {!activeWorkspaceId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>

          {/* Shared workspaces */}
          {workspaces.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Shared Workspaces
              </DropdownMenuLabel>
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => setActiveWorkspace(ws.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  <span className="flex-1 truncate">{ws.name}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0 h-4 capitalize", roleColors[ws.role])}
                  >
                    {ws.role}
                  </Badge>
                  {activeWorkspaceId === ws.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 cursor-pointer text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
