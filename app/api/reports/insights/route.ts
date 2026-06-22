import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateFinancialInsights } from "@/lib/gemini";
import { formatCurrency } from "@/lib/utils";
import { differenceInDays, parseISO, startOfMonth, endOfMonth, subDays } from "date-fns";

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

    const [{ data: currentTx }, { data: lastTx }, { data: rawBudgets }] = await Promise.all([
      supabase.from("transactions").select("type, amount, category_id, category:categories(name)").eq("user_id", user.id).gte("transaction_date", dateFrom).lte("transaction_date", dateTo),
      supabase.from("transactions").select("type, amount").eq("user_id", user.id).gte("transaction_date", lastDateFromStr).lte("transaction_date", lastDateToStr),
      supabase.from("budgets").select("*, categories(name)").eq("user_id", user.id).eq("status", "active").lte("start_date", toStr).gte("end_date", fromStr)
    ]);

    const income = (currentTx || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = (currentTx || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const lastIncome = (lastTx || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const lastExpense = (lastTx || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

    const incomeChange = lastIncome > 0 ? ((income - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0;

    const budgetSummary = (rawBudgets || []).map(b => {
      const cat = b.categories as any;
      const catName = (Array.isArray(cat) ? cat[0]?.name : cat?.name) || "Unknown";
      const spentForCat = (currentTx || []).filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((a: number, t: any) => a + t.amount, 0);
      const effectiveBudget = Number(b.amount) + Number(b.rollover_amount || 0);
      const percentageUsed = effectiveBudget > 0 ? Math.round((spentForCat / effectiveBudget) * 100) : 0;
      const status = percentageUsed >= 100 ? 'overbudget' : percentageUsed >= 80 ? 'warning' : 'normal';
      return `${catName}: ${percentageUsed}% used (${status})`;
    }).join(", ");
    
    const catMap = new Map<string, number>();
    (currentTx || []).filter(t => t.type === 'expense').forEach(t => {
      const catData: any = t.category;
      const cat = (Array.isArray(catData) ? catData[0]?.name : catData?.name) || 'Uncategorized';
      catMap.set(cat, (catMap.get(cat) || 0) + t.amount);
    });
    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topCategories = sortedCats.map(c => `${c[0]} (${formatCurrency(c[1], 'IDR')})`).join(", ");

    const aiInput = {
      income: formatCurrency(income, 'IDR'),
      expense: formatCurrency(expense, 'IDR'),
      balance: formatCurrency(balance, 'IDR'),
      savingsRate: parseFloat(savingsRate.toFixed(1)),
      budgetSummary: budgetSummary || "No budgets set",
      topCategories: topCategories || "No expenses",
      incomeChange: parseFloat(incomeChange.toFixed(1)),
      expenseChange: parseFloat(expenseChange.toFixed(1))
    };

    const insightData = await generateFinancialInsights(aiInput);

    if (!insightData) {
      return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }

    return NextResponse.json(insightData);
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
