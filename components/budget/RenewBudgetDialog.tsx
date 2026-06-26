"use client";

import { useState } from "react";
import { BudgetSummary } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CalendarDays, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface RenewBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetSummary | null;
  onSuccess: () => void;
  workspaceId?: string | null;
}

export function RenewBudgetDialog({ open, onOpenChange, budget, onSuccess, workspaceId }: RenewBudgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!budget) return null;

  // Calculate new period preview
  const startDate = new Date(budget.start_date);
  const endDate = new Date(budget.end_date);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

  const newStartDate = new Date(endDate);
  newStartDate.setDate(newStartDate.getDate() + 1);

  const newEndDate = new Date(newStartDate);
  newEndDate.setDate(newEndDate.getDate() + durationDays);

  // Estimate new planned amount with rollover
  const remaining = budget.remaining_amount;
  const hasRollover = budget.is_rollover && remaining > 0;
  const estimatedNewAmount = hasRollover 
    ? budget.budget_amount + remaining 
    : budget.budget_amount;

  const handleRenew = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets/${budget.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId || null }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to renew budget");
      }

      toast.success("Budget renewed for the next period!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateShort = (d: Date) => {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Renew Budget
          </DialogTitle>
          <DialogDescription>
            Renew &quot;{budget.category_name}&quot; for the next period. The current period will be archived to history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Period Summary */}
          <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Period (will be archived)</p>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(budget.start_date)} – {formatDate(budget.end_date)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Planned</p>
                <p className="font-medium">{formatCurrency(budget.effective_budget, "IDR")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="font-medium">{formatCurrency(budget.spent_amount, "IDR")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className={`font-medium ${remaining >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {formatCurrency(Math.abs(remaining), "IDR")}
                  {remaining < 0 && <span className="text-[10px] ml-0.5">over</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
          </div>

          {/* New Period Preview */}
          <div className="rounded-lg border p-3 space-y-2 border-blue-500/30 bg-blue-500/5">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">New Period</p>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{formatDateShort(newStartDate)} – {formatDateShort(newEndDate)}</span>
              <Badge variant="outline" className="text-[10px] h-5">{durationDays + 1} days</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planned Amount</p>
              <p className="font-semibold text-lg">{formatCurrency(estimatedNewAmount, "IDR")}</p>
              {hasRollover && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Includes {formatCurrency(remaining, "IDR")} rolled over from previous period
                </p>
              )}
              {budget.is_rollover && remaining <= 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  No rollover (over budget in previous period)
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRenew} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Confirm Renewal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
