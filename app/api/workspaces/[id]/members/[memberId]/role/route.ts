import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

type Context = {
  params: Promise<{ id: string; memberId: string }>;
};

const changeRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

// PUT /api/workspaces/[id]/members/[memberId]/role — change member role
export async function PUT(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id: workspaceId, memberId } = params;

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only the owner can change roles
    const { data: requesterMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!requesterMembership || requesterMembership.role !== "owner") {
      return NextResponse.json({ error: "Only the workspace owner can change roles" }, { status: 403 });
    }

    // Cannot change the owner's own role
    const { data: targetMember } = await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("id", memberId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
    }

    const body = await request.json();
    const { role } = changeRoleSchema.parse(body);

    const { error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("Error changing role:", error);
      return NextResponse.json({ error: "Failed to change role" }, { status: 500 });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
