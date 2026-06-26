import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

type Context = {
  params: Promise<{ id: string }>;
};

// GET /api/workspaces/[id]/members — list workspace members
export async function GET(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch members
    const { data: members, error } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", id)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    // Enrich with user info using admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        const { data: { user: memberUser } } = await adminSupabase.auth.admin.getUserById(member.user_id);
        return {
          ...member,
          email: memberUser?.email || null,
          full_name: memberUser?.user_metadata?.full_name || null,
          avatar_url: memberUser?.user_metadata?.avatar_url || null,
        };
      })
    );

    return NextResponse.json(enrichedMembers);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id]/members — remove a member or self-leave
export async function DELETE(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id: workspaceId } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Get requester's role
    const { data: requesterMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!requesterMembership) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Get target's role
    const { data: targetMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: "Target user is not a member" }, { status: 404 });
    }

    const isSelf = targetUserId === user.id;

    // Owner cannot remove themselves
    if (isSelf && targetMembership.role === "owner") {
      return NextResponse.json(
        { error: "You cannot remove yourself as the owner. Transfer ownership or delete the workspace." },
        { status: 400 }
      );
    }

    // Permission check for removing others
    if (!isSelf && !["owner", "admin"].includes(requesterMembership.role)) {
      return NextResponse.json({ error: "You don't have permission to remove members" }, { status: 403 });
    }

    // Admin cannot remove owner
    if (!isSelf && targetMembership.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 403 });
    }

    // Delete the membership
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId);

    if (error) {
      console.error("Error removing member:", error);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
