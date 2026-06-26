"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import { WorkspaceMember, WorkspaceRole } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Users,
  Copy,
  Link2,
  Trash2,
  LogOut,
  Shield,
  Crown,
  Eye,
  UserMinus,
  Plus,
  Loader2,
  AlertTriangle,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  admin: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  member: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  viewer: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5" />,
  admin: <Shield className="h-3.5 w-3.5" />,
  member: <Users className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
};

interface InviteData {
  id: string;
  token: string;
  invite_url: string;
  expires_at: string;
  created_at: string;
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const {
    activeWorkspaceId,
    activeWorkspace,
    userRole,
    canPerform,
    setActiveWorkspace,
    refreshWorkspaces,
  } = useWorkspace();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Redirect to dashboard if no workspace is active
  useEffect(() => {
    if (!activeWorkspaceId) {
      router.push("/dashboard");
    }
  }, [activeWorkspaceId, router]);

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [activeWorkspaceId]);

  const fetchInvites = useCallback(async () => {
    if (!activeWorkspaceId || !canPerform("invite_members")) return;
    setIsLoadingInvites(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/invite`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    } finally {
      setIsLoadingInvites(false);
    }
  }, [activeWorkspaceId, canPerform]);

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [fetchMembers, fetchInvites]);

  const handleGenerateInvite = async () => {
    if (!activeWorkspaceId) return;
    setIsGeneratingInvite(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/invite`, {
        method: "POST",
      });
      if (res.ok) {
        const invite = await res.json();
        setInvites((prev) => [invite, ...prev]);
        // Auto copy
        await navigator.clipboard.writeText(invite.invite_url);
        toast.success("Invite link generated and copied to clipboard!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate invite");
      }
    } catch (error) {
      toast.error("Failed to generate invite link");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyLink = async (url: string, inviteId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInviteId(inviteId);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/invite?inviteId=${inviteId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        toast.success("Invite link revoked");
      }
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const handleChangeRole = async (memberId: string, newRole: WorkspaceRole) => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/members/${memberId}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
        toast.success("Role updated");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to change role");
      }
    } catch {
      toast.error("Failed to change role");
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/members?userId=${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        toast.success(`${memberName} has been removed`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!activeWorkspaceId) return;
    setIsLeaving(true);
    try {
      const { data: { user } } = await (await import("@/lib/supabase/client")).createSupabaseClient().auth.getUser();
      if (!user) return;

      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/members?userId=${user.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setActiveWorkspace(null);
        await refreshWorkspaces();
        toast.success("You have left the workspace");
        router.push("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to leave workspace");
      }
    } catch {
      toast.error("Failed to leave workspace");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspaceId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveWorkspace(null);
        await refreshWorkspaces();
        toast.success("Workspace deleted");
        router.push("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete workspace");
      }
    } catch {
      toast.error("Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activeWorkspaceId || !activeWorkspace) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No workspace selected. Switch to a workspace from the sidebar.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{activeWorkspace.name}</h1>
        <p className="text-muted-foreground mt-1">Manage your shared workspace settings and members.</p>
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({members.length})
            </CardTitle>
            <CardDescription>People who have access to this workspace.</CardDescription>
            <Link
              href="/workspace/permissions"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-1"
            >
              <Shield className="h-3 w-3" />
              View permission details
            </Link>
          </div>
          {canPerform("invite_members") && (
            <Button onClick={() => setShowInviteDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {(member.full_name || member.email || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.full_name || member.email || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email || "No email"}
                        {" · Joined "}
                        {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role badge or selector */}
                    {canPerform("change_roles") && member.role !== "owner" ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleChangeRole(member.id, value as WorkspaceRole)
                        }
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn("capitalize gap-1", roleColors[member.role])}
                      >
                        {roleIcons[member.role]}
                        {member.role}
                      </Badge>
                    )}

                    {/* Remove button (for owner/admin, not for owner role members) */}
                    {canPerform("remove_members") && member.role !== "owner" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{" "}
                              <strong>{member.full_name || member.email}</strong> from this workspace?
                              They will lose access to all shared data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRemoveMember(
                                  member.user_id,
                                  member.full_name || member.email || "User"
                                )
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Links Section */}
      {canPerform("invite_members") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Invite Links
            </CardTitle>
            <CardDescription>
              Generate shareable links to invite people to this workspace. Multiple links can be active simultaneously.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateInvite} disabled={isGeneratingInvite}>
              {isGeneratingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate New Invite Link
                </>
              )}
            </Button>

            {invites.length > 0 && (
              <div className="space-y-2">
                {invites.map((invite) => {
                  const expiresAt = new Date(invite.expires_at);
                  const now = new Date();
                  const daysLeft = Math.ceil(
                    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                    >
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {invite.invite_url}
                      </code>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleCopyLink(invite.invite_url, invite.id)}
                      >
                        {copiedInviteId === invite.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {invites.length === 0 && !isLoadingInvites && (
              <p className="text-sm text-muted-foreground">
                No active invite links. Generate one to invite people.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Leave workspace (non-owner) */}
          {userRole !== "owner" && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
              <div>
                <p className="text-sm font-medium">Leave Workspace</p>
                <p className="text-xs text-muted-foreground">
                  You will lose access to all shared data in this workspace.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave <strong>{activeWorkspace.name}</strong>? You will lose access to all shared data.
                      You&apos;ll need a new invite to rejoin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLeaveWorkspace}
                      disabled={isLeaving}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isLeaving ? "Leaving..." : "Leave Workspace"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delete workspace (owner only) */}
          {canPerform("delete_workspace") && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
              <div>
                <p className="text-sm font-medium">Delete Workspace</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this workspace and all its shared data (transactions, budgets). This cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will <strong>permanently delete</strong> the workspace{" "}
                      <strong>&quot;{activeWorkspace.name}&quot;</strong> and all shared data including transactions and budgets.
                      All members will lose access. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteWorkspace}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-sm md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Generate a shareable link to invite people to this workspace. Anyone with the link can join.
            </DialogDescription>
          </DialogHeader>
          {/* <div className="w-full space-y-4 pt-4">
            <Button
              onClick={handleGenerateInvite}
              disabled={isGeneratingInvite}
              className="max-w-sm md:w-full"
            >
              {isGeneratingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Generate New Invite Link
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Links expire after 7 days. You can revoke them anytime.
            </p>

            {invites.length > 0 && (
              <>
                <Separator />
                <p className="text-sm font-medium">Active Links</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto max-w-md md:w-full">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center gap-2 p-2 rounded border bg-muted/50"
                    >
                      <code className="text-xs flex-1 min-w-0 truncate">{invite.invite_url}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleCopyLink(invite.invite_url, invite.id)}
                      >
                        {copiedInviteId === invite.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div> */}
          <div className="w-full space-y-4 pt-4 px-1">
            <Button
              onClick={handleGenerateInvite}
              disabled={isGeneratingInvite}
              className="w-full"
            >
              {isGeneratingInvite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Generate New Invite Link
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center px-2">
              Links expire after 7 days. You can revoke them anytime.
            </p>

            {invites.length > 0 && (
              <>
                <Separator />
                <p className="text-sm font-medium">Active Link</p>
                <div className="w-full flex flex-col gap-2">
                  {/* Hanya tampilkan 1 link terbaru */}
                  {invites.map((invite) => {
                    const daysLeft = Math.ceil(
                      (new Date(invite.expires_at).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                    )
                    const truncatedUrl = (() => {
                      try {
                        const url = new URL(invite.invite_url)
                        const token = url.searchParams.get("token") ?? ""
                        return `${url.hostname}/invite?token=${token.slice(0, 8)}...`
                      } catch {
                        return invite.invite_url.slice(0, 30) + "..."
                      }
                    })()

                    return (
                      <div
                        key={invite.id}
                        className="w-full rounded-xs border bg-muted/50 p-3 space-y-2"
                      >
                        {/* Header: label + days left */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Invite Link
                          </span>
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                            {daysLeft}d left
                          </span>
                        </div>

                        {/* Truncated URL */}
                        <code className="text-xs block w-full truncate text-foreground">
                          {truncatedUrl}
                        </code>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => handleCopyLink(invite.invite_url, invite.id)}
                          >
                            {copiedInviteId === invite.id ? (
                              <>
                                <Check className="h-3 w-3 text-green-500 mr-1" />
                                <span className="text-xs">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="hidden md:flex text-xs">Copy</span>
                              </>
                            )}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => handleRevokeInvite(invite.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            <span className="hidden md:flex text-xs">Revoke</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
