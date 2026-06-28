import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const budgetSchema = z.object({
  category_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  amount: z.number().positive(),
  is_recurring: z.boolean().default(false),
  is_rollover: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  workspace_id: z.string().uuid().nullable().optional(),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const workspaceId = searchParams.get("workspace_id");

    // 1. Fetch budgets for this user with category info
    let query = supabase
      .from("budgets")
      .select(`
        *,
        categories (
          id,
          name,
          icon,
          color,
          type
        )
      `);

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null).eq("user_id", user.id);
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: budgets, error: budgetError } = await query.order("start_date", { ascending: false });

    if (budgetError) {
      console.error("Error fetching budgets:", budgetError);
      return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
    }

    if (!budgets || budgets.length === 0) {
      return NextResponse.json([]);
    }

    // 2. For each budget, compute spent_amount from transactions
    // Batch-fetch all relevant transactions for all budgets' date ranges
    // We'll group by category_id + date range
    const categoryIds = [...new Set(budgets.map(b => b.category_id))];
    
    // Get earliest start_date and latest end_date to narrow the query
    const earliestStart = budgets.reduce((min, b) => b.start_date < min ? b.start_date : min, budgets[0].start_date);
    const latestEnd = budgets.reduce((max, b) => b.end_date > max ? b.end_date : max, budgets[0].end_date);

    let txQuery = supabase
      .from("transactions")
      .select("amount, category_id, transaction_date")
      .eq("type", "expense")
      .in("category_id", categoryIds)
      .gte("transaction_date", earliestStart)
      .lte("transaction_date", latestEnd);

    if (workspaceId) {
      txQuery = txQuery.eq("workspace_id", workspaceId);
    } else {
      txQuery = txQuery.is("workspace_id", null).eq("user_id", user.id);
    }

    const { data: transactions, error: txError } = await txQuery;

    if (txError) {
      console.error("Error fetching transactions:", txError);
    }

    // 3. Build enriched summaries
    const enrichedBudgets = budgets.map((budget) => {
      const cat = budget.categories as any;
      
      // Calculate spent for this specific budget's date range and category
      const spentAmount = (transactions || [])
        .filter(tx => 
          tx.category_id === budget.category_id &&
          tx.transaction_date >= budget.start_date &&
          tx.transaction_date <= budget.end_date
        )
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const effectiveBudget = Number(budget.amount) + Number(budget.rollover_amount || 0);
      const remainingAmount = effectiveBudget - spentAmount;
      const percentageUsed = effectiveBudget > 0 ? Math.round((spentAmount / effectiveBudget) * 100) : 0;

      let spendingStatus: 'normal' | 'warning' | 'overbudget' = 'normal';
      if (percentageUsed >= 100) spendingStatus = 'overbudget';
      else if (percentageUsed >= 80) spendingStatus = 'warning';

      return {
        id: budget.id,
        user_id: budget.user_id,
        category_id: budget.category_id,
        category_name: cat?.name || "Unknown",
        category_icon: cat?.icon || null,
        category_color: cat?.color || null,
        start_date: budget.start_date,
        end_date: budget.end_date,
        is_recurring: budget.is_recurring,
        is_rollover: budget.is_rollover,
        budget_status: budget.status,
        budget_amount: Number(budget.amount),
        rollover_amount: Number(budget.rollover_amount || 0),
        effective_budget: effectiveBudget,
        spent_amount: spentAmount,
        remaining_amount: remainingAmount,
        percentage_used: percentageUsed,
        spending_status: spendingStatus,
        notes: budget.notes || null,
        created_at: budget.created_at,
      };
    });

    return NextResponse.json(enrichedBudgets);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = budgetSchema.parse(body);

    if (validatedData.workspace_id) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", validatedData.workspace_id)
        .eq("user_id", user.id)
        .single();
      
      if (!membership || !["owner", "admin", "member"].includes(membership.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // If rollover is enabled but recurring is not, force rollover off
    const isRollover = validatedData.is_recurring ? validatedData.is_rollover : false;

    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        workspace_id: validatedData.workspace_id || null,
        category_id: validatedData.category_id,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        amount: validatedData.amount,
        is_recurring: validatedData.is_recurring,
        is_rollover: isRollover,
        status: 'active',
        rollover_amount: 0,
        notes: validatedData.notes || null,
        // Keep month/year for backward compat during transition
        month: new Date(validatedData.start_date).getMonth() + 1,
        year: new Date(validatedData.start_date).getFullYear(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating budget:", error);
      return NextResponse.json({ error: "Failed to create budget", details: error }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
