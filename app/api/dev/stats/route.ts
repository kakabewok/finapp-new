import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // 1. Auth guard — check if user is the developer
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devEmail = process.env.DEV_EMAIL;
    if (!devEmail || user.email !== devEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Use admin client for cross-user queries
    const admin = createSupabaseAdminClient();

    // ── User Stats ──────────────────────────────────────────
    const {
      data: { users },
      error: usersError,
    } = await admin.auth.admin.listUsers({ perPage: 1000 });

    if (usersError) throw usersError;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = users.length;
    const activeUsers = users.filter(
      (u) =>
        u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo
    ).length;
    const newUsersThisMonth = users.filter(
      (u) => new Date(u.created_at) >= startOfMonth
    ).length;

    // ── Transaction Stats ───────────────────────────────────
    const todayStr = now.toISOString().split("T")[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    // Total transactions
    const { count: totalTransactions } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true });

    // Transactions today
    const { count: transactionsToday } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .gte("transaction_date", todayStr);

    // Transactions this week
    const { count: transactionsThisWeek } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .gte("transaction_date", startOfWeekStr);

    // Transactions this month
    const { count: transactionsThisMonth } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .gte("transaction_date", startOfMonthStr);

    // ── Budget Stats ────────────────────────────────────────
    const { data: budgetUsers } = await admin
      .from("budgets")
      .select("user_id");

    const uniqueBudgetUsers = new Set(
      (budgetUsers || []).map((b: { user_id: string }) => b.user_id)
    ).size;

    // ── User Table ──────────────────────────────────────────
    // Get transaction counts per user
    const { data: txCountsRaw } = await admin
      .from("transactions")
      .select("user_id");

    const txCountMap = new Map<string, number>();
    (txCountsRaw || []).forEach((row: { user_id: string }) => {
      txCountMap.set(row.user_id, (txCountMap.get(row.user_id) || 0) + 1);
    });

    const userTable = users.map((u) => ({
      id: u.id,
      email: u.email || "N/A",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      transaction_count: txCountMap.get(u.id) || 0,
    }));

    // Sort: most transactions first
    userTable.sort((a, b) => b.transaction_count - a.transaction_count);

    // ── Recent Activity ─────────────────────────────────────
    const { data: recentTx } = await admin
      .from("transactions")
      .select(
        "id, user_id, amount, type, transaction_date, merchant_name, description, category:categories(name)"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    // Map user emails
    const userEmailMap = new Map<string, string>();
    users.forEach((u) => userEmailMap.set(u.id, u.email || "N/A"));

    const recentActivity = (recentTx || []).map((tx: any) => ({
      id: tx.id,
      user_email: userEmailMap.get(tx.user_id) || "Unknown",
      amount: tx.amount,
      type: tx.type,
      transaction_date: tx.transaction_date,
      merchant_name: tx.merchant_name,
      description: tx.description,
      category: tx.category?.name || "Uncategorized",
    }));

    return NextResponse.json({
      userStats: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
      },
      transactionStats: {
        totalTransactions: totalTransactions || 0,
        transactionsToday: transactionsToday || 0,
        transactionsThisWeek: transactionsThisWeek || 0,
        transactionsThisMonth: transactionsThisMonth || 0,
      },
      budgetStats: {
        usersWithBudgets: uniqueBudgetUsers,
      },
      userTable,
      recentActivity,
    });
  } catch (error) {
    console.error("Dev Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
