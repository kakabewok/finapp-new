import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceStart = searchParams.get("sourceStart");
    const sourceEnd = searchParams.get("sourceEnd");

    if (!sourceStart || !sourceEnd) {
      return NextResponse.json({ error: "sourceStart and sourceEnd are required" }, { status: 400 });
    }

    // Fetch budgets from the source period with category details
    const { data: sourceBudgets, error } = await supabase
      .from("budgets")
      .select(`
        id,
        category_id,
        amount,
        notes,
        categories (
          id,
          name,
          icon,
          color,
          type
        )
      `)
      .eq("user_id", user.id)
      .eq("start_date", sourceStart)
      .eq("end_date", sourceEnd);

    if (error) {
      console.error("Error fetching source budgets:", error);
      return NextResponse.json({ error: "Failed to fetch source budgets" }, { status: 500 });
    }

    return NextResponse.json({
      sourceStart,
      sourceEnd,
      budgets: sourceBudgets || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
