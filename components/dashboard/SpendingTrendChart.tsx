"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { chartTheme } from "@/lib/chart-theme";

interface TrendData {
  date: string;
  income: number;
  expense: number;
}

export function SpendingTrendChart({ data }: { data: TrendData[] }) {
  // If no data or just one point, the chart might look weird.
  // We format dates for x-axis.
  const formattedData = data.map(d => ({
    ...d,
    formattedDate: d.date ? format(parseISO(d.date), "MMM dd") : "",
  }));

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle>Cash Flow Trend</CardTitle>
        <CardDescription>Income vs expenses over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
            No transaction data available for this period.
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray={chartTheme.grid.strokeDasharray} vertical={chartTheme.grid.vertical} stroke={chartTheme.grid.stroke} />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={chartTheme.axis}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={chartTheme.axis}
                  tickFormatter={(value) => `Rp ${value / 1000}k`}
                  width={80}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-foreground">
                          <p className="font-medium text-sm mb-2 text-foreground">{label}</p>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm text-foreground">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="capitalize text-muted-foreground">{entry.name}:</span>
                              <span className="font-semibold text-foreground">{formatCurrency(entry.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Expense"
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
