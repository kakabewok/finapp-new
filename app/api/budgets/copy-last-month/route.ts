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
    const currentMonth = parseInt(searchParams.get("month") || "");
    const currentYear = parseInt(searchParams.get("year") || "");
    const sourceMonthParam = searchParams.get("sourceMonth");
    const sourceYearParam = searchParams.get("sourceYear");

    if (isNaN(currentMonth) || isNaN(currentYear)) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 });
    }

    // Determine the source month/year to copy from
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    
    if (sourceMonthParam && sourceYearParam) {
      prevMonth = parseInt(sourceMonthParam);
      prevYear = parseInt(sourceYearParam);
    } else {
      // Fallback to previous month
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }
    }

    // Fetch previous month's budgets with category details
    const { data: prevBudgets, error } = await supabase
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
      .eq("month", prevMonth)
      .eq("year", prevYear);

    if (error) {
      console.error("Error fetching last month budgets:", error);
      return NextResponse.json({ error: "Failed to fetch last month's budgets" }, { status: 500 });
    }

    return NextResponse.json({
      prevMonth,
      prevYear,
      budgets: prevBudgets || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
