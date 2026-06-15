"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CategoryBreakdownItem } from "@/types";
import { chartTheme, getChartColor } from "@/lib/chart-theme";

export function CategoryBreakdown({ data }: { data: CategoryBreakdownItem[] }) {
  const totalExpense = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription>Top spending categories</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
            No expense data available.
          </div>
        ) : (
          <div className="h-[300px] w-full flex flex-col">
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getChartColor(index, entry.color)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={chartTheme.tooltip.contentStyle}
                    itemStyle={chartTheme.tooltip.itemStyle}
                    labelStyle={chartTheme.tooltip.labelStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom center label */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-bold">{formatCurrency(totalExpense)}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 pr-2">
              <div className="space-y-3">
                {data.map((category, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CategoryBadge 
                        icon={category.icon} 
                        color={getChartColor(index, category.color)} 
                        name={category.name} 
                        showName 
                        size="sm" 
                        className="truncate max-w-[150px] sm:max-w-[180px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                      <span className="font-semibold">{formatCurrency(category.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
