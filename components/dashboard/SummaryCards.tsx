import { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export function SummaryCards({ data }: { data: DashboardSummary }) {
  const getChangeColor = (change: number, isExpense: boolean = false) => {
    if (change === 0) return "text-muted-foreground";
    if (isExpense) {
      return change > 0 ? "text-rose-500" : "text-emerald-500";
    }
    return change > 0 ? "text-emerald-500" : "text-rose-500";
  };

  const getChangeIcon = (change: number) => {
    if (change === 0) return null;
    return change > 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="h-16 w-16" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.netBalance)}</div>
          <p className="text-xs flex items-center mt-1">
            <span className={`flex items-center font-medium ${getChangeColor(data.balanceChange)}`}>
              {getChangeIcon(data.balanceChange)}
              {Math.abs(data.balanceChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-2">from last period</span>
          </p>
        </CardContent>
      </Card>

      {/* Income Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
            {formatCurrency(data.totalIncome)}
          </div>
          <p className="text-xs flex items-center mt-1">
            <span className={`flex items-center font-medium ${getChangeColor(data.incomeChange)}`}>
              {getChangeIcon(data.incomeChange)}
              {Math.abs(data.incomeChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-2">from last period</span>
          </p>
        </CardContent>
      </Card>

      {/* Expense Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-500 dark:text-rose-400">
            {formatCurrency(data.totalExpenses)}
          </div>
          <p className="text-xs flex items-center mt-1">
            <span className={`flex items-center font-medium ${getChangeColor(data.expenseChange, true)}`}>
              {getChangeIcon(data.expenseChange)}
              {Math.abs(data.expenseChange).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-2">from last period</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
