"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { Transaction } from "@/types";
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/transactions?limit=5");
        if (res.ok) {
          const { data } = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
      case 'expense': return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No recent transactions found.
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-full">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">
                      {transaction.merchant_name || 'Unknown'}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span>{formatRelativeTime(transaction.transaction_date)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {(() => {
                          const IconComponent = getIcon(transaction.category?.icon);
                          return <IconComponent size={14} className="text-muted-foreground" />;
                        })()}
                        {transaction.category?.name || "Uncategorized"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`font-medium ${
                  transaction.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : ''
                }`}>
                  {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <Button variant="ghost" className="w-full text-muted-foreground" asChild>
          <Link href="/transactions">
            View All Transactions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
