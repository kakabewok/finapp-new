import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { differenceInDays, parseISO, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek } from "date-fns";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    
    // Default to current month if not provided
    const now = new Date();
    const defaultFrom = startOfMonth(now).toISOString().split('T')[0];
    const defaultTo = endOfMonth(now).toISOString().split('T')[0];
    
    const fromStr = searchParams.get("from") || defaultFrom;
    const toStr = searchParams.get("to") || defaultTo;

    // Parse dates and set time boundaries
    const dateFrom = `${fromStr}T00:00:00.000Z`;
    const dateTo = `${toStr}T23:59:59.999Z`;

    // Calculate the duration for previous period comparison
    const fromDate = parseISO(fromStr);
    const toDate = parseISO(toStr);
    const daysDiff = differenceInDays(toDate, fromDate) + 1;

    // Previous period is exactly the same number of days prior
    const lastPeriodFrom = subDays(fromDate, daysDiff);
    const lastPeriodTo = subDays(toDate, daysDiff);
    
    const lastDateFromStr = `${lastPeriodFrom.toISOString().split('T')[0]}T00:00:00.000Z`;
    const lastDateToStr = `${lastPeriodTo.toISOString().split('T')[0]}T23:59:59.999Z`;

    // 1. Transactions in selected period
    const { data: currentTx, error: txError } = await supabase
      .from("transactions")
      .select(`*, category:categories(name, icon, color)`)
      .eq("user_id", user.id)
      .gte("transaction_date", dateFrom)
      .lte("transaction_date", dateTo)
      .order("transaction_date", { ascending: true });

    // 2. Transactions in previous period
    const { data: lastTx } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .gte("transaction_date", lastDateFromStr)
      .lte("transaction_date", lastDateToStr);

    // 3. Budgets that overlap with this period
    const { data: rawBudgets } = await supabase
      .from("budgets")
      .select(`*, categories(name, icon, color)`)
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("start_date", toStr)
      .gte("end_date", fromStr);

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

    // Trend Over Time (Auto-scaling)
    const trendMap = new Map<string, number>();
    
    (currentTx || []).filter(t => t.type === 'expense').forEach(t => {
      const txDate = new Date(t.transaction_date);
      let groupKey = '';

      if (daysDiff <= 31) {
        // Group by day
        groupKey = txDate.toISOString().split('T')[0];
      } else if (daysDiff <= 90) {
        // Group by week
        const wStart = startOfWeek(txDate, { weekStartsOn: 1 }).toISOString().split('T')[0];
        groupKey = `Week of ${wStart}`;
      } else {
        // Group by month
        const mStart = startOfMonth(txDate).toISOString().split('T')[0];
        const mName = txDate.toLocaleString("default", { month: "short", year: "numeric" });
        groupKey = mName;
      }
      
      trendMap.set(groupKey, (trendMap.get(groupKey) || 0) + t.amount);
    });

    const dailyTrend = Array.from(trendMap.entries()).map(([date, amount]) => ({
      date,
      amount
    }));
    
    // Sort dailyTrend correctly if they are dates
    if (daysDiff <= 31 || daysDiff <= 90) {
      dailyTrend.sort((a, b) => {
        const dateA = a.date.startsWith("Week") ? new Date(a.date.split(" ")[2]).getTime() : new Date(a.date).getTime();
        const dateB = b.date.startsWith("Week") ? new Date(b.date.split(" ")[2]).getTime() : new Date(b.date).getTime();
        return dateA - dateB;
      });
    }

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
