"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [availableMonths, setAvailableMonths] = useState<{ month: number; year: number }[]>([]);
  const [sourceMonth, setSourceMonth] = useState<number | null>(null);
  const [sourceYear, setSourceYear] = useState<number | null>(null);
  const [isFetchingMonths, setIsFetchingMonths] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const fetchAvailableMonths = async () => {
    setIsFetchingMonths(true);
    try {
      const res = await fetch(`/api/budgets/available-months?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Filter out the current target month so you can't copy a month into itself
        const filteredMonths = (data.availableMonths || []).filter(
          (m: { month: number; year: number }) => !(m.month === selectedMonth && m.year === selectedYear)
        );
        setAvailableMonths(filteredMonths);
        if (filteredMonths.length > 0) {
          const latest = filteredMonths[0];
          setSourceMonth(latest.month);
          setSourceYear(latest.year);
          fetchSourceMonth(latest.month, latest.year);
        } else {
          setHasFetched(true);
        }
      }
    } catch (error) {
      toast.error("Failed to load available months");
    } finally {
      setIsFetchingMonths(false);
    }
  };

  const fetchSourceMonth = async (sMonth: number, sYear: number) => {
    setIsLoading(true);
    setHasFetched(false);
    try {
      const res = await fetch(
        `/api/budgets/copy-last-month?month=${selectedMonth}&year=${selectedYear}&sourceMonth=${sMonth}&sourceYear=${sYear}&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setPrevBudgets(data.budgets);
      setPrevMonthLabel(
        new Date(sYear, sMonth - 1).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })
      );

      // Pre-populate amounts with the source month's values
      const initialAmounts: Record<string, string> = {};
      data.budgets.forEach((b: PrevBudgetItem) => {
        initialAmounts[b.category_id] = b.amount.toString();
      });
      setAmounts(initialAmounts);
      setHasFetched(true);
    } catch (error) {
      toast.error("Failed to fetch budgets for the selected month");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available months whenever dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableMonths();
    } else {
      // Reset state when dialog closes
      setPrevBudgets([]);
      setAmounts({});
      setHasFetched(false);
      setSourceMonth(null);
      setSourceYear(null);
      setAvailableMonths([]);
      setExcludedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAmountChange = (categoryId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleResetAmounts = () => {
    const resetAmounts: Record<string, string> = {};
    prevBudgets.forEach((b) => {
      resetAmounts[b.category_id] = b.amount.toString();
    });
    setAmounts(resetAmounts);
    setExcludedIds(new Set());
    toast.info("Amounts reset to original values");
  };

  const handleExcludeItem = (categoryId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
  };

  const handleSave = async () => {
    // Filter out excluded and empty entries
    const entriesToSave = prevBudgets.filter(
      (b) => !excludedIds.has(b.category_id) && amounts[b.category_id] && parseFloat(amounts[b.category_id]) > 0
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
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save budgets");
    } finally {
      setIsSaving(false);
    }
  };

  const visibleBudgets = prevBudgets.filter((b) => !excludedIds.has(b.category_id));
  const filledCount = visibleBudgets.filter(
    (b) => amounts[b.category_id] && parseFloat(amounts[b.category_id]) > 0
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Budget From...
          </DialogTitle>
          <DialogDescription>
            {isFetchingMonths
              ? "Loading available months..."
              : availableMonths.length > 0
                ? "Amounts are pre-filled from the selected month. Edit any values below, then confirm to copy."
                : "No past budget data available to copy."}
          </DialogDescription>
        </DialogHeader>

        {availableMonths.length > 0 && !isFetchingMonths && (
          <div className="px-1 pt-2">
            <Select
              value={sourceMonth && sourceYear ? `${sourceYear}-${sourceMonth}` : ""}
              onValueChange={(val) => {
                const [y, m] = val.split("-").map(Number);
                setSourceMonth(m);
                setSourceYear(y);
                fetchSourceMonth(m, y);
              }}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {new Date(m.year, m.month - 1).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {isFetchingMonths || isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasFetched && prevBudgets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">
                No budgets found for the selected month.
              </p>
              <p className="text-sm text-muted-foreground/70">
                Create budgets manually using the &quot;Add Budget&quot; button.
              </p>
            </div>
          ) : (
            <>
              {/* Quick action: Copy all amounts */}
              {visibleBudgets.length > 0 && (
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {visibleBudgets.length} of {prevBudgets.length} categories from {prevMonthLabel}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAmounts}
                    className="text-xs h-7"
                  >
                    Reset all
                  </Button>
                </div>
              )}

              {visibleBudgets.map((budget) => (
                <div
                  key={budget.category_id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
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
                      {prevMonthLabel}: {formatCurrency(budget.amount, "IDR")}
                    </p>
                  </div>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amounts[budget.category_id] || ""}
                    onChange={(e) =>
                      handleAmountChange(budget.category_id, e.target.value)
                    }
                    className="w-[120px] text-right"
                    min="0"
                    step="1000"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleExcludeItem(budget.category_id)}
                    aria-label={`Remove ${budget.categories?.name || "item"}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>

        {visibleBudgets.length > 0 && (
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 border-t pt-4">
            <span className="text-sm text-muted-foreground self-center">
              {filledCount} of {visibleBudgets.length} filled
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                  `Confirm ${filledCount} Budget${filledCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
