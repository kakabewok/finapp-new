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

    const { data, error } = await supabase
      .from("budget_history")
      .select("*")
      .eq("original_budget_id", id)
      .eq("user_id", user.id)
      .order("end_date", { ascending: false });

    if (error) {
      console.error("Error fetching budget history:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
