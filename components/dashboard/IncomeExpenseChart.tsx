"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface TrendData {
  date: string;
  income: number;
  expense: number;
}

export function IncomeExpenseChart({ data }: { data: TrendData[] }) {
  // Aggregate data by month or week if there are too many points, 
  // or just format the date. For simplicity, we just use the raw trend data 
  // (which is daily) and format the date.
  const formattedData = data.map(d => ({
    ...d,
    formattedDate: d.date ? format(parseISO(d.date), "MMM dd") : "",
  }));

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
        <CardDescription>Daily comparison of your cash flow</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
            No data available.
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `Rp ${value / 1000}k`}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
                          <p className="font-medium text-sm mb-2">{label}</p>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm mb-1">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="capitalize text-muted-foreground">{entry.name}</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(entry.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  formatter={(value) => <span className="text-sm font-medium text-foreground capitalize">{value}</span>}
                />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
