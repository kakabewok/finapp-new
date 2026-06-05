import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BudgetItem } from "@/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month date range
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    // 1. Fetch categories that have a budget set
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${user.id},is_default.eq.true`)
      .not('budget_monthly', 'is', null);

    if (catError) throw catError;

    // If no budgets set, return empty
    if (!categories || categories.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch expenses for this month for those categories
    const categoryIds = categories.map(c => c.id);
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("transaction_date", firstDay)
      .lte("transaction_date", lastDay)
      .in("category_id", categoryIds);

    if (txError) throw txError;

    // 3. Aggregate spending by category
    const spendingMap = new Map<string, number>();
    transactions.forEach(tx => {
      const current = spendingMap.get(tx.category_id) || 0;
      spendingMap.set(tx.category_id, current + Number(tx.amount));
    });

    // 4. Construct Budget Items
    const budgetItems: BudgetItem[] = categories.map(category => {
      const spent = spendingMap.get(category.id) || 0;
      const budget = Number(category.budget_monthly);
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      
      let status: 'normal' | 'warning' | 'alert' = 'normal';
      if (percentage >= 100) status = 'alert';
      else if (percentage >= 80) status = 'warning';

      return {
        category,
        spent,
        budget,
        percentage: Math.min(percentage, 100), // Cap at 100% for progress bars
        status
      };
    });

    // Sort by percentage descending
    budgetItems.sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json(budgetItems);
  } catch (error) {
    console.error("Budget API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Set a budget for a category
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category_id, amount } = await request.json();

    if (!category_id || amount === undefined) {
      return NextResponse.json({ error: "Category and amount required" }, { status: 400 });
    }

    // Default categories can't be updated directly since they are shared.
    // In a real app, you'd create a user_budgets table or copy default categories to the user's space.
    // For this implementation, we assume default categories are copied to the user on signup via the SQL trigger,
    // wait, the SQL trigger creates rows with user_id = NEW.id. So they ARE user specific! 
    // They just have is_default = true. So we CAN update them safely.

    const { error } = await supabase
      .from("categories")
      .update({ budget_monthly: amount > 0 ? amount : null })
      .eq("id", category_id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Budget Update Error:", error);
      return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Budget API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
