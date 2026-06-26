import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

type Context = {
  params: Promise<{ token: string }>;
};

// GET /api/invite/[token] — validate invite token and return workspace info
export async function GET(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { token } = params;

    const supabase = await createSupabaseServerClient();

    // Look up the invite — use admin client to bypass RLS for token lookup
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: invite, error } = await adminSupabase
      .from("workspace_invites")
      .select(`
        *,
        workspaces (
          id,
          name,
          owner_id
        )
      `)
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Invalid invite link", code: "INVALID" }, { status: 404 });
    }

    if (invite.status === "revoked") {
      return NextResponse.json({ error: "This invite link has been revoked", code: "REVOKED" }, { status: 410 });
    }

    if (invite.status === "used") {
      return NextResponse.json({ error: "This invite link has already been used", code: "USED" }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({
        error: "This invite link has expired. Ask the workspace owner to generate a new one.",
        code: "EXPIRED",
      }, { status: 410 });
    }

    // Get owner info
    const workspace = invite.workspaces as any;
    let ownerName = "Unknown";
    if (workspace?.owner_id) {
      const { data: { user: ownerUser } } = await adminSupabase.auth.admin.getUserById(workspace.owner_id);
      ownerName = ownerUser?.user_metadata?.full_name || ownerUser?.email || "Unknown";
    }

    // Check if current user is already a member (if logged in)
    const { data: { user } } = await supabase.auth.getUser();
    let membershipStatus: "none" | "member" | "owner" = "none";
    if (user && workspace) {
      const { data: existingMember } = await adminSupabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        membershipStatus = existingMember.role === "owner" ? "owner" : "member";
      }
    }

    return NextResponse.json({
      valid: true,
      workspace_id: workspace?.id,
      workspace_name: workspace?.name,
      owner_name: ownerName,
      expires_at: invite.expires_at,
      is_logged_in: !!user,
      membership_status: membershipStatus,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/invite/[token] — accept invite and join workspace
export async function POST(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { token } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in to accept an invite" }, { status: 401 });
    }

    // Use admin client for operations that need to bypass RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Re-validate the invite
    const { data: invite, error: inviteError } = await adminSupabase
      .from("workspace_invites")
      .select("*, workspaces(id, name)")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "This invite link is no longer active" }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invite link has expired" }, { status: 410 });
    }

    const workspace = invite.workspaces as any;

    // Check if user is already a member
    const { data: existingMember } = await adminSupabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this workspace", workspace_id: workspace.id }, { status: 409 });
    }

    // Add user as member
    const { error: memberError } = await adminSupabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json({ error: "Failed to join workspace" }, { status: 500 });
    }

    // Note: In concurrent mode, we do NOT mark the invite as 'used'
    // Multiple people can use the same invite link until it expires or is revoked

    return NextResponse.json({
      success: true,
      workspace_id: workspace.id,
      workspace_name: workspace.name,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
