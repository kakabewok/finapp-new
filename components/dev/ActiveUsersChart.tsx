"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { chartTheme } from "@/lib/chart-theme";

interface ActiveUsersChartProps {
  data: { date: string; activeUsers: number }[];
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActiveUsersChart({ data }: ActiveUsersChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No activity data available yet.
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
        <Bar
          dataKey="activeUsers"
          name="Active Users"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
