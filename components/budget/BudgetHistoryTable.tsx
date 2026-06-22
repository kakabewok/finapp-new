"use client";

import { useState, useEffect } from "react";
import { BudgetHistory } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, History } from "lucide-react";

interface BudgetHistoryTableProps {
  budgetId: string;
}

export function BudgetHistoryTable({ budgetId }: BudgetHistoryTableProps) {
  const [history, setHistory] = useState<BudgetHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/budgets/${budgetId}/history`);
        if (res.ok) {
          setHistory(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch budget history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [budgetId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No previous periods recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Planned</TableHead>
            <TableHead className="text-right">Spent</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-sm">
                {formatDate(h.start_date)} – {formatDate(h.end_date)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(h.planned_amount, "IDR")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(h.total_spent, "IDR")}
              </TableCell>
              <TableCell
                className={`text-right font-medium tabular-nums ${
                  h.remaining_amount < 0
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(Math.abs(h.remaining_amount), "IDR")}
                {h.remaining_amount < 0 && (
                  <span className="text-[10px] ml-0.5 opacity-70">over</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
