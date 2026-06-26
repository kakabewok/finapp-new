import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "");
    const workspaceId = searchParams.get("workspace_id");

    // 1. Calculate Date Range for the given month/year
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endOfMonthDate = new Date(year, month, 0);
    const endOfMonth = endOfMonthDate.toISOString().split("T")[0] + "T23:59:59.999Z";

    // 2. Fetch total income for that month
    let incomeQuery = supabase
      .from("transactions")
      .select("amount")
      .eq("type", "income")
      .gte("transaction_date", startOfMonth)
      .lte("transaction_date", endOfMonth);

    if (workspaceId) {
      incomeQuery = incomeQuery.eq("workspace_id", workspaceId);
    } else {
      incomeQuery = incomeQuery.eq("user_id", user.id).is("workspace_id", null);
    }

    const { data: incomeData, error: errIncome } = await incomeQuery;
      
    if (errIncome) throw errIncome;
    const totalIncome = incomeData.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // 3. Fetch active budgets whose periods overlap with the given month
    let budgetQuery = supabase
      .from("budgets")
      .select("amount, rollover_amount")
      .eq("status", "active")
      .lte("start_date", endOfMonthDate.toISOString().split("T")[0])
      .gte("end_date", startOfMonth);

    if (workspaceId) {
      budgetQuery = budgetQuery.eq("workspace_id", workspaceId);
    } else {
      budgetQuery = budgetQuery.eq("user_id", user.id).is("workspace_id", null);
    }

    const { data: budgetsData, error: errBudget } = await budgetQuery;
      
    if (errBudget) throw errBudget;
    const totalBudgetAllocated = budgetsData.reduce((sum, b) => sum + Number(b.amount) + Number(b.rollover_amount || 0), 0);

    // 4. Calculate projected remaining
    const projectedRemaining = totalIncome - totalBudgetAllocated;

    return NextResponse.json({
      totalIncome,
      totalBudgetAllocated,
      projectedRemaining,
    });
  } catch (error) {
    console.error("Budget Projection API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
