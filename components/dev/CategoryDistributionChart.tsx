"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { chartTheme, CHART_COLORS } from "@/lib/chart-theme";

interface CategoryDistributionChartProps {
  data: { name: string; count: number; color: string }[];
}

// Fallback palette if categories lack custom colors
const FALLBACK_COLORS = CHART_COLORS;

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No category data available yet.
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={3}
          strokeWidth={0}
        >
          {chartData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={chartTheme.tooltip.contentStyle}
          itemStyle={chartTheme.tooltip.itemStyle}
          labelStyle={chartTheme.tooltip.labelStyle}
          formatter={(value: any, name: any) => [`${value} transactions`, name]}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={chartTheme.legend.wrapperStyle}
          formatter={(value: string) => (
            <span className="text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
