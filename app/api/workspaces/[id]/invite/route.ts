import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Context = {
  params: Promise<{ id: string }>;
};

// GET /api/workspaces/[id]/invite — get active (pending) invites for workspace
export async function GET(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id: workspaceId } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership and role
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Only owner/admin can view invites" }, { status: 403 });
    }

    // Fetch all pending invites (concurrent mode — multiple allowed)
    const { data: invites, error } = await supabase
      .from("workspace_invites")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invites:", error);
      return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
    }

    // Generate full URLs for each invite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invitesWithUrls = (invites || []).map((invite) => ({
      ...invite,
      invite_url: `${baseUrl}/invite?token=${invite.token}`,
    }));

    return NextResponse.json(invitesWithUrls);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/workspaces/[id]/invite — generate a new invite link
export async function POST(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id: workspaceId } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership and role
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Only owner/admin can generate invite links" }, { status: 403 });
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invite (concurrent: no revoking of existing invites)
    const { data: invite, error } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspaceId,
        token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invite:", error);
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
      ...invite,
      invite_url: `${baseUrl}/invite?token=${invite.token}`,
    }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/invite — revoke a specific invite by token
export async function DELETE(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id: workspaceId } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership and role
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Only owner/admin can revoke invites" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("inviteId");

    if (inviteId) {
      // Revoke a specific invite
      const { error } = await supabase
        .from("workspace_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId)
        .eq("workspace_id", workspaceId)
        .eq("status", "pending");

      if (error) {
        console.error("Error revoking invite:", error);
        return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
      }
    } else {
      // Revoke all pending invites for this workspace
      const { error } = await supabase
        .from("workspace_invites")
        .update({ status: "revoked" })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending");

      if (error) {
        console.error("Error revoking invites:", error);
        return NextResponse.json({ error: "Failed to revoke invites" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
