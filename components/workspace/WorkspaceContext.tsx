"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { WorkspaceWithRole, WorkspaceRole } from "@/types";
import { toast } from "sonner";

interface WorkspaceContextValue {
  /** null = Personal mode, UUID = shared workspace */
  activeWorkspaceId: string | null;
  /** The active workspace object (null in personal mode) */
  activeWorkspace: WorkspaceWithRole | null;
  /** Current user's role in active workspace (null in personal mode) */
  userRole: WorkspaceRole | null;
  /** All workspaces the current user belongs to */
  workspaces: WorkspaceWithRole[];
  /** Whether workspaces are still loading */
  isLoading: boolean;
  /** Switch to a different workspace (null = personal) */
  setActiveWorkspace: (id: string | null) => void;
  /** Re-fetch workspace list from the server */
  refreshWorkspaces: () => Promise<void>;
  /** Check if user can perform an action based on their role */
  canPerform: (action: WorkspaceAction) => boolean;
}

export type WorkspaceAction =
  | "view_data"
  | "add_data"
  | "edit_own_data"
  | "edit_others_data"
  | "delete_own_data"
  | "delete_others_data"
  | "invite_members"
  | "remove_members"
  | "change_roles"
  | "delete_workspace";

const ROLE_PERMISSIONS: Record<WorkspaceAction, WorkspaceRole[]> = {
  view_data: ["owner", "admin", "member", "viewer"],
  add_data: ["owner", "admin", "member"],
  edit_own_data: ["owner", "admin", "member"],
  edit_others_data: ["owner", "admin"],
  delete_own_data: ["owner", "admin", "member"],
  delete_others_data: ["owner", "admin"],
  invite_members: ["owner", "admin"],
  remove_members: ["owner", "admin"],
  change_roles: ["owner"],
  delete_workspace: ["owner"],
};

const STORAGE_KEY = "siboros_active_workspace_id";

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  const supabase = createSupabaseClient();

  const fetchWorkspaces = useCallback(async (): Promise<WorkspaceWithRole[]> => {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) return [];
      const data: WorkspaceWithRole[] = await res.json();
      return data;
    } catch {
      return [];
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const data = await fetchWorkspaces();
    setWorkspaces(data);
    return data;
  }, [fetchWorkspaces]);

  // Initialize on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      setIsLoading(true);
      const data = await fetchWorkspaces();
      setWorkspaces(data);

      // Restore persisted workspace
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== "null") {
        // Validate that the stored workspace still exists and user has access
        const exists = data.find((w) => w.id === stored);
        if (exists) {
          setActiveWorkspaceIdState(stored);
        } else {
          // Workspace no longer accessible — reset to personal
          localStorage.removeItem(STORAGE_KEY);
          setActiveWorkspaceIdState(null);
          if (data.length > 0) {
            // Only show toast if user had workspaces (means access was revoked)
            toast.info("You no longer have access to that workspace. Switched to Personal mode.");
          }
        }
      }

      setIsLoading(false);
    };

    init();
  }, [fetchWorkspaces]);

  const setActiveWorkspace = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const activeWorkspace = activeWorkspaceId
    ? workspaces.find((w) => w.id === activeWorkspaceId) ?? null
    : null;

  const userRole = activeWorkspace?.role ?? null;

  const canPerform = useCallback(
    (action: WorkspaceAction): boolean => {
      // In personal mode, user can do everything
      if (!activeWorkspaceId) return true;
      if (!userRole) return false;
      return ROLE_PERMISSIONS[action].includes(userRole);
    },
    [activeWorkspaceId, userRole]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        activeWorkspace,
        userRole,
        workspaces,
        isLoading,
        setActiveWorkspace,
        refreshWorkspaces: async () => {
          const data = await refreshWorkspaces();
          // If active workspace was removed, reset
          if (activeWorkspaceId && !data.find((w) => w.id === activeWorkspaceId)) {
            setActiveWorkspace(null);
            toast.info("You no longer have access to that workspace. Switched to Personal mode.");
          }
        },
        canPerform,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
