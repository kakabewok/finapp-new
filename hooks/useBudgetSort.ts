import { useState, useMemo } from "react";
import { BudgetSummary } from "@/types";

export type SortField =
  | "category_name"
  | "budget_amount"
  | "spent_amount"
  | "remaining_amount"
  | "percentage_used"
  | "status";

export type SortOrder = "asc" | "desc";

export function useBudgetSort(budgets: BudgetSummary[]) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // By default, category_name sorts asc (A-Z), amounts sort desc (highest first)
      if (field === "category_name") {
        setSortOrder("asc");
      } else {
        setSortOrder("desc");
      }
    }
  };

  const sortedBudgets = useMemo(() => {
    if (!sortField) return budgets;

    return [...budgets].sort((a, b) => {
      if (sortField === "status") {
        // Order: Overbudget (3) -> Warning/Near Limit (2) -> Normal (1)
        const weight: Record<string, number> = {
          overbudget: 3,
          warning: 2,
          normal: 1,
        };
        const aW = weight[a.status] || 0;
        const bW = weight[b.status] || 0;
        // desc = Overbudget first
        return sortOrder === "asc" ? aW - bW : bW - aW;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [budgets, sortField, sortOrder]);

  return { sortedBudgets, sortField, sortOrder, handleSort };
}
