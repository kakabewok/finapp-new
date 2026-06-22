"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Transaction } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Loader2, ReceiptText, ArrowDownRight } from "lucide-react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface BudgetTransactionListProps {
  budgetId: string;
}

export function BudgetTransactionList({ budgetId }: BudgetTransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/budgets/${budgetId}/transactions`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch linked transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [budgetId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {count} transaction{count !== 1 ? "s" : ""} found
      </p>

      {transactions.length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed bg-muted/20">
          <ReceiptText className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-muted-foreground text-sm">No transactions recorded for this budget period yet</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden divide-y">
          {transactions.map((tx) => (
            <Link
              key={tx.id}
              href={`/transactions/${tx.id}`}
              className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-muted rounded-full shrink-0">
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {tx.merchant_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.transaction_date)}
                  </p>
                  {tx.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tx.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm font-semibold text-rose-500">
                  -{formatCurrency(tx.amount, tx.currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
