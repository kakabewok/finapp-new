import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { seedDefaultCategories } from "@/lib/supabase/seed-categories";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

// GET /api/workspaces — list all workspaces for current user
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch workspace memberships with workspace details
    const { data: memberships, error } = await supabase
      .from("workspace_members")
      .select(`
        role,
        workspaces (
          id,
          name,
          owner_id,
          created_at
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching workspaces:", error);
      return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
    }

    // Flatten the response
    const workspaces = (memberships || [])
      .filter((m: any) => m.workspaces)
      .map((m: any) => ({
        ...m.workspaces,
        role: m.role,
      }));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/workspaces — create a new workspace
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = createWorkspaceSchema.parse(body);

    // 1. Create the workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({
        name,
        owner_id: user.id,
      })
      .select()
      .single();

    if (wsError) {
      console.error("Error creating workspace:", wsError);
      return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }

    // 2. Add the creator as owner member
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error adding owner member:", memberError);
      // Attempt cleanup
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }

    // 3. Seed default categories for the new workspace
    await seedDefaultCategories({
      supabase,
      workspaceId: workspace.id,
      userId: null,
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
