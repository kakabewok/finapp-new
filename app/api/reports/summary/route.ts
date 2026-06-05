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

    // 3. Budgets this month
    const { data: budgets } = await supabase
      .from("budget_summary")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year);

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
