# Shared Workspace / Collaborative Finance Feature

Implement a full collaborative workspace system for SiBoros, allowing users to create shared workspaces, invite members via link, and manage finances together with role-based permissions.

---

## User Review Required

> [!IMPORTANT]
> **Budget table naming**: The user's spec references `budget_planner` table, but the codebase uses `budgets`. This plan uses `budgets` (the actual table name). Confirm this is correct.

> [!IMPORTANT]
> **RLS policy rewrite**: The existing RLS policies on `transactions` and `budgets` use simple `auth.uid() = user_id` checks. Adding workspace support requires **dropping and recreating** these policies to also allow access when the user is a workspace member. Existing personal data (where `workspace_id IS NULL`) will continue to work identically.

> [!WARNING]
> **Data on workspace deletion**: When an owner deletes a workspace, all transactions and budgets with that `workspace_id` will be **permanently deleted** (not reassigned). The confirmation dialog will make this very clear. This is the simplest and safest approach — reassigning to personal would mix other people's data into the owner's account.

---

## Open Questions

> [!IMPORTANT]
> **Invite link behavior**: The spec says "only one active (pending) invite link per workspace at a time." This means generating a new invite auto-revokes the old one. Should we instead allow multiple concurrent invite links, or is one-at-a-time fine?

> [!NOTE]
> **`nanoid` dependency**: The spec suggests `nanoid` or `crypto.randomUUID()` for tokens. Since `crypto.randomUUID()` is natively available in Node.js, I'll use that to avoid adding a new dependency. The token will be a standard UUID format.

---

## Proposed Changes

The implementation is organized into 7 phases. Each phase builds on the previous one.

---

### Phase 1: Database Migration

Create the workspace schema and modify existing tables.

#### [NEW] [004_workspaces.sql](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/supabase/migrations/004_workspaces.sql)

Creates 3 new tables and modifies 2 existing ones:

**New tables:**
- `workspaces` — id, name, owner_id (FK → auth.users), created_at
- `workspace_members` — id, workspace_id, user_id, role ('owner'|'admin'|'member'|'viewer'), joined_at, UNIQUE(workspace_id, user_id)
- `workspace_invites` — id, workspace_id, token (unique), created_by, expires_at, status ('pending'|'used'|'revoked'), created_at

**Modified tables:**
- `transactions` — ADD `workspace_id` (UUID, nullable, FK → workspaces, ON DELETE CASCADE)
- `budgets` — ADD `workspace_id` (UUID, nullable, FK → workspaces, ON DELETE CASCADE)

**RLS policies (all tables):**
- `workspaces`: SELECT/UPDATE if user is a member via `workspace_members`
- `workspace_members`: SELECT if user is in same workspace; INSERT/DELETE only by owner/admin
- `workspace_invites`: INSERT/UPDATE by owner/admin; SELECT by anyone with valid token
- `transactions`: Existing personal access (`workspace_id IS NULL AND user_id = auth.uid()`) + workspace access (member of workspace; viewers = SELECT only; others = full CRUD)
- `budgets`: Same pattern as transactions
- `budget_history`: Same pattern as transactions (add workspace_id column)

**Indexes:**
- `idx_transactions_workspace_id`, `idx_budgets_workspace_id`
- `idx_workspace_members_user_id`, `idx_workspace_members_workspace_id`
- `idx_workspace_invites_token`

---

### Phase 2: TypeScript Types & Workspace Context

#### [MODIFY] [index.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/types/index.ts)

Add new types:
```typescript
type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

interface Workspace {
  id: string; name: string; owner_id: string; created_at: string;
}

interface WorkspaceMember {
  id: string; workspace_id: string; user_id: string; role: WorkspaceRole;
  joined_at: string; email?: string; full_name?: string; avatar_url?: string;
}

interface WorkspaceInvite {
  id: string; workspace_id: string; token: string; created_by: string;
  expires_at: string; status: 'pending' | 'used' | 'revoked'; created_at: string;
}
```

Add `workspace_id?: string | null` to `Transaction`, `Budget` and `TransactionFormData`.

#### [NEW] [WorkspaceContext.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/workspace/WorkspaceContext.tsx)

React Context providing:
- `activeWorkspaceId: string | null` — null = personal mode
- `activeWorkspace: Workspace | null` — the workspace object
- `userRole: WorkspaceRole | null` — current user's role in active workspace
- `workspaces: Workspace[]` — all workspaces user belongs to
- `setActiveWorkspace(id: string | null): void` — switch workspace
- `refreshWorkspaces(): Promise<void>` — re-fetch workspace list

Persists `activeWorkspaceId` in `localStorage`. On mount, validates the stored workspace is still accessible (handles stale/removed access). Falls back to Personal mode with a toast if access is lost.

#### [MODIFY] [layout.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/(dashboard)/layout.tsx)

Wrap children with `<WorkspaceProvider>`.

---

### Phase 3: Workspace Switcher & Sidebar Integration

#### [NEW] [WorkspaceSwitcher.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/workspace/WorkspaceSwitcher.tsx)

Dropdown component showing:
- "Personal" option (always first, default)
- List of shared workspaces the user belongs to
- Active workspace indicated with a checkmark
- "+ Create Workspace" option at the bottom → opens Create Workspace dialog
- Workspace name + role badge shown for each option

#### [NEW] [CreateWorkspaceDialog.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/workspace/CreateWorkspaceDialog.tsx)

Dialog with single input field (workspace name). On submit:
1. POST `/api/workspaces` → creates workspace + adds owner as member
2. Refreshes workspace list in context
3. Optionally auto-switches to the new workspace

#### [MODIFY] [Sidebar.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/layout/Sidebar.tsx)

Add `<WorkspaceSwitcher />` below the "Siboros" logo area, above nav items. Also add a "Workspace Settings" nav item (visible only when a workspace is active, links to `/workspace/settings`).

#### [MODIFY] [MobileNav.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/layout/MobileNav.tsx)

The sidebar is reused inside MobileNav, so the WorkspaceSwitcher will appear there automatically.

---

### Phase 4: Workspace API Routes & Server Actions

#### [NEW] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/workspaces/route.ts)

- `GET` — list all workspaces for current user (via workspace_members)
- `POST` — create workspace (name) → inserts workspace + workspace_member with role='owner'

#### [NEW] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/workspaces/[id]/route.ts)

- `GET` — get workspace details (name, owner, member count)
- `DELETE` — delete workspace (owner only, cascades)

#### [NEW] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/workspaces/[id]/members/route.ts)

- `GET` — list all members of workspace (with email/name from auth.users metadata)
- `DELETE` — remove a member (owner/admin only, or self-leave)

#### [NEW] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/workspaces/[id]/members/[memberId]/role/route.ts)

- `PUT` — change member role (owner only)

#### [NEW] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/workspaces/[id]/invite/route.ts)

- `GET` — get current active invite for workspace
- `POST` — generate new invite link (auto-revokes existing one)
- `DELETE` — revoke current invite

#### [NEW] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/invite/[token]/route.ts)

- `GET` — validate invite token, return workspace info
- `POST` — accept invite (join workspace)

---

### Phase 5: Workspace Settings Page

#### [NEW] [page.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/(dashboard)/workspace/settings/page.tsx)

Full workspace management page with sections:

1. **Workspace Info** — Name display (editable by owner)
2. **Members** — Table: name/email, role badge, joined date, actions (change role, remove)
3. **Invite Link** — Generate/view/copy/revoke invite link with expiry info
4. **Danger Zone** — Leave workspace (non-owner) / Delete workspace (owner only)

Role-gated UI: change role button only for owner, remove only for owner/admin, invite only for owner/admin.

---

### Phase 6: Invite Join Flow

#### [NEW] [page.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/invite/page.tsx)

Multi-step join page:
1. Validate token server-side → show error if invalid/expired/revoked
2. If not logged in → show "Log in to join" / "Sign up to join" buttons (with `?next=/invite?token=xxx` redirect)
3. If logged in → show confirmation: workspace name, owner name, Accept/Decline
4. Edge cases: already a member, already the owner
5. Accept → POST `/api/invite/[token]` → redirect to dashboard with active workspace switched

#### [MODIFY] [page.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/(auth)/login/page.tsx)

Support `?next=` URL parameter: after successful login, redirect to `next` URL instead of `/dashboard`.

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/auth/callback/route.ts)

Support `next` parameter in OAuth callback flow for post-login redirect.

---

### Phase 7: Workspace-Aware Data Queries

All API routes that fetch/mutate transactions and budgets need to respect the active workspace.

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/transactions/route.ts)

- GET: Add `workspace_id` query param. If null/absent → `WHERE workspace_id IS NULL AND user_id = auth.uid()`. If present → `WHERE workspace_id = ?` (RLS handles member check).
- POST: Accept `workspace_id` in body. Validate role if workspace (not viewer).

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/transactions/[id]/route.ts)

- GET/PUT/DELETE: Workspace-aware queries. For workspace transactions, use workspace_id filter instead of user_id for access (RLS handles the rest). For edits/deletes, server-side role check for workspace data.

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/dashboard/route.ts)

- Accept `workspace_id` query param, filter all queries accordingly.

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/budgets/route.ts)

- GET/POST: Same workspace_id filtering pattern.

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/budget/route.ts)

- Same workspace_id filtering pattern.

#### [MODIFY] [route.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/api/reports/summary/route.ts)

- Same workspace_id filtering pattern.

#### [MODIFY] [RecentTransactions.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/dashboard/RecentTransactions.tsx)

- Pass `workspace_id` from context to API calls.

#### [MODIFY] [TransactionList.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/components/transactions/TransactionList.tsx)

- Pass `workspace_id` from context to API calls.
- Hide add/edit/delete buttons for viewers.

#### [MODIFY] [DashboardPage](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/(dashboard)/dashboard/page.tsx)

- Pass `workspace_id` to dashboard API.

#### [MODIFY] [BudgetPage](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/(dashboard)/budget/page.tsx)

- Pass `workspace_id` to budget APIs.
- Hide create/edit for viewers.

---

## File Summary

| Category | Files | Status |
|----------|-------|--------|
| Migration | 1 SQL file | NEW |
| Types | 1 file | MODIFY |
| Context | 1 file | NEW |
| Components | 3 workspace components | NEW |
| Layout | 2 files (Sidebar, dashboard layout) | MODIFY |
| API routes | 6 new route files | NEW |
| API routes | 6 existing route files | MODIFY |
| Pages | 2 new pages (workspace settings, invite) | NEW |
| Auth | 2 files (login, callback) | MODIFY |
| Data components | 4+ components (dashboard, transactions, budget) | MODIFY |

**Total: ~12 new files, ~14 modified files**

---

## Verification Plan

### Manual Verification
1. Create a workspace → verify it appears in switcher
2. Switch between Personal and Workspace → verify data isolation
3. Generate invite link → copy → open in incognito → complete join flow
4. Test all role permissions (owner/admin/member/viewer)
5. Test edge cases: expired link, already member, revoked link
6. Test workspace deletion → verify cascade + graceful fallback
7. Test stale localStorage → verify reset to Personal mode

### Build Verification
- `npm run build` passes without errors
- No TypeScript errors in new/modified files
