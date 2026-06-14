"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Loader2, Copy, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface PrevBudgetItem {
  id: string;
  category_id: string;
  amount: number;
  rollover_enabled: boolean;
  categories: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  } | null;
}

interface CopyLastMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: number;
  selectedYear: number;
  onSuccess: () => void;
}

export function CopyLastMonthDialog({
  open,
  onOpenChange,
  selectedMonth,
  selectedYear,
  onSuccess,
}: CopyLastMonthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prevBudgets, setPrevBudgets] = useState<PrevBudgetItem[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [prevMonthLabel, setPrevMonthLabel] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const fetchPreviousMonth = async () => {
    setIsLoading(true);
    setHasFetched(false);
    try {
      const res = await fetch(
        `/api/budgets/copy-last-month?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setPrevBudgets(data.budgets);
      setPrevMonthLabel(
        new Date(data.prevYear, data.prevMonth - 1).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })
      );

      // Initialize amounts as empty strings
      const initialAmounts: Record<string, string> = {};
      data.budgets.forEach((b: PrevBudgetItem) => {
        initialAmounts[b.category_id] = "";
      });
      setAmounts(initialAmounts);
      setHasFetched(true);
    } catch (error) {
      toast.error("Failed to fetch last month's budgets");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchPreviousMonth();
    } else {
      setPrevBudgets([]);
      setAmounts({});
      setHasFetched(false);
    }
    onOpenChange(newOpen);
  };

  const handleAmountChange = (categoryId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleCopyAll = () => {
    const newAmounts: Record<string, string> = {};
    prevBudgets.forEach((b) => {
      newAmounts[b.category_id] = b.amount.toString();
    });
    setAmounts(newAmounts);
    toast.info("Amounts copied from last month");
  };

  const handleSave = async () => {
    // Filter out entries with empty amounts
    const entriesToSave = prevBudgets.filter(
      (b) => amounts[b.category_id] && parseFloat(amounts[b.category_id]) > 0
    );

    if (entriesToSave.length === 0) {
      toast.error("Please fill in at least one budget amount");
      return;
    }

    setIsSaving(true);
    try {
      // Save each budget entry using the existing POST endpoint (which upserts)
      const results = await Promise.allSettled(
        entriesToSave.map((b) =>
          fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category_id: b.category_id,
              month: selectedMonth,
              year: selectedYear,
              amount: parseFloat(amounts[b.category_id]),
              rollover_enabled: b.rollover_enabled,
            }),
          })
        )
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures > 0) {
        toast.warning(`${successes} budgets created, ${failures} failed`);
      } else {
        toast.success(`${successes} budgets created successfully`);
      }

      onSuccess();
      handleOpenChange(false);
    } catch (error) {
      toast.error("Failed to save budgets");
    } finally {
      setIsSaving(false);
    }
  };

  const filledCount = Object.values(amounts).filter(
    (v) => v && parseFloat(v) > 0
  ).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy from Last Month
          </DialogTitle>
          <DialogDescription>
            {prevMonthLabel
              ? `Copy budget categories from ${prevMonthLabel}. Fill in the amounts you want for the current month.`
              : "Fetching last month's budget data..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasFetched && prevBudgets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">
                No budgets found for the previous month.
              </p>
              <p className="text-sm text-muted-foreground/70">
                Create budgets manually using the &quot;Add Budget&quot; button.
              </p>
            </div>
          ) : (
            <>
              {/* Quick action: Copy all amounts */}
              {prevBudgets.length > 0 && (
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {prevBudgets.length} categories from {prevMonthLabel}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAll}
                    className="text-xs h-7"
                  >
                    Copy all amounts too
                  </Button>
                </div>
              )}

              {prevBudgets.map((budget) => (
                <div
                  key={budget.category_id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <CategoryBadge
                    icon={budget.categories?.icon}
                    color={budget.categories?.color}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {budget.categories?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last month: {formatCurrency(budget.amount, "IDR")}
                    </p>
                  </div>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amounts[budget.category_id] || ""}
                    onChange={(e) =>
                      handleAmountChange(budget.category_id, e.target.value)
                    }
                    className="w-[140px] text-right"
                    min="0"
                    step="1000"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {prevBudgets.length > 0 && (
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 border-t pt-4">
            <span className="text-sm text-muted-foreground self-center">
              {filledCount} of {prevBudgets.length} filled
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || filledCount === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${filledCount} Budget${filledCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
