"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Crown, Eye, Users, Wrench, Check, X } from "lucide-react";

const PERMISSIONS = [
  { action: "View all data (transactions, budget)", owner: true, admin: true, member: true, viewer: true },
  { action: "Add transactions / budget", owner: true, admin: true, member: true, viewer: false },
  { action: "Edit own transactions / budget", owner: true, admin: true, member: true, viewer: false },
  { action: "Edit others' transactions / budget", owner: true, admin: true, member: false, viewer: false },
  { action: "Delete own data", owner: true, admin: true, member: true, viewer: false },
  { action: "Delete others' data", owner: true, admin: true, member: false, viewer: false },
  { action: "Generate invite link", owner: true, admin: true, member: false, viewer: false },
  { action: "Remove members", owner: true, admin: true, member: false, viewer: false },
  { action: "Change member roles", owner: true, admin: false, member: false, viewer: false },
  { action: "Delete workspace", owner: true, admin: false, member: false, viewer: false },
];

const ROLES = [
  {
    key: "owner" as const,
    emoji: "👑",
    label: "Owner",
    description: "Full control. Created the workspace. Only one per workspace.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    key: "admin" as const,
    emoji: "🔧",
    label: "Admin",
    description: "Can manage data and members, but cannot delete the workspace or change roles.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    key: "member" as const,
    emoji: "👤",
    label: "Member",
    description: "Can manage their own data. Cannot touch others' entries or invite people.",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  {
    key: "viewer" as const,
    emoji: "👁️",
    label: "Viewer",
    description: "Read-only access. Cannot add, edit, or delete anything.",
    color: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-500/10",
  },
];

function PermissionIndicator({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15">
      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10">
      <X className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500/70" />
    </span>
  );
}

export default function WorkspacePermissionsPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Permission Reference</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              What each role can do in a shared workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Permission Table */}
      <div className="overflow-x-auto hide-scrollbar rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3 font-medium text-muted-foreground min-w-[220px]">Action</th>
              <th className="text-center p-3 font-semibold min-w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>Owner</span>
                </div>
              </th>
              <th className="text-center p-3 font-semibold min-w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  <span>Admin</span>
                </div>
              </th>
              <th className="text-center p-3 font-semibold min-w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>Member</span>
                </div>
              </th>
              <th className="text-center p-3 font-semibold min-w-[80px]">
                <div className="flex flex-col items-center gap-1">
                  <Eye className="h-4 w-4 text-zinc-500" />
                  <span>Viewer</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((row, i) => (
              <tr
                key={row.action}
                className={`border-b last:border-b-0 transition-colors hover:bg-muted/30 ${
                  i % 2 === 0 ? "bg-card" : "bg-muted/10"
                }`}
              >
                <td className="p-3 font-medium">{row.action}</td>
                <td className="p-3 text-center"><PermissionIndicator allowed={row.owner} /></td>
                <td className="p-3 text-center"><PermissionIndicator allowed={row.admin} /></td>
                <td className="p-3 text-center"><PermissionIndicator allowed={row.member} /></td>
                <td className="p-3 text-center"><PermissionIndicator allowed={row.viewer} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Descriptions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Role Descriptions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map((role) => (
            <div
              key={role.key}
              className={`flex items-start gap-3 p-4 rounded-xl border ${role.bg} transition-colors`}
            >
              <span className="text-2xl mt-0.5">{role.emoji}</span>
              <div>
                <p className={`font-semibold ${role.color}`}>{role.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
