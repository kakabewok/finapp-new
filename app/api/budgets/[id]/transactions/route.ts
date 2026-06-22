import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Fetch the budget to get category_id and date range
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("category_id, start_date, end_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // 2. Fetch transactions matching category + date range
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select(`*, category:categories(name, icon, color)`)
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("category_id", budget.category_id)
      .gte("transaction_date", budget.start_date)
      .lte("transaction_date", budget.end_date)
      .order("transaction_date", { ascending: false });

    if (txError) {
      console.error("Error fetching transactions:", txError);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }

    return NextResponse.json({
      transactions: transactions || [],
      count: (transactions || []).length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
