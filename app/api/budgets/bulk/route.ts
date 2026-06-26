import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, workspace_id } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided for deletion" }, { status: 400 });
    }

    let deleteQuery = supabase
      .from("budgets")
      .delete()
      .in("id", ids);

    if (workspace_id) {
      deleteQuery = deleteQuery.eq("workspace_id", workspace_id);
    } else {
      deleteQuery = deleteQuery.is("workspace_id", null).eq("user_id", user.id);
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error("Error bulk deleting budgets:", error);
      return NextResponse.json({ error: "Failed to delete budgets" }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
