import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "");

    const { data: budgets, error } = await supabase
      .from("budget_summary")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year);

    if (error) throw error;

    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    
    let dayOfMonth = today.getDate();
    let daysInMonth = new Date(year, month, 0).getDate();
    
    if (!isCurrentMonth) {
       if (year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)) {
          dayOfMonth = daysInMonth;
       } else {
          dayOfMonth = 1;
       }
    }

    const monthProgress = dayOfMonth / daysInMonth; 

    const velocities = (budgets || []).map((b) => {
      const projectedSpend = monthProgress > 0 ? b.spent_amount / monthProgress : 0;
      const willOverbudget = projectedSpend > b.effective_budget;
      const projectedOverAmount = projectedSpend - b.effective_budget;
      
      let message = "";
      let status = "normal";
      
      const percentageUsed = b.percentage_used;

      if (b.status === "overbudget") {
         status = "overbudget";
         message = `Overbudget! You have exceeded the limit by Rp ${new Intl.NumberFormat('id-ID').format(b.spent_amount - b.effective_budget)}`;
      } else if (willOverbudget) {
         status = "warning";
         message = `Day ${dayOfMonth}, ${percentageUsed}% budget spent. Projected overbudget Rp ${new Intl.NumberFormat('id-ID').format(projectedOverAmount)}`;
      } else {
         status = "normal";
         message = `Day ${dayOfMonth}, ${percentageUsed}% budget spent. On track.`;
      }

      return {
        id: b.id,
        category_id: b.category_id,
        projectedSpend,
        willOverbudget,
        projectedOverAmount,
        message,
        velocityStatus: status
      };
    });

    return NextResponse.json(velocities);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
