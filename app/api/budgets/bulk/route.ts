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
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided for deletion" }, { status: 400 });
    }

    const { error } = await supabase
      .from("budgets")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id); // Extra security to ensure user only deletes their own

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
