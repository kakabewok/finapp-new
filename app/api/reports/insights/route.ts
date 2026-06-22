import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateFinancialInsights } from "@/lib/gemini";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "");

    // Fetch required data to feed to AI
    const url = new URL(request.url);
    const summaryUrl = `${url.origin}/api/reports/summary?month=${month}&year=${year}`;
    
    // Instead of making a full HTTP request to ourselves, let's just use the query logic
    // But to keep it simple, we can fetch from our own endpoint but pass the auth cookie manually.
    // Or just repeat the core aggregation logic. It's cleaner to just fetch the summary endpoint.
    
    // Actually, making an HTTP fetch to the same app during a request might hang if we don't pass cookies,
    // and sometimes Next.js doesn't like absolute URL fetches to itself in serverless.
    // Let's do the DB query directly.

    const dateFrom = new Date(year, month - 1, 1).toISOString();
    const dateTo = new Date(year, month, 0, 23, 59, 59).toISOString();

    const lastMonthDateFrom = new Date(year, month - 2, 1).toISOString();
    const lastMonthDateTo = new Date(year, month - 1, 0, 23, 59, 59).toISOString();

    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    const [{ data: currentTx }, { data: lastTx }, { data: rawBudgets }] = await Promise.all([
      supabase.from("transactions").select("type, amount, category_id, category:categories(name)").eq("user_id", user.id).gte("transaction_date", dateFrom).lte("transaction_date", dateTo),
      supabase.from("transactions").select("type, amount").eq("user_id", user.id).gte("transaction_date", lastMonthDateFrom).lte("transaction_date", lastMonthDateTo),
      supabase.from("budgets").select("*, categories(name)").eq("user_id", user.id).eq("status", "active").lte("start_date", monthEnd).gte("end_date", monthStart)
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
