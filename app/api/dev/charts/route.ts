import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // 1. Auth guard
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

    // 2. Admin client
    const admin = createSupabaseAdminClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // ── User Growth (last 30 days) ────────────────────────────
    const {
      data: { users },
      error: usersError,
    } = await admin.auth.admin.listUsers({ perPage: 1000 });

    if (usersError) throw usersError;

    // Build daily user signup counts for last 30 days
    const userGrowth: { date: string; newUsers: number; cumulativeUsers: number }[] = [];
    
    // Sort users by creation date
    const sortedUsers = [...users].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const newUsers = users.filter((u) => {
        const created = new Date(u.created_at).toISOString().split("T")[0];
        return created === dateStr;
      }).length;

      // Cumulative: count of all users created on or before this date
      const cumulative = sortedUsers.filter(
        (u) => new Date(u.created_at).toISOString().split("T")[0] <= dateStr
      ).length;

      userGrowth.push({
        date: dateStr,
        newUsers,
        cumulativeUsers: cumulative,
      });
    }

    // ── Active Users (daily, last 14 days) ────────────────────
    const activeUsersDaily: { date: string; activeUsers: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Count users who signed in on or after this date (approximation using last_sign_in_at)
      const active = users.filter((u) => {
        if (!u.last_sign_in_at) return false;
        const signInDate = new Date(u.last_sign_in_at).toISOString().split("T")[0];
        return signInDate >= dateStr;
      }).length;

      activeUsersDaily.push({ date: dateStr, activeUsers: active });
    }

    // ── Transaction Volume (last 30 days, split by type) ──────
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: recentTx } = await admin
      .from("transactions")
      .select("transaction_date, type")
      .gte("transaction_date", thirtyDaysAgoStr);

    const txVolumeMap = new Map<string, { income: number; expense: number }>();

    // Initialize all 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      txVolumeMap.set(dateStr, { income: 0, expense: 0 });
    }

    (recentTx || []).forEach((tx: any) => {
      const dateStr = tx.transaction_date?.split("T")[0];
      if (dateStr && txVolumeMap.has(dateStr)) {
        const entry = txVolumeMap.get(dateStr)!;
        if (tx.type === "income") {
          entry.income++;
        } else {
          entry.expense++;
        }
      }
    });

    const transactionVolume = Array.from(txVolumeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        income: counts.income,
        expense: counts.expense,
        total: counts.income + counts.expense,
      }));

    // ── Category Distribution (top 8 most used) ───────────────
    const { data: catTx } = await admin
      .from("transactions")
      .select("category:categories(name, color)");

    const catCountMap = new Map<string, { count: number; color: string }>();

    (catTx || []).forEach((tx: any) => {
      const catName = tx.category?.name || "Uncategorized";
      const catColor = tx.category?.color || "#6b7280";
      if (!catCountMap.has(catName)) {
        catCountMap.set(catName, { count: 0, color: catColor });
      }
      catCountMap.get(catName)!.count++;
    });

    const categoryDistribution = Array.from(catCountMap.entries())
      .map(([name, { count, color }]) => ({ name, count, color }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      userGrowth,
      activeUsersDaily,
      transactionVolume,
      categoryDistribution,
    });
  } catch (error) {
    console.error("Dev Charts API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
