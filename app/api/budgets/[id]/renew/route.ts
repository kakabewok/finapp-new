import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { workspace_id } = body;

    // 1. Fetch the budget
    let fetchQuery = supabase
      .from("budgets")
      .select("*")
      .eq("id", id);

    if (workspace_id) {
      fetchQuery = fetchQuery.eq("workspace_id", workspace_id);
    } else {
      fetchQuery = fetchQuery.is("workspace_id", null).eq("user_id", user.id);
    }

    const { data: budget, error: fetchError } = await fetchQuery.single();

    if (fetchError || !budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // 2. Validate: must be recurring, active, and expired
    if (!budget.is_recurring) {
      return NextResponse.json({ error: "Budget is not recurring" }, { status: 400 });
    }
    if (budget.status !== "active") {
      return NextResponse.json({ error: "Budget is not active" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(budget.end_date);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate >= today) {
      return NextResponse.json({ error: "Budget period has not expired yet" }, { status: 400 });
    }

    // 3. Calculate duration and new period
    const startDate = new Date(budget.start_date);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

    const newStartDate = new Date(endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + durationDays);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // 4. Compute total_spent for the current period
    let txQuery = supabase
      .from("transactions")
      .select("amount")
      .eq("type", "expense")
      .eq("category_id", budget.category_id)
      .gte("transaction_date", budget.start_date)
      .lte("transaction_date", budget.end_date);

    if (workspace_id) {
      txQuery = txQuery.eq("workspace_id", workspace_id);
    } else {
      txQuery = txQuery.is("workspace_id", null).eq("user_id", user.id);
    }

    const { data: transactions } = await txQuery;

    const totalSpent = (transactions || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
    const plannedAmount = Number(budget.amount) + Number(budget.rollover_amount || 0);
    const remainingAmount = plannedAmount - totalSpent;

    // 5. Archive current period to budget_history
    const { error: historyError } = await supabase
      .from("budget_history")
      .insert({
        original_budget_id: budget.id,
        user_id: user.id,
        workspace_id: workspace_id || null,
        category_id: budget.category_id,
        start_date: budget.start_date,
        end_date: budget.end_date,
        planned_amount: plannedAmount,
        total_spent: totalSpent,
        remaining_amount: remainingAmount,
      });

    if (historyError) {
      console.error("Error creating budget history:", historyError);
      return NextResponse.json({ error: "Failed to archive budget period" }, { status: 500 });
    }

    // 6. Calculate new planned_amount based on rollover
    const originalAmount = Number(budget.amount);
    let newPlannedAmount = originalAmount;
    let newRolloverAmount = 0;

    if (budget.is_rollover && remainingAmount > 0) {
      // Surplus: carry over the remaining amount
      newPlannedAmount = originalAmount + remainingAmount;
      newRolloverAmount = remainingAmount;
    }
    // If over budget or rollover disabled: reset to original amount

    // 7. Update the budget with new period
    let updateQuery = supabase
      .from("budgets")
      .update({
        start_date: formatDate(newStartDate),
        end_date: formatDate(newEndDate),
        amount: originalAmount, // Keep original base amount
        rollover_amount: newRolloverAmount,
        // Also update month/year for backward compat
        month: newStartDate.getMonth() + 1,
        year: newStartDate.getFullYear(),
      })
      .eq("id", id);

    if (workspace_id) {
      updateQuery = updateQuery.eq("workspace_id", workspace_id);
    } else {
      updateQuery = updateQuery.is("workspace_id", null).eq("user_id", user.id);
    }

    const { data: updatedBudget, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.error("Error updating budget:", updateError);
      return NextResponse.json({ error: "Failed to renew budget" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      budget: updatedBudget,
      history: {
        planned_amount: plannedAmount,
        total_spent: totalSpent,
        remaining_amount: remainingAmount,
      },
      renewal: {
        new_start_date: formatDate(newStartDate),
        new_end_date: formatDate(newEndDate),
        new_planned_amount: newPlannedAmount,
        rollover_amount: newRolloverAmount,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
