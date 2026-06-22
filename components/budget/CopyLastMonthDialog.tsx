"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Copy, X, AlertCircle, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { format } from "date-fns";

interface PrevBudgetItem {
  id: string;
  category_id: string;
  amount: number;
  notes?: string | null;
  categories: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  } | null;
}

interface Period {
  start_date: string;
  end_date: string;
  budget_count: number;
}

interface CopyLastMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CopyLastMonthDialog({
  open,
  onOpenChange,
  onSuccess,
}: CopyLastMonthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prevBudgets, setPrevBudgets] = useState<PrevBudgetItem[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [hasFetched, setHasFetched] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [sourcePeriodStr, setSourcePeriodStr] = useState<string>("");
  const [isFetchingPeriods, setIsFetchingPeriods] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // New period state
  const [targetStartDate, setTargetStartDate] = useState<Date | undefined>(new Date());
  const [targetEndDate, setTargetEndDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
  });

  const fetchAvailablePeriods = async () => {
    setIsFetchingPeriods(true);
    try {
      const res = await fetch(`/api/budgets/available-months?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAvailablePeriods(data.periods || []);
        if (data.periods && data.periods.length > 0) {
          const latest = data.periods[0];
          const periodStr = `${latest.start_date}_${latest.end_date}`;
          setSourcePeriodStr(periodStr);
          fetchSourceBudgets(latest.start_date, latest.end_date);
        } else {
          setHasFetched(true);
        }
      }
    } catch (error) {
      toast.error("Failed to load available periods");
    } finally {
      setIsFetchingPeriods(false);
    }
  };

  const fetchSourceBudgets = async (start: string, end: string) => {
    setIsLoading(true);
    setHasFetched(false);
    try {
      const res = await fetch(
        `/api/budgets/copy-last-month?sourceStart=${start}&sourceEnd=${end}&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setPrevBudgets(data.budgets);

      // Pre-populate amounts with the source month's values
      const initialAmounts: Record<string, string> = {};
      data.budgets.forEach((b: PrevBudgetItem) => {
        initialAmounts[b.category_id] = b.amount.toString();
      });
      setAmounts(initialAmounts);
      setHasFetched(true);
    } catch (error) {
      toast.error("Failed to fetch budgets for the selected period");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available periods whenever dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailablePeriods();
      setTargetStartDate(new Date());
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
      setTargetEndDate(d);
    } else {
      // Reset state when dialog closes
      setPrevBudgets([]);
      setAmounts({});
      setHasFetched(false);
      setSourcePeriodStr("");
      setAvailablePeriods([]);
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
    if (!targetStartDate || !targetEndDate) {
      toast.error("Please select start and end dates for the new budgets");
      return;
    }

    if (targetEndDate <= targetStartDate) {
      toast.error("End date must be after start date");
      return;
    }

    const entriesToSave = prevBudgets.filter(
      (b) => !excludedIds.has(b.category_id) && amounts[b.category_id] && parseFloat(amounts[b.category_id]) > 0
    );

    if (entriesToSave.length === 0) {
      toast.error("Please fill in at least one budget amount");
      return;
    }

    setIsSaving(true);
    try {
      const formatApiDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const startStr = formatApiDate(targetStartDate);
      const endStr = formatApiDate(targetEndDate);

      // Save each budget entry using the POST endpoint
      const results = await Promise.allSettled(
        entriesToSave.map((b) =>
          fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category_id: b.category_id,
              amount: parseFloat(amounts[b.category_id]),
              start_date: startStr,
              end_date: endStr,
              is_recurring: false,
              is_rollover: false,
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
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copy Budgets
          </DialogTitle>
          <DialogDescription>
            {isFetchingPeriods
              ? "Loading available periods..."
              : availablePeriods.length > 0
                ? "Copy budgets from a past period into a new date range."
                : "No past budget data available to copy."}
          </DialogDescription>
        </DialogHeader>

        {availablePeriods.length > 0 && !isFetchingPeriods && (
          <div className="space-y-4 px-1 pt-2">
            <div className="space-y-2">
              <Label>Source Period</Label>
              <Select
                value={sourcePeriodStr}
                onValueChange={(val) => {
                  setSourcePeriodStr(val);
                  const [start, end] = val.split("_");
                  fetchSourceBudgets(start, end);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select period to copy from" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((p) => (
                    <SelectItem key={`${p.start_date}_${p.end_date}`} value={`${p.start_date}_${p.end_date}`}>
                      {formatDate(p.start_date)} – {formatDate(p.end_date)} ({p.budget_count} budgets)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>New Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !targetStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetStartDate ? format(targetStartDate, "d MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={targetStartDate}
                      onSelect={setTargetStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>New End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !targetEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetEndDate ? format(targetEndDate, "d MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={targetEndDate}
                      onSelect={setTargetEndDate}
                      disabled={(date) => targetStartDate ? date <= targetStartDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {targetStartDate && targetEndDate && targetEndDate <= targetStartDate && (
              <p className="text-xs text-destructive">End date must be after start date</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {isFetchingPeriods || isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasFetched && prevBudgets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">
                No budgets found for the selected period.
              </p>
            </div>
          ) : (
            <>
              {visibleBudgets.length > 0 && (
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {visibleBudgets.length} of {prevBudgets.length} categories to copy
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
                  </div>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amounts[budget.category_id] || ""}
                    onChange={(e) =>
                      handleAmountChange(budget.category_id, e.target.value)
                    }
                    className="w-[120px] text-right font-medium"
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
                disabled={isSaving || filledCount === 0 || !targetStartDate || !targetEndDate || targetEndDate <= targetStartDate}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Copy ${filledCount} Budget${filledCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
