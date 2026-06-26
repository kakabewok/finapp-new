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
    const workspaceId = searchParams.get("workspace_id");

    let query = supabase
      .from("budgets")
      .select("id, start_date, end_date, category_id")
      .order("start_date", { ascending: false });

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null).eq("user_id", user.id);
    }

    // Fetch all budgets with their date ranges for the "Copy from..." feature
    const { data: budgets, error } = await query;

    if (error) {
      console.error("Error fetching available periods:", error);
      return NextResponse.json({ error: "Failed to fetch available periods" }, { status: 500 });
    }

    // Group by unique start_date/end_date periods
    const periodsMap = new Map<string, { start_date: string; end_date: string; budget_count: number }>();
    budgets?.forEach((b) => {
      const key = `${b.start_date}_${b.end_date}`;
      if (!periodsMap.has(key)) {
        periodsMap.set(key, { start_date: b.start_date, end_date: b.end_date, budget_count: 0 });
      }
      periodsMap.get(key)!.budget_count++;
    });

    const periods = Array.from(periodsMap.values());
    // Sort descending by start_date
    periods.sort((a, b) => b.start_date.localeCompare(a.start_date));

    return NextResponse.json({
      periods,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
