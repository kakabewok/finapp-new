import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  budget_monthly: z.number().nullable().optional(),
  type: z.enum(["expense", "income", "both"]).optional(),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Ensure user owns the category and it's not a default one
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("is_default, user_id")
      .eq("id", id)
      .single();

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existingCategory.is_default || existingCategory.user_id !== user.id) {
      return NextResponse.json({ error: "Cannot modify this category" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("categories")
      .update(validatedData)
      .eq("id", id)
      .eq("user_id", user.id) // Extra safety
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user owns the category and it's not a default one
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("is_default, user_id")
      .eq("id", id)
      .single();

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existingCategory.is_default || existingCategory.user_id !== user.id) {
      return NextResponse.json({ error: "Cannot delete this category" }, { status: 403 });
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
