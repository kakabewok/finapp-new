import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  amount: z.number().positive().optional(),
  category_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_recurring: z.boolean().optional(),
  is_rollover: z.boolean().optional(),
  status: z.enum(["active", "archived"]).optional(),
  notes: z.string().nullable().optional(),
});

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

    const { data: budget, error } = await supabase
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
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Compute spent amount
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("category_id", budget.category_id)
      .gte("transaction_date", budget.start_date)
      .lte("transaction_date", budget.end_date);

    const spentAmount = (transactions || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
    const cat = budget.categories as any;
    const effectiveBudget = Number(budget.amount) + Number(budget.rollover_amount || 0);
    const remainingAmount = effectiveBudget - spentAmount;
    const percentageUsed = effectiveBudget > 0 ? Math.round((spentAmount / effectiveBudget) * 100) : 0;

    let spendingStatus: 'normal' | 'warning' | 'overbudget' = 'normal';
    if (percentageUsed >= 100) spendingStatus = 'overbudget';
    else if (percentageUsed >= 80) spendingStatus = 'warning';

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = patchSchema.parse(body);

    // If setting is_recurring to false, also force is_rollover to false
    const updatePayload: Record<string, any> = { ...validatedData };
    if (validatedData.is_recurring === false) {
      updatePayload.is_rollover = false;
    }

    // Validate end_date > start_date if both are provided
    if (updatePayload.start_date && updatePayload.end_date) {
      if (new Date(updatePayload.end_date) <= new Date(updatePayload.start_date)) {
        return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("budgets")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
