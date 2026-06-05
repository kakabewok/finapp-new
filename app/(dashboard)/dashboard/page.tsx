"use client";

import { useState, useEffect } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendingTrendChart } from "@/components/dashboard/SpendingTrendChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dashboard?range=${dateRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Your financial summary at a glance.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-[120px] w-full rounded-lg" />
            <Skeleton className="h-[120px] w-full rounded-lg" />
            <Skeleton className="h-[120px] w-full rounded-lg" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[400px] col-span-1 lg:col-span-2 rounded-lg" />
            <Skeleton className="h-[400px] col-span-1 rounded-lg" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <SummaryCards data={data.summary} />
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <SpendingTrendChart data={data.trendData} />
            <CategoryBreakdown data={data.categoryBreakdown} />
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <IncomeExpenseChart data={data.trendData} />
            </div>
            <div className="lg:col-span-3">
              <RecentTransactions />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Failed to load dashboard data.
        </div>
      )}
    </div>
  );
}
