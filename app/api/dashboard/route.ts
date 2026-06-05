import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("range") || "30d"; // 7d, 30d, 90d, 1y, all
    
    // Calculate dates
    const today = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();

    if (dateRange === "7d") {
      startDate.setDate(today.getDate() - 7);
      previousStartDate.setDate(today.getDate() - 14);
      previousEndDate.setDate(today.getDate() - 7);
    } else if (dateRange === "30d") {
      startDate.setDate(today.getDate() - 30);
      previousStartDate.setDate(today.getDate() - 60);
      previousEndDate.setDate(today.getDate() - 30);
    } else if (dateRange === "90d") {
      startDate.setDate(today.getDate() - 90);
      previousStartDate.setDate(today.getDate() - 180);
      previousEndDate.setDate(today.getDate() - 90);
    } else if (dateRange === "1y") {
      startDate.setFullYear(today.getFullYear() - 1);
      previousStartDate.setFullYear(today.getFullYear() - 2);
      previousEndDate.setFullYear(today.getFullYear() - 1);
    } else {
      // all time
      startDate = new Date("1970-01-01");
      previousStartDate = new Date("1970-01-01");
      previousEndDate = new Date("1970-01-01");
    }

    const startIso = startDate.toISOString().split("T")[0];
    const prevStartIso = previousStartDate.toISOString().split("T")[0];
    const prevEndIso = previousEndDate.toISOString().split("T")[0];

    // 1. Fetch current period transactions
    const { data: currentTx, error: err1 } = await supabase
      .from("transactions")
      .select("amount, type, transaction_date, category_id, category:categories(name, color, icon)")
      .eq("user_id", user.id)
      .gte("transaction_date", startIso);

    if (err1) throw err1;

    // 2. Fetch previous period transactions (for % change calculation)
    let previousTx: any[] = [];
    if (dateRange !== "all") {
      const { data: prevTx, error: err2 } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("transaction_date", prevStartIso)
        .lt("transaction_date", prevEndIso);
      
      if (err2) throw err2;
      previousTx = prevTx;
    }

    // Process Summary
    let totalIncome = 0;
    let totalExpense = 0;
    currentTx.forEach(tx => {
      if (tx.type === "income") totalIncome += Number(tx.amount);
      if (tx.type === "expense") totalExpense += Number(tx.amount);
    });

    let prevTotalIncome = 0;
    let prevTotalExpense = 0;
    previousTx.forEach(tx => {
      if (tx.type === "income") prevTotalIncome += Number(tx.amount);
      if (tx.type === "expense") prevTotalExpense += Number(tx.amount);
    });

    const netBalance = totalIncome - totalExpense;
    const prevNetBalance = prevTotalIncome - prevTotalExpense;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const summary = {
      totalIncome,
      totalExpenses: totalExpense,
      netBalance,
      incomeChange: calculateChange(totalIncome, prevTotalIncome),
      expenseChange: calculateChange(totalExpense, prevTotalExpense),
      balanceChange: calculateChange(netBalance, prevNetBalance),
    };

    // Process Trend Data
    // Group by date
    const trendMap = new Map();
    currentTx.forEach(tx => {
      const date = tx.transaction_date;
      if (!trendMap.has(date)) {
        trendMap.set(date, { date, income: 0, expense: 0 });
      }
      const existing = trendMap.get(date);
      if (tx.type === "income") existing.income += Number(tx.amount);
      if (tx.type === "expense") existing.expense += Number(tx.amount);
    });
    
    const trendData = Array.from(trendMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Process Category Breakdown (Expenses only)
    const categoryMap = new Map();
    let expenseTotalForCategories = 0;
    
    currentTx.filter(tx => tx.type === "expense").forEach(tx => {
      expenseTotalForCategories += Number(tx.amount);
      const catId = tx.category_id || "uncategorized";
      const cat = tx.category as any;
      const catName = cat?.name || cat?.[0]?.name || "Uncategorized";
      const catColor = cat?.color || cat?.[0]?.color || "#94a3b8"; // fallback color
      const catIcon = cat?.icon || cat?.[0]?.icon || "❓";
      
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: catName, value: 0, color: catColor, icon: catIcon });
      }
      categoryMap.get(catId).value += Number(tx.amount);
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        percentage: expenseTotalForCategories > 0 ? (cat.value / expenseTotalForCategories) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories

    return NextResponse.json({
      summary,
      trendData,
      categoryBreakdown
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
