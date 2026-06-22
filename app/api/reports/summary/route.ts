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

    const dateFrom = new Date(year, month - 1, 1).toISOString();
    const dateTo = new Date(year, month, 0, 23, 59, 59).toISOString();

    const lastMonthDateFrom = new Date(year, month - 2, 1).toISOString();
    const lastMonthDateTo = new Date(year, month - 1, 0, 23, 59, 59).toISOString();

    // 1. Transactions this month
    const { data: currentTx, error: txError } = await supabase
      .from("transactions")
      .select(`*, category:categories(name, icon, color)`)
      .eq("user_id", user.id)
      .gte("transaction_date", dateFrom)
      .lte("transaction_date", dateTo)
      .order("transaction_date", { ascending: true });

    // 2. Transactions last month
    const { data: lastTx } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .gte("transaction_date", lastMonthDateFrom)
      .lte("transaction_date", lastMonthDateTo);

    // 3. Budgets that overlap with this month (using date ranges)
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    
    const { data: rawBudgets } = await supabase
      .from("budgets")
      .select(`*, categories(name, icon, color)`)
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("start_date", monthEnd)
      .gte("end_date", monthStart);

    // Compute budget performance summaries
    const budgets = (rawBudgets || []).map((b) => {
      const cat = b.categories as any;
      const budgetTxs = (currentTx || []).filter(
        (t) => t.type === 'expense' && t.category_id === b.category_id
      );
      const spentAmount = budgetTxs.reduce((a: number, t: any) => a + t.amount, 0);
      const effectiveBudget = Number(b.amount) + Number(b.rollover_amount || 0);
      const remainingAmount = effectiveBudget - spentAmount;
      const percentageUsed = effectiveBudget > 0 ? Math.round((spentAmount / effectiveBudget) * 100) : 0;
      let spendingStatus: string = 'normal';
      if (percentageUsed >= 100) spendingStatus = 'overbudget';
      else if (percentageUsed >= 80) spendingStatus = 'warning';
      return {
        id: b.id,
        user_id: b.user_id,
        category_id: b.category_id,
        category_name: cat?.name || "Unknown",
        category_icon: cat?.icon || null,
        category_color: cat?.color || null,
        start_date: b.start_date,
        end_date: b.end_date,
        is_recurring: b.is_recurring,
        is_rollover: b.is_rollover,
        budget_status: b.status,
        budget_amount: Number(b.amount),
        rollover_amount: Number(b.rollover_amount || 0),
        effective_budget: effectiveBudget,
        spent_amount: spentAmount,
        remaining_amount: remainingAmount,
        percentage_used: percentageUsed,
        spending_status: spendingStatus,
        notes: b.notes || null,
        created_at: b.created_at,
      };
    });

    if (txError) throw txError;

    // Calculations
    const income = (currentTx || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = (currentTx || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const lastIncome = (lastTx || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const lastExpense = (lastTx || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

    const incomeChange = lastIncome > 0 ? ((income - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0;

    // Category Breakdown (Expense Only)
    const catMap = new Map<string, { value: number; color: string; icon: string }>();
    (currentTx || []).filter(t => t.type === 'expense').forEach(t => {
      const catName = t.category?.name || 'Uncategorized';
      const current = catMap.get(catName) || { value: 0, color: t.category?.color || '#cbd5e1', icon: t.category?.icon || '' };
      catMap.set(catName, { ...current, value: current.value + t.amount });
    });
    const categoryBreakdown = Array.from(catMap.entries()).map(([name, data]) => ({
      name,
      ...data,
      percentage: expense > 0 ? (data.value / expense) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // Daily Trend
    const dailyMap = new Map<string, number>();
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap.set(`${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`, 0);
    }
    (currentTx || []).filter(t => t.type === 'expense').forEach(t => {
      const dateStr = t.transaction_date.split('T')[0];
      if (dailyMap.has(dateStr)) {
         dailyMap.set(dateStr, dailyMap.get(dateStr)! + t.amount);
      }
    });
    const dailyTrend = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount
    }));

    // Top Transactions
    const topTransactions = [...(currentTx || [])]
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json({
      income,
      expense,
      balance,
      savingsRate,
      categoryBreakdown,
      dailyTrend,
      budgetPerformance: budgets || [],
      topTransactions,
      vsLastMonth: {
        incomeChange,
        expenseChange
      }
    });

  } catch (error) {
    console.error("Error generating report summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
