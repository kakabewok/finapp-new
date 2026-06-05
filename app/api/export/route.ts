import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Papa from "papaparse";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all transactions for the user
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        id,
        transaction_date,
        type,
        amount,
        currency,
        merchant_name,
        description,
        payment_method,
        source,
        category:categories(name)
      `)
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions for export:", error);
      return new NextResponse("Failed to fetch data", { status: 500 });
    }

    // Flatten nested objects and format data for CSV
    const csvData = transactions.map((t) => ({
      ID: t.id,
      Date: t.transaction_date,
      Type: t.type,
      Category: Array.isArray(t.category) ? t.category[0]?.name || "Uncategorized" : (t.category as any)?.name || "Uncategorized",
      Merchant: t.merchant_name || "",
      Amount: t.amount,
      Currency: t.currency,
      PaymentMethod: t.payment_method || "",
      Description: t.description || "",
      Source: t.source,
    }));

    // Generate CSV string using PapaParse
    const csvString = Papa.unparse(csvData);

    // Set headers for file download
    const filename = `siboros_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    
    return new NextResponse(csvString, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
