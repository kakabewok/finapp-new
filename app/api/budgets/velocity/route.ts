import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch active budgets with category info
    const { data: budgets, error } = await supabase
      .from("budgets")
      .select(`
        *,
        categories (name, icon, color)
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) throw error;

    // Fetch transactions for all active budgets' date ranges
    const categoryIds = [...new Set((budgets || []).map(b => b.category_id))];
    if (categoryIds.length === 0) return NextResponse.json([]);

    const earliestStart = (budgets || []).reduce((min, b) => b.start_date < min ? b.start_date : min, budgets![0].start_date);
    const latestEnd = (budgets || []).reduce((max, b) => b.end_date > max ? b.end_date : max, budgets![0].end_date);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, category_id, transaction_date")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .in("category_id", categoryIds)
      .gte("transaction_date", earliestStart)
      .lte("transaction_date", latestEnd);

    const today = new Date();

    const velocities = (budgets || []).map((b) => {
      // Calculate spent for this budget's date range
      const spentAmount = (transactions || [])
        .filter(tx =>
          tx.category_id === b.category_id &&
          tx.transaction_date >= b.start_date &&
          tx.transaction_date <= b.end_date
        )
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const effectiveBudget = Number(b.amount) + Number(b.rollover_amount || 0);
      const percentageUsed = effectiveBudget > 0 ? Math.round((spentAmount / effectiveBudget) * 100) : 0;

      // Calculate date-based progress
      const startDate = new Date(b.start_date);
      const endDate = new Date(b.end_date);
      const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

      let daysPassed: number;
      if (today < startDate) {
        daysPassed = 0;
      } else if (today > endDate) {
        daysPassed = totalDays;
      } else {
        daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const periodProgress = daysPassed / totalDays;
      const projectedSpend = periodProgress > 0 ? spentAmount / periodProgress : 0;
      const willOverbudget = projectedSpend > effectiveBudget;
      const projectedOverAmount = projectedSpend - effectiveBudget;

      let message = "";
      let status = "normal";

      if (spentAmount > effectiveBudget) {
        status = "overbudget";
        message = `Overbudget! You have exceeded the limit by Rp ${new Intl.NumberFormat('id-ID').format(spentAmount - effectiveBudget)}`;
      } else if (willOverbudget) {
        status = "warning";
        message = `Day ${daysPassed} of ${totalDays}, ${percentageUsed}% budget spent. Projected overbudget Rp ${new Intl.NumberFormat('id-ID').format(projectedOverAmount)}`;
      } else {
        status = "normal";
        message = `Day ${daysPassed} of ${totalDays}, ${percentageUsed}% budget spent. On track.`;
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
