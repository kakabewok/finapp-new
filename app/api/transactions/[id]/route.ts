import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const transactionItemSchema = z.object({
  name: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
});

const updateTransactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  currency: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  merchant_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  transaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }).optional(),
  receipt_url: z.string().url().nullable().optional(),
  receipt_public_id: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  items: z.array(transactionItemSchema).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const validatedData = updateTransactionSchema.parse(body);

    const { data, error } = await supabase
      .from("transactions")
      .update(validatedData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating transaction:", error);
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
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

    // First, check if transaction exists and has a receipt image to delete from Cloudinary
    // This could be implemented with a trigger, but doing it in the API is safer
    // to ensure Cloudinary delete happens.
    
    // For now, we'll just delete the DB record. Cloudinary cleanup can be done async
    // or via a separate endpoint if needed to decouple from fast DB response.
    
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting transaction:", error);
      return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
