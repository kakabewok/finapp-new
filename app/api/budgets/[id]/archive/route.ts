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

    const { data, error } = await supabase
      .from("budgets")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error archiving budget:", error);
      return NextResponse.json({ error: "Failed to archive budget" }, { status: 500 });
    }

    return NextResponse.json({ success: true, budget: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
