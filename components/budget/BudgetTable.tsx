"use client";

import { useState } from "react";
import { BudgetSummary } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Edit2, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { SortField, SortOrder } from "@/hooks/useBudgetSort";

interface BudgetTableProps {
  budgets: BudgetSummary[];
  velocities: Record<string, any>;
  onEdit: (budget: BudgetSummary) => void;
  onDelete: (id: string) => void;
  isSelectMode?: boolean;
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  isAllSelected: (ids: string[]) => boolean;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  sortField: SortField | null;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export function BudgetTable({
  budgets,
  velocities,
  onEdit,
  onDelete,
  isSelectMode,
  isSelected,
  onToggleSelect,
  isAllSelected,
  selectAll,
  clearSelection,
  sortField,
  sortOrder,
  onSort,
}: BudgetTableProps) {
  const totalPlanned = budgets.reduce((s, b) => s + b.effective_budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent_amount, 0);
  const totalRemaining = totalPlanned - totalSpent;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const getStatusBadge = (budget: BudgetSummary) => {
    if (budget.status === "overbudget") {
      return (
        <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/25">
          Over Budget
        </Badge>
      );
    }
    if (budget.percentage_used >= 80 && budget.percentage_used < 100) {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/25">
          Near Limit
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25">
        On Track
      </Badge>
    );
  };

  const getProgressColor = (budget: BudgetSummary) => {
    if (budget.status === "overbudget") return "bg-rose-500";
    if (budget.status === "warning") return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {isSelectMode && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected(budgets.map((b) => b.id))}
                  onCheckedChange={(checked) => {
                    if (checked) selectAll(budgets.map((b) => b.id));
                    else clearSelection();
                  }}
                />
              </TableHead>
            )}
            <TableHead>
              <button
                type="button"
                onClick={() => onSort("category_name")}
                className="flex items-center font-medium hover:text-foreground transition-colors"
              >
                Category
                <SortIcon field="category_name" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                onClick={() => onSort("budget_amount")}
                className="flex items-center justify-end font-medium hover:text-foreground transition-colors w-full"
              >
                Planned
                <SortIcon field="budget_amount" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                onClick={() => onSort("spent_amount")}
                className="flex items-center justify-end font-medium hover:text-foreground transition-colors w-full"
              >
                Spent
                <SortIcon field="spent_amount" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                onClick={() => onSort("remaining_amount")}
                className="flex items-center justify-end font-medium hover:text-foreground transition-colors w-full"
              >
                Remaining
                <SortIcon field="remaining_amount" />
              </button>
            </TableHead>
            <TableHead className="w-[140px]">
              <button
                type="button"
                onClick={() => onSort("percentage_used")}
                className="flex items-center font-medium hover:text-foreground transition-colors"
              >
                Progress
                <SortIcon field="percentage_used" />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => onSort("status")}
                className="flex items-center font-medium hover:text-foreground transition-colors"
              >
                Status
                <SortIcon field="status" />
              </button>
            </TableHead>
            <TableHead className="w-[50px] text-center">Notes</TableHead>
            <TableHead className="w-[90px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => {
            const velocityMessage = velocities[budget.id]?.message;
            const velocityStatus = velocities[budget.id]?.velocityStatus;
            const remaining = budget.remaining_amount;

            return (
              <TableRow
                key={budget.id}
                className={
                  isSelectMode && isSelected(budget.id)
                    ? "bg-primary/5"
                    : ""
                }
                onClick={() => {
                  if (isSelectMode) onToggleSelect(budget.id);
                }}
              >
                {isSelectMode && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected(budget.id)}
                      onCheckedChange={() => onToggleSelect(budget.id)}
                    />
                  </TableCell>
                )}

                {/* Category */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <CategoryBadge
                      icon={budget.category_icon}
                      color={budget.category_color}
                      size="sm"
                    />
                    <span className="font-medium">{budget.category_name}</span>
                  </div>
                </TableCell>

                {/* Planned */}
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(budget.effective_budget, "IDR")}
                </TableCell>

                {/* Spent */}
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(budget.spent_amount, "IDR")}
                </TableCell>

                {/* Remaining */}
                <TableCell
                  className={`text-right font-medium tabular-nums ${
                    remaining < 0
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatCurrency(Math.abs(remaining), "IDR")}
                  {remaining < 0 && (
                    <span className="text-[10px] ml-0.5 opacity-70">over</span>
                  )}
                </TableCell>

                {/* Progress */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={Math.min(100, budget.percentage_used)}
                      className="h-1.5 flex-1"
                      indicatorClassName={getProgressColor(budget)}
                    />
                    <span className="text-xs text-muted-foreground tabular-nums w-[36px] text-right">
                      {budget.percentage_used}%
                    </span>
                    {velocityMessage && (
                      <InfoTooltip
                        text={velocityMessage}
                        buttonClassName={`rounded-full p-0.5 ${
                          velocityStatus === "overbudget"
                            ? "text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20"
                            : velocityStatus === "warning"
                            ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                            : "text-emerald-500 hover:text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                        }`}
                      />
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>{getStatusBadge(budget)}</TableCell>

                {/* Notes */}
                <TableCell className="text-center">
                  {budget.notes ? (
                    <InfoTooltip
                      text={budget.notes}
                      buttonClassName="rounded-full p-0.5 text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
                    />
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(budget);
                      }}
                      className="h-8 w-8"
                      aria-label="Edit budget"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(budget.id);
                      }}
                      className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Delete budget"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/40 hover:bg-muted/40 font-semibold">
            {isSelectMode && <TableCell />}
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(totalPlanned, "IDR")}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(totalSpent, "IDR")}
            </TableCell>
            <TableCell
              className={`text-right font-semibold tabular-nums ${
                totalRemaining < 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(totalRemaining, "IDR")}
            </TableCell>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
