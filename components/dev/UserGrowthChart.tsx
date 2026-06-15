"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { chartTheme } from "@/lib/chart-theme";

interface UserGrowthChartProps {
  data: { date: string; newUsers: number; cumulativeUsers: number }[];
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No user data available yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDateLabel(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        />
        <Area
          type="monotone"
          dataKey="cumulativeUsers"
          name="Total Users"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#userGrowthGradient)"
        />
        <Area
          type="monotone"
          dataKey="newUsers"
          name="New Signups"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#newUsersGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
