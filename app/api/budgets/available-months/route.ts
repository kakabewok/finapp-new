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

    // Fetch all distinct month and year combinations for the current user
    const { data: budgets, error } = await supabase
      .from("budgets")
      .select("month, year")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching available months:", error);
      return NextResponse.json({ error: "Failed to fetch available months" }, { status: 500 });
    }

    // Deduplicate the month/year combinations
    const uniqueMonthsMap = new Map<string, { month: number; year: number }>();
    budgets?.forEach((b) => {
      const key = `${b.year}-${b.month}`;
      if (!uniqueMonthsMap.has(key)) {
        uniqueMonthsMap.set(key, { month: b.month, year: b.year });
      }
    });

    const uniqueMonths = Array.from(uniqueMonthsMap.values());

    // Sort descending (latest first)
    uniqueMonths.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });

    return NextResponse.json({
      availableMonths: uniqueMonths,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
