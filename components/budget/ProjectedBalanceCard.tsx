"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ProjectedBalanceCardProps {
  month: number;
  year: number;
  refreshTrigger?: any;
}

export function ProjectedBalanceCard({ month, year, refreshTrigger }: ProjectedBalanceCardProps) {
  const [data, setData] = useState<{
    totalIncome: number;
    totalBudgetAllocated: number;
    projectedRemaining: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjection = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets/projection?month=${month}&year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch projected balance:", error);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchProjection();
  }, [fetchProjection, refreshTrigger]);

  if (isLoading && !data) {
    return <Skeleton className="h-[120px] w-full rounded-lg" />;
  }

  if (!data) return null;

  const isNegative = data.projectedRemaining < 0;
  const noBudgetSet = data.totalBudgetAllocated === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          Projected Remaining Balance
          <InfoTooltip text="Estimated remaining balance if all budgets this month are fully spent as planned." />
        </CardTitle>
        <Wallet className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
          {formatCurrency(data.projectedRemaining)}
        </div>
        <p className="text-xs mt-1 text-muted-foreground">
          {noBudgetSet ? (
            "No budget planner set for this month. We recommend creating one."
          ) : isNegative ? (
            <span className="text-rose-500 font-medium">Total budget exceeds income</span>
          ) : (
            "If all budgets are spent as planned"
          )}
        </p>
      </CardContent>
    </Card>
  );
}
