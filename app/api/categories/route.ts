import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  type: z.enum(["expense", "income", "both"]),
  workspace_id: z.string().uuid().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Auth check is handled by proxy, but good practice to verify here
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");

    let query = supabase.from("categories").select("*").order("name");

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null).eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
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
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = categorySchema.parse(body);

    let duplicateQuery = supabase
      .from("categories")
      .select("id")
      .ilike("name", validatedData.name.trim())
      .limit(1);

    if (validatedData.workspace_id) {
      duplicateQuery = duplicateQuery.eq("workspace_id", validatedData.workspace_id);
    } else {
      duplicateQuery = duplicateQuery.is("workspace_id", null).eq("user_id", user.id);
    }

    const { data: existing, error: checkError } = await duplicateQuery;

    if (checkError) {
      console.error("Error checking duplicate category:", checkError);
    } else if (existing && existing.length > 0) {
      return NextResponse.json({ error: `Category "${validatedData.name}" already exists` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        ...validatedData,
        user_id: user.id,
        is_default: false,
        workspace_id: validatedData.workspace_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
