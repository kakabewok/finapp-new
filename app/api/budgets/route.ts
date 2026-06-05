import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const budgetSchema = z.object({
  category_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number(),
  amount: z.number().positive(),
  rollover_enabled: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1 + "");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear() + "");

    const { data, error } = await supabase
      .from("budget_summary")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year);

    if (error) {
      console.error("Error fetching budgets:", error);
      return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
    }

    return NextResponse.json(data);
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

    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        { ...validatedData, user_id: user.id },
        { onConflict: 'user_id, category_id, month, year' }
      )
      .select()
      .single();

    if (error) {
      console.error("Error creating budget:", error);
      return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
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
