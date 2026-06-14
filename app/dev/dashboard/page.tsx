"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Activity,
  TrendingUp,
  CalendarDays,
  Wallet,
  BarChart3,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { UserGrowthChart } from "@/components/dev/UserGrowthChart";
import { ActiveUsersChart } from "@/components/dev/ActiveUsersChart";
import { TransactionsChart } from "@/components/dev/TransactionsChart";
import { CategoryDistributionChart } from "@/components/dev/CategoryDistributionChart";

// ── Types ───────────────────────────────────────────────────
interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

interface TransactionStats {
  totalTransactions: number;
  transactionsToday: number;
  transactionsThisWeek: number;
  transactionsThisMonth: number;
}

interface BudgetStats {
  usersWithBudgets: number;
}

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  transaction_count: number;
}

interface RecentTx {
  id: string;
  user_email: string;
  amount: number;
  type: string;
  transaction_date: string;
  merchant_name: string | null;
  description: string | null;
  category: string;
}

interface DevData {
  userStats: UserStats;
  transactionStats: TransactionStats;
  budgetStats: BudgetStats;
  userTable: UserRow[];
  recentActivity: RecentTx[];
}

interface ChartsData {
  userGrowth: { date: string; newUsers: number; cumulativeUsers: number }[];
  activeUsersDaily: { date: string; activeUsers: number }[];
  transactionVolume: { date: string; income: number; expense: number; total: number }[];
  categoryDistribution: { name: string; count: number; color: string }[];
}

// ── Helpers ─────────────────────────────────────────────────
function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Component ───────────────────────────────────────────────
export default function DevDashboardPage() {
  const [data, setData] = useState<DevData | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/dev/stats");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to fetch");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCharts = async () => {
    try {
      setChartsLoading(true);
      const res = await fetch("/api/dev/charts");
      if (!res.ok) return;
      const json = await res.json();
      setChartsData(json);
    } catch {
      // Charts are non-critical — silently ignore
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCharts();
  }, []);

  const handleRefresh = () => {
    fetchData();
    fetchCharts();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[320px] bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive text-lg font-medium">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { userStats, transactionStats, budgetStats, userTable, recentActivity } =
    data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              Monitoring
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Cross-user stats &amp; activity overview.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={userStats.totalUsers}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Active (30d)"
          value={userStats.activeUsers}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="New This Month"
          value={userStats.newUsersThisMonth}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Total Transactions"
          value={transactionStats.totalTransactions}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Today"
          value={transactionStats.transactionsToday}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Budget Users"
          value={budgetStats.usersWithBudgets}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      {/* ── Transaction Timeline ───────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            This Week
          </p>
          <p className="text-2xl font-semibold">
            {transactionStats.transactionsThisWeek}
          </p>
          <p className="text-xs text-muted-foreground">transactions</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            This Month
          </p>
          <p className="text-2xl font-semibold">
            {transactionStats.transactionsThisMonth}
          </p>
          <p className="text-xs text-muted-foreground">transactions</p>
        </div>
      </div>

      {/* ── Analytics Charts ───────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Analytics</h2>
        {chartsLoading ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[320px] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : chartsData ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ChartCard title="User Growth" subtitle="Last 30 days">
              <UserGrowthChart data={chartsData.userGrowth} />
            </ChartCard>
            <ChartCard title="Active Users" subtitle="Last 14 days">
              <ActiveUsersChart data={chartsData.activeUsersDaily} />
            </ChartCard>
            <ChartCard title="Transaction Volume" subtitle="Last 30 days — Income vs Expense">
              <TransactionsChart data={chartsData.transactionVolume} />
            </ChartCard>
            <ChartCard title="Category Distribution" subtitle="Most used categories">
              <CategoryDistributionChart data={chartsData.categoryDistribution} />
            </ChartCard>
          </div>
        ) : (
          <div className="border rounded-lg p-12 text-center text-muted-foreground text-sm">
            Unable to load chart data. Try refreshing.
          </div>
        )}
      </section>

      {/* ── User Table ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Users</h2>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Last Active
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {userTable.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  userTable.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">{u.email}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(u.last_sign_in_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {u.transaction_count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Recent Activity ────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No recent activity.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[180px]">
                        {tx.user_email}
                      </td>
                      <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">
                        {tx.merchant_name || tx.description || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {tx.category}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                          tx.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(tx.transaction_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ── Chart Card ──────────────────────────────────────────────
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="h-[260px] w-full">{children}</div>
    </div>
  );
}

