"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { chartTheme } from "@/lib/chart-theme";

interface TransactionsChartProps {
  data: { date: string; income: number; expense: number; total: number }[];
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TransactionsChart({ data }: TransactionsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No transaction data available yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDateLabel(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} vertical={chartTheme.grid.vertical} stroke={chartTheme.grid.stroke} />
        <XAxis
          dataKey="label"
          tick={chartTheme.axis}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={chartTheme.axis}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          itemStyle={chartTheme.tooltip.itemStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          cursor={chartTheme.tooltip.cursor}
        />
        <Legend
          wrapperStyle={chartTheme.legend.wrapperStyle}
        />
        <Bar
          dataKey="income"
          name="Income"
          fill="#10b981"
          stackId="tx"
          radius={[0, 0, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="expense"
          name="Expense"
          fill="#f43f5e"
          stackId="tx"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
