import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const transactionItemSchema = z.object({
  name: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
});

const otherFeeSchema = z.object({
  name: z.string(),
  amount: z.number(),
});

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("IDR"),
  category_id: z.string().uuid().nullable().optional(),
  merchant_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  transaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  subtotal: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  service_charge: z.number().nullable().optional(),
  other_fees: z.array(otherFeeSchema).nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
  receipt_public_id: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  items: z.array(transactionItemSchema).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  source: z.enum(["manual", "scan"]).default("manual"),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const amountMin = searchParams.get("amountMin");
    const amountMax = searchParams.get("amountMax");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "transaction_date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("transactions")
      .select(`
        *,
        category:categories(*)
      `, { count: "exact" })
      .eq("user_id", user.id);

    // Apply filters
    if (dateFrom) query = query.gte("transaction_date", dateFrom);
    if (dateTo) query = query.lte("transaction_date", dateTo);
    if (category) query = query.eq("category_id", category);
    if (type) query = query.eq("type", type);
    if (amountMin) query = query.gte("amount", amountMin);
    if (amountMax) query = query.lte("amount", amountMax);
    if (search) {
      query = query.or(`merchant_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting & pagination
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
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
